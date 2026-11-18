export const ARMS = ['auto', 'explicit'] as const
/** `auto`: Nuxt auto-imports on. `explicit`: every import written out, auto-imports off. */
export type Arm = typeof ARMS[number]

type Fixture = 'shop'

/** A text replacement applied to the fixture before the agent starts, in both arms unless `arm` is set. */
interface Seed {
  file: string
  from: string
  to: string
  arm?: Arm
}

export interface CheckContext {
  /** Request a path on the built app and return the body. Redirects are followed. */
  fetchText: (path: string, init?: RequestInit) => Promise<string>
  /** Request a path on the built app and parse the JSON body. */
  fetchJson: (path: string, init?: RequestInit) => Promise<unknown>
  /** Read a file relative to the app root, `undefined` if missing. */
  read: (file: string) => Promise<string | undefined>
  exists: (file: string) => Promise<boolean>
  /** Files under `dir` whose content matches `pattern`. */
  grep: (pattern: RegExp, dir: string) => Promise<string[]>
  assert: (name: string, ok: boolean, detail?: string) => void
}

export interface Task {
  id: string
  fixture: Fixture
  kind: 'feature' | 'refactor' | 'bugfix'
  /** Sent verbatim to the agent, the same in both arms. */
  prompt: string
  seed?: Seed[]
  /** Hidden check, run against the built app after the agent stops. */
  check: (ctx: CheckContext) => Promise<void>
}

export interface Assertion {
  name: string
  ok: boolean
  detail?: string
}

export interface GateResult {
  ok: boolean
  output: string
  ms: number
}

export interface AgentOptions {
  /** Model id in the harness's own format. */
  model: string
  maxTurns: number
  timeoutMs: number
}

/** What a tool call was for. A Bash call that chains commands can be several. `explore`: read or search. `edit`: change files. `verify`: run typecheck, build or tests. */
export type ToolKind = 'explore' | 'edit' | 'verify' | 'other'

export interface AgentMetrics {
  /** Why the agent stopped: `success`, `error_max_turns`, `timeout`, ... */
  stop: string
  turns: number
  /** Tool calls by tool name. */
  toolCalls: Record<string, number>
  /**
   * Tool calls by purpose. Bash calls are sorted by their command, and a chained call
   * counts once for each kind it does, so the kinds can add up to more than the calls.
   */
  toolKinds: Record<ToolKind, number>
  /** Uncached input tokens. */
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
  /** Characters of tool output sent back to the model: how much the agent had to read. */
  toolOutputChars: number
  costUsd: number
  /** Wall time of the agent session. */
  ms: number
  /** Time spent waiting on the model API. */
  apiMs: number
  /** Every tool call in order, with its result text. Written to `tools/`, used for the error taxonomy. */
  calls: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  kinds: ToolKind[]
  input: unknown
  output: string
}

export type ErrorKind
  = | 'missing-name'
    | 'bad-module-path'
    | 'bad-export'
    | 'duplicate-declaration'
    | 'other-ts'
    | 'build-resolve'

export type Taxonomy = Partial<Record<ErrorKind, number>>

export interface RunResult {
  /** The config that ran it, like `claude-code/claude-sonnet-5-5`. `none` in a dry run. */
  config: string
  /** See `fingerprint()` in `store.ts`. */
  fingerprint: string
  /** When the run finished. */
  date: string
  maxTurns: number
  timeoutMin: number
  task: string
  kind: Task['kind']
  fixture: Fixture
  arm: Arm
  trial: number
  pass: boolean
  typecheck: Omit<GateResult, 'output'>
  build: Omit<GateResult, 'output'>
  assertions: Assertion[]
  agent?: Omit<AgentMetrics, 'calls'>
  /** Errors the agent hit while working, read from its tool results. */
  errorsDuringRun: Taxonomy
  /** Errors left in the final gate output. */
  errorsAtEnd: Taxonomy
  /** Set when the harness itself failed, not the agent. */
  harnessError?: string
}
