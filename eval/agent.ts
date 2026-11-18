import type { ModelUsage, SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { AgentMetrics, AgentOptions } from './types'
import process from 'node:process'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { APPEND, emptyMetrics, recordCall, recordOutput, toolResultText } from './metrics'

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

/** Where Claude Code's API calls go, for the log. */
export function describeClaudeAuth(env = agentEnv()): string {
  if (env.ANTHROPIC_AUTH_TOKEN)
    return `ANTHROPIC_AUTH_TOKEN via ${env.ANTHROPIC_BASE_URL ?? 'api.anthropic.com'}`
  if (env.ANTHROPIC_API_KEY)
    return `ANTHROPIC_API_KEY via ${env.ANTHROPIC_BASE_URL ?? 'api.anthropic.com'}`
  return 'your local Claude Code login (no API key or gateway token set)'
}

function addUsage(metrics: AgentMetrics, usages: ModelUsage[]): void {
  for (const usage of usages) {
    metrics.inputTokens += usage.inputTokens
    metrics.outputTokens += usage.outputTokens
    metrics.cacheReadTokens += usage.cacheReadInputTokens
    metrics.cacheWriteTokens += usage.cacheCreationInputTokens
  }
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
 * Run one Claude Code session in `cwd` with the Claude Agent SDK and collect its cost and tool output.
 * User and project settings, CLAUDE.md and skills are not loaded, so both arms see only the app.
 */
export async function runClaudeCode(prompt: string, cwd: string, options: AgentOptions): Promise<AgentMetrics> {
  const start = Date.now()
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), options.timeoutMs)
  const metrics = emptyMetrics()

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
