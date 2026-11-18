import type { ModelUsage, SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { AgentMetrics, ToolKind } from './types'
import process from 'node:process'
import { query } from '@anthropic-ai/claude-agent-sdk'

export interface AgentOptions {
  model: string
  maxTurns: number
  timeoutMs: number
}

const GATEWAY_URL = 'https://ai-gateway.vercel.sh'

/**
 * The env of the agent process. With only `AI_GATEWAY_API_KEY` set, route through the Vercel AI Gateway.
 * With a gateway token, drop `ANTHROPIC_API_KEY`: Claude Code sends it as `x-api-key` and the gateway rejects it.
 */
function agentEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = { ...env, NO_COLOR: '1', CI: '1' }
  if (env.AI_GATEWAY_API_KEY && !env.ANTHROPIC_BASE_URL) {
    out.ANTHROPIC_BASE_URL = GATEWAY_URL
    out.ANTHROPIC_AUTH_TOKEN = env.AI_GATEWAY_API_KEY
  }
  if (out.ANTHROPIC_AUTH_TOKEN)
    delete out.ANTHROPIC_API_KEY
  return out
}

/** Where the agent's API calls go, for the log. */
export function describeAuth(env = agentEnv()): string {
  if (env.ANTHROPIC_AUTH_TOKEN)
    return `ANTHROPIC_AUTH_TOKEN via ${env.ANTHROPIC_BASE_URL ?? 'api.anthropic.com'}`
  if (env.ANTHROPIC_API_KEY)
    return `ANTHROPIC_API_KEY via ${env.ANTHROPIC_BASE_URL ?? 'api.anthropic.com'}`
  return 'your local Claude Code login (no API key or gateway token set)'
}

const APPEND = 'You are working on a Nuxt 4 app in the current working directory. Only read and change files inside it.'

function toolResultText(content: unknown): string {
  if (typeof content === 'string')
    return content
  if (Array.isArray(content)) {
    return content.map(part => (part && typeof part === 'object' && 'text' in part
      ? String(part.text)
      : '')).join('\n')
  }
  return ''
}

const TOOL_KINDS: Record<string, ToolKind> = {
  Read: 'explore',
  Grep: 'explore',
  Glob: 'explore',
  LS: 'explore',
  Edit: 'edit',
  MultiEdit: 'edit',
  Write: 'edit',
  NotebookEdit: 'edit',
}

/** Sort one simple command by what it does. Verify wins over edit, edit over explore. */
function commandKind(command: string): ToolKind {
  if (/\b(?:typecheck|vue-tsc|tsc|build|vitest|test)\b/.test(command))
    return 'verify'
  // `>` writes a file, but not `2>`, `&>`, `>&2` or `> /dev/null`.
  if (/\bsed\s+-i\b|\b(?:mv|cp|rm|mkdir|touch|tee)\s|(?<![\d&])>(?!&|\s*\/dev\/null)|\bgit\s+mv\b/.test(command))
    return 'edit'
  if (/\b(?:cat|head|tail|less|grep|rg|find|ls|tree|sed|awk|wc|git\s+(?:grep|log|show|diff|status))\b/.test(command))
    return 'explore'
  return 'other'
}

/** Drop heredoc bodies: keep each `<<EOF` line, skip the lines up to the closing `EOF`. */
function dropHeredocs(command: string): string {
  const out: string[] = []
  let end: string | undefined
  for (const line of command.split('\n')) {
    if (end !== undefined) {
      if (line.trim() === end)
        end = undefined
      continue
    }
    out.push(line)
    end = /<<-?\s*['"]?(\w+)/.exec(line)?.[1]
  }
  return out.join('\n')
}

/**
 * Every kind a Bash command does. Heredoc bodies and quoted text are dropped first,
 * so a `>` in written content or in a search pattern is not read as a redirect.
 * Chained commands (`&&`, `||`, `;`, new lines) are sorted one by one.
 */
function bashKinds(command: string): ToolKind[] {
  const skeleton = dropHeredocs(command).replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, '""')
  const kinds = new Set<ToolKind>()
  for (const command of skeleton.split(/&&|\|\||[;\n]/)) {
    // Later pipeline stages (`| tail`, `| grep`) only filter output, unless they write a file.
    const [first = '', ...rest] = command.split('|')
    kinds.add(commandKind(first))
    if (rest.some(stage => commandKind(stage) === 'edit'))
      kinds.add('edit')
  }
  if (kinds.size > 1)
    kinds.delete('other')
  return [...kinds]
}

function toolKinds(name: string, input: unknown): ToolKind[] {
  if (name === 'Bash') {
    const command = input && typeof input === 'object' && 'command' in input
      ? String(input.command)
      : ''
    return bashKinds(command)
  }
  return [TOOL_KINDS[name] ?? 'other']
}

function addUsage(metrics: AgentMetrics, usages: ModelUsage[]): void {
  for (const usage of usages) {
    metrics.inputTokens += usage.inputTokens
    metrics.outputTokens += usage.outputTokens
    metrics.cacheReadTokens += usage.cacheReadInputTokens
    metrics.cacheWriteTokens += usage.cacheCreationInputTokens
  }
}

function recordCall(metrics: AgentMetrics, id: string, name: string, input: unknown): void {
  metrics.toolCalls[name] = (metrics.toolCalls[name] ?? 0) + 1
  const kinds = toolKinds(name, input)
  for (const kind of kinds)
    metrics.toolKinds[kind]++
  metrics.calls.push({
    id,
    name,
    kinds,
    input,
    output: '',
  })
}

function recordOutput(metrics: AgentMetrics, id: string, text: string): void {
  metrics.toolOutputChars += text.length
  const call = metrics.calls.find(c => c.id === id)
  if (call) {
    call.output = text
    return
  }
  metrics.calls.push({
    id,
    name: 'unknown',
    kinds: ['other'],
    input: null,
    output: text,
  })
}

/** Count tool calls, log each call with its output and read usage from the final result. */
function record(metrics: AgentMetrics, message: SDKMessage): void {
  if (message.type === 'assistant') {
    for (const block of message.message.content) {
      if (block.type === 'tool_use')
        recordCall(metrics, block.id, block.name, block.input)
    }
  }
  else if (message.type === 'user' && Array.isArray(message.message.content)) {
    for (const block of message.message.content) {
      if (typeof block === 'object' && block.type === 'tool_result')
        recordOutput(metrics, block.tool_use_id, toolResultText(block.content))
    }
  }
  else if (message.type === 'result') {
    metrics.stop = message.subtype
    metrics.turns = message.num_turns
    metrics.costUsd = message.total_cost_usd
    metrics.apiMs = message.duration_api_ms
    addUsage(metrics, Object.values(message.modelUsage))
  }
}

/**
 * Run one agent session in `cwd` and collect its cost and tool output.
 * User and project settings, CLAUDE.md and skills are not loaded, so both arms see only the app.
 */
export async function runAgent(prompt: string, cwd: string, options: AgentOptions): Promise<AgentMetrics> {
  const start = Date.now()
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), options.timeoutMs)
  const metrics: AgentMetrics = {
    stop: 'unknown',
    turns: 0,
    toolCalls: {},
    toolKinds: {
      explore: 0,
      edit: 0,
      verify: 0,
      other: 0,
    },
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    toolOutputChars: 0,
    costUsd: 0,
    ms: 0,
    apiMs: 0,
    calls: [],
  }

  try {
    for await (const message of query({
      prompt,
      options: {
        cwd,
        model: options.model,
        maxTurns: options.maxTurns,
        abortController: abort,
        settingSources: [],
        skills: [],
        systemPrompt: { type: 'preset', preset: 'claude_code', append: APPEND },
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        disallowedTools: [
          'WebFetch',
          'WebSearch',
          'Agent',
          'Task',
        ],
        env: agentEnv(),
      },
    })) {
      record(metrics, message)
    }
  }
  catch (error) {
    metrics.stop = abort.signal.aborted
      ? 'timeout'
      : `error: ${error instanceof Error
        ? error.message
        : error}`
  }
  finally {
    clearTimeout(timer)
    metrics.ms = Date.now() - start
  }
  return metrics
}
