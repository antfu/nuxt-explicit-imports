import type { ModelUsage, SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { AgentMetrics } from './types'
import process from 'node:process'
import { query } from '@anthropic-ai/claude-agent-sdk'

export interface AgentOptions {
  model: string
  maxTurns: number
  timeoutMs: number
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

function addUsage(metrics: AgentMetrics, usages: ModelUsage[]): void {
  for (const usage of usages) {
    metrics.inputTokens += usage.inputTokens
    metrics.outputTokens += usage.outputTokens
    metrics.cacheReadTokens += usage.cacheReadInputTokens
    metrics.cacheWriteTokens += usage.cacheCreationInputTokens
  }
}

/** Count tool calls, keep tool output and read usage from the final result. */
function record(metrics: AgentMetrics, message: SDKMessage): void {
  if (message.type === 'assistant') {
    for (const block of message.message.content) {
      if (block.type === 'tool_use')
        metrics.toolCalls[block.name] = (metrics.toolCalls[block.name] ?? 0) + 1
    }
  }
  else if (message.type === 'user' && Array.isArray(message.message.content)) {
    for (const block of message.message.content) {
      if (typeof block === 'object' && block.type === 'tool_result')
        metrics.toolOutputs.push(toolResultText(block.content))
    }
  }
  else if (message.type === 'result') {
    metrics.stop = message.subtype
    metrics.turns = message.num_turns
    metrics.costUsd = message.total_cost_usd
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
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    costUsd: 0,
    ms: 0,
    toolOutputs: [],
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
        env: { ...process.env, NO_COLOR: '1', CI: '1' },
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
