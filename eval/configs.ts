import type { AgentMetrics, AgentOptions } from './types'
import { describeClaudeAuth, runClaudeCode } from './agent'
import { describePiAuth, runPi } from './pi'

type Harness = 'claude-code' | 'pi'

/** One column of the matrix: a harness running one model. */
export interface AgentConfig {
  /** Folder under `eval/runs/`, `<harness>/<model>`. */
  id: string
  harness: Harness
  /** Model id in the harness's own format. */
  model: string
}

/**
 * Every config the eval knows. `pnpm eval` runs the missing cells of all of them.
 * Claude models run in Claude Code, the others in pi through the Vercel AI Gateway.
 */
export const CONFIGS: AgentConfig[] = [
  { id: 'claude-code/claude-sonnet-5-5', harness: 'claude-code', model: 'claude-sonnet-5-5' },
  { id: 'claude-code/claude-haiku-5-5', harness: 'claude-code', model: 'claude-haiku-5-5' },
  { id: 'pi/gpt-5.3-codex', harness: 'pi', model: 'vercel-ai-gateway/openai/gpt-5.3-codex' },
  { id: 'pi/gemini-3.5-flash', harness: 'pi', model: 'vercel-ai-gateway/google/gemini-3.5-flash' },
]

const HARNESSES: Record<Harness, {
  run: (prompt: string, cwd: string, options: AgentOptions) => Promise<AgentMetrics>
  auth: () => string
}> = {
  'claude-code': {
    run: runClaudeCode,
    auth: () => describeClaudeAuth(),
  },
  'pi': { run: runPi, auth: describePiAuth },
}

export function runAgent(config: AgentConfig, prompt: string, cwd: string, options: Omit<AgentOptions, 'model'>): Promise<AgentMetrics> {
  return HARNESSES[config.harness].run(prompt, cwd, { ...options, model: config.model })
}

export function describeAuth(config: AgentConfig): string {
  return HARNESSES[config.harness].auth()
}
