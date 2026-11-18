import type { AgentMetrics, AgentOptions } from './types'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import process from 'node:process'
import { createInterface } from 'node:readline'
import { join } from 'pathe'
import { APPEND, emptyMetrics, recordCall, recordOutput, toolResultText } from './metrics'
import { withoutSecrets } from './secrets'
import { repoRoot } from './workspace'

const CLI = join(repoRoot, 'node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js')

/** The parts of pi's `--mode json` events that the eval reads. */
interface PiEvent {
  type: string
  message?: {
    role?: string
    stopReason?: string
    errorMessage?: string
    usage?: {
      input?: number
      output?: number
      cacheRead?: number
      cacheWrite?: number
      cost?: { total?: number }
    }
  }
  toolCallId?: string
  toolName?: string
  args?: unknown
  result?: { content?: unknown }
}

/** Where pi's API calls go, for the log. */
export function describePiAuth(): string {
  return process.env.AI_GATEWAY_API_KEY
    ? 'AI_GATEWAY_API_KEY via the Vercel AI Gateway'
    : 'no AI_GATEWAY_API_KEY set, so pi uses its own provider keys from the env'
}

interface State {
  metrics: AgentMetrics
  options: AgentOptions
  apiStart: number
  last?: PiEvent['message']
  stop: () => void
}

function onEvent(state: State, event: PiEvent): void {
  const { metrics } = state
  switch (event.type) {
    case 'turn_start':
      // A turn starts with a model call, so the API wait runs from here to the assistant message end.
      state.apiStart = Date.now()
      metrics.turns++
      if (metrics.turns > state.options.maxTurns) {
        metrics.stop = 'error_max_turns'
        state.stop()
      }
      break
    case 'message_end': {
      if (event.message?.role !== 'assistant')
        break
      const usage = event.message.usage ?? {}
      metrics.inputTokens += usage.input ?? 0
      metrics.outputTokens += usage.output ?? 0
      metrics.cacheReadTokens += usage.cacheRead ?? 0
      metrics.cacheWriteTokens += usage.cacheWrite ?? 0
      metrics.costUsd += usage.cost?.total ?? 0
      metrics.apiMs += Date.now() - state.apiStart
      state.last = event.message
      break
    }
    case 'tool_execution_start':
      recordCall(metrics, event.toolCallId ?? '', event.toolName ?? 'unknown', event.args)
      break
    case 'tool_execution_end':
      recordOutput(metrics, event.toolCallId ?? '', toolResultText(event.result?.content))
      break
  }
}

/**
 * Run one pi session in `cwd` and collect its cost and tool output.
 * pi gets an empty config dir and no extensions, skills, context files, prompt templates or MCP,
 * so both arms see only the app. It has no turn limit of its own: the run stops after `maxTurns` turns.
 */
export async function runPi(prompt: string, cwd: string, options: AgentOptions): Promise<AgentMetrics> {
  const start = Date.now()
  const metrics = emptyMetrics()
  const configDir = await mkdtemp(join(tmpdir(), 'eval-pi-'))
  const child = spawn(process.execPath, [
    CLI,
    '--offline',
    '--no-session',
    '--no-extensions',
    '--no-skills',
    '--no-context-files',
    '--no-prompt-templates',
    '--no-themes',
    '--no-mcp',
    '--no-approve',
    '--mode',
    'json',
    '--print',
    '--model',
    options.model,
    '--append-system-prompt',
    APPEND,
    // The key goes in as a flag, and every secret leaves the env, so the agent's bash cannot print it with `env`.
    ...(process.env.AI_GATEWAY_API_KEY
      ? ['--api-key', process.env.AI_GATEWAY_API_KEY]
      : []),
    prompt,
  ], {
    cwd,
    env: {
      ...withoutSecrets(process.env),
      PI_CODING_AGENT_DIR: configDir,
      NO_COLOR: '1',
      CI: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const state: State = {
    metrics,
    options,
    apiStart: start,
    stop: () => child.kill(),
  }
  const timer = setTimeout(() => {
    metrics.stop = 'timeout'
    child.kill()
  }, options.timeoutMs)

  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr = (stderr + chunk).slice(-2000)
  })
  const exit = new Promise<number | null>(resolve => child.on('close', resolve))
  for await (const line of createInterface({ input: child.stdout })) {
    if (!line.startsWith('{'))
      continue
    try {
      onEvent(state, JSON.parse(line) as PiEvent)
    }
    catch {}
  }
  const code = await exit
  clearTimeout(timer)
  await rm(configDir, { recursive: true, force: true })

  if (metrics.stop === 'unknown') {
    if (state.last?.stopReason === 'error')
      metrics.stop = `error: ${state.last.errorMessage ?? 'unknown model error'}`
    else if (code !== 0)
      metrics.stop = `error: pi exited with ${code}: ${stderr.trim()}`
    else
      metrics.stop = 'success'
  }
  metrics.ms = Date.now() - start
  return metrics
}
