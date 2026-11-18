import type { Arm, RunResult, Task, ToolCall } from './types'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'pathe'
import { glob } from 'tinyglobby'
import { repoRoot } from './workspace'

/** One file set per run: `<config>/<task>/<arm>-<trial>.json`, with `.diff`, `.tools.json` and `.gates.log` next to it. */
export const RUNS_DIR = join(repoRoot, 'eval/runs')

export interface RunFiles {
  result: RunResult
  diff?: string
  calls?: ToolCall[]
  gatesLog?: string
}

function base(config: string, task: string, arm: Arm, trial: number): string {
  return join(RUNS_DIR, config, task, `${arm}-${trial}`)
}

const fingerprints = new Map<string, Promise<string>>()

async function computeFingerprint(task: Task, arm: Arm): Promise<string> {
  const hash = createHash('sha256')
  hash.update(JSON.stringify({
    prompt: task.prompt,
    seed: (task.seed ?? []).filter(seed => !seed.arm || seed.arm === arm),
    check: task.check.toString(),
  }))
  const fixture = join(repoRoot, 'eval/fixtures', task.fixture, arm)
  const files = await glob('**/*', {
    cwd: fixture,
    dot: true,
    ignore: ['**/node_modules/**', '**/.nuxt/**', '**/.output/**'],
  })
  for (const file of files.sort())
    hash.update(`${file}\0${await readFile(join(fixture, file), 'utf8')}\0`)
  return hash.digest('hex').slice(0, 16)
}

/**
 * What a run of this task and arm depends on: the prompt, the seed, the check's source and every fixture file.
 * A stored run with another fingerprint is stale: the report leaves it out and `pnpm eval` runs it again.
 * Helpers the check calls are not part of it, so after changing one, rerun with `--force`.
 */
export function fingerprint(task: Task, arm: Arm): Promise<string> {
  const key = `${task.id}:${arm}`
  if (!fingerprints.has(key))
    fingerprints.set(key, computeFingerprint(task, arm))
  return fingerprints.get(key)!
}

export async function readRun(config: string, task: string, arm: Arm, trial: number): Promise<RunResult | undefined> {
  try {
    return JSON.parse(await readFile(`${base(config, task, arm, trial)}.json`, 'utf8')) as RunResult
  }
  catch {
    return undefined
  }
}

/** Write a run and its files. A file the run does not have, like the gate log of a passing run, is removed. */
export async function saveRun(files: RunFiles): Promise<void> {
  const { result } = files
  const path = base(result.config, result.task, result.arm, result.trial)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(`${path}.json`, `${JSON.stringify(result, null, 2)}\n`)
  const extra: [string, string | undefined][] = [
    ['.diff', files.diff],
    ['.tools.json', files.calls && `${JSON.stringify(files.calls, null, 2)}\n`],
    ['.gates.log', files.gatesLog],
  ]
  for (const [ext, content] of extra) {
    if (content === undefined)
      await rm(`${path}${ext}`, { force: true })
    else
      await writeFile(`${path}${ext}`, content)
  }
}

/** Every stored run of a config, stale ones included. */
export async function loadRuns(config: string): Promise<RunResult[]> {
  const files = await glob('*/*.json', {
    cwd: join(RUNS_DIR, config),
    ignore: ['**/*.tools.json'],
  })
  const runs = await Promise.all(files.sort().map(async file =>
    JSON.parse(await readFile(join(RUNS_DIR, config, file), 'utf8')) as RunResult))
  return runs
}
