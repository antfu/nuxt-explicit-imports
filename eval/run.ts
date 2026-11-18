import type { AgentConfig } from './configs'
import type { RunFiles } from './store'
import type { Arm, RunResult, Task } from './types'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import process from 'node:process'
import { cac } from 'cac'
import { consola } from 'consola'
import { join } from 'pathe'
import { CONFIGS, describeAuth, runAgent } from './configs'
import { build, runCheck, typecheck } from './gates'
import { writeReports } from './report'
import { fingerprint, readRun, saveRun } from './store'
import { TASKS } from './tasks'
import { classify, mergeTaxonomy } from './taxonomy'
import { ARMS } from './types'
import { checkToolchain, createWorkspace, workspaceDiff } from './workspace'

interface Flags {
  configs?: string
  tasks?: string
  arms?: string
  trials: number
  maxTurns: number
  timeout: number
  concurrency: number
  force?: boolean
  dryRun?: boolean
  keep?: boolean
}

interface Job {
  config?: AgentConfig
  task: Task
  arm: Arm
  trial: number
}

interface Limits {
  maxTurns: number
  timeoutMin: number
}

function pick<T extends string>(value: string | undefined, all: readonly T[], label: string): T[] {
  if (!value)
    return [...all]
  const list = value.split(',').map(v => v.trim()).filter(Boolean)
  for (const item of list) {
    if (!all.includes(item as T))
      throw new Error(`Unknown ${label} "${item}". Use: ${all.join(', ')}.`)
  }
  return list as T[]
}

/** One cheap agent call per config, so a bad key fails here and not in every run. */
async function preflight(config: AgentConfig): Promise<boolean> {
  consola.info(`${config.id}: ${describeAuth(config)}`)
  const probe = await runAgent(config, 'Reply with OK.', tmpdir(), { maxTurns: 1, timeoutMs: 60_000 })
  if (probe.stop === 'success')
    return true
  consola.error(`${config.id}: preflight failed: ${probe.stop === 'timeout'
    ? 'no answer in 60s. Claude Code retries auth errors, so check the key'
    : probe.stop}`)
  return false
}

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  await Promise.all(Array.from({
    length: Math.min(size, items.length),
  }, async () => {
    while (next < items.length)
      await fn(items[next++]!)
  }))
}

/** A stored run that says nothing about the agent: the harness or the model API failed. Run it again. */
function broken(run: RunResult): boolean {
  return !!run.harnessError || !!run.agent?.stop.startsWith('error:')
}

/** The cells that have no current run yet: missing, stale or broken. All of them with `--force`. */
async function pending(jobs: Required<Job>[], force: boolean): Promise<Required<Job>[]> {
  const todo: Required<Job>[] = []
  for (const job of jobs) {
    const stored = await readRun(job.config.id, job.task.id, job.arm, job.trial)
    if (force || !stored || broken(stored) || stored.fingerprint !== await fingerprint(job.task, job.arm))
      todo.push(job)
  }
  return todo
}

/**
 * One run: fresh workspace, agent (skipped in dry run), then the hidden gates and check.
 * The verdict comes only from the hidden gates, never from what the agent reports.
 */
async function runJob(job: Job, root: string, limits: Limits, keep: boolean): Promise<RunFiles> {
  const config = job.config?.id ?? 'none'
  const name = `${config} ${job.task.id}-${job.arm}-${job.trial}`
  const dir = join(root, config.replace(/\W+/g, '-'), `${job.task.id}-${job.arm}-${job.trial}`)
  const result: RunResult = {
    config,
    fingerprint: await fingerprint(job.task, job.arm),
    date: '',
    ...limits,
    task: job.task.id,
    kind: job.task.kind,
    fixture: job.task.fixture,
    arm: job.arm,
    trial: job.trial,
    pass: false,
    typecheck: { ok: false, ms: 0 },
    build: { ok: false, ms: 0 },
    assertions: [],
    errorsDuringRun: {},
    errorsAtEnd: {},
  }
  const files: RunFiles = { result }
  try {
    checkToolchain()
    await createWorkspace(job.task, job.arm, dir)
    if (job.config) {
      consola.start(`${name}: agent`)
      const { calls, ...metrics } = await runAgent(job.config, job.task.prompt, dir, {
        maxTurns: limits.maxTurns,
        timeoutMs: limits.timeoutMin * 60_000,
      })
      result.agent = metrics
      result.errorsDuringRun = mergeTaxonomy(...calls.map(c => classify(c.output)))
      files.calls = calls
      files.diff = await workspaceDiff(dir)
    }
    consola.start(`${name}: gates`)
    const tc = await typecheck(dir)
    const bd = await build(dir)
    result.typecheck = { ok: tc.ok, ms: tc.ms }
    result.build = { ok: bd.ok, ms: bd.ms }
    result.errorsAtEnd = mergeTaxonomy(classify(tc.output), bd.ok
      ? {}
      : classify(bd.output))
    if (!tc.ok || !bd.ok)
      files.gatesLog = `# typecheck\n${tc.output}\n# build\n${bd.output}`
    result.assertions = await runCheck(job.task, dir)
    result.pass = tc.ok && bd.ok && result.assertions.every(a => a.ok)
    consola[result.pass ? 'success' : 'fail'](`${name}: ${result.pass ? 'pass' : 'fail'}`)
  }
  catch (error) {
    result.harnessError = error instanceof Error
      ? error.message
      : String(error)
    consola.error(`${name}: harness error: ${result.harnessError}`)
  }
  finally {
    result.date = new Date().toISOString()
    if (!keep)
      await rm(dir, { recursive: true, force: true })
  }
  return files
}

/**
 * Dry run: on the untouched fixtures, the gates MUST pass and every task check MUST fail.
 * Otherwise the fixture is broken or the task is already solved, and agent results would mean nothing.
 */
function dryRunProblems(results: RunResult[]): string[] {
  return results.flatMap((r) => {
    const name = `${r.task} ${r.arm}`
    if (r.harnessError)
      return [`${name}: ${r.harnessError}`]
    const problems: string[] = []
    if (!r.typecheck.ok)
      problems.push(`${name}: typecheck fails before the agent runs`)
    if (!r.build.ok)
      problems.push(`${name}: build fails before the agent runs`)
    if (r.assertions.length && r.assertions.every(a => a.ok))
      problems.push(`${name}: check already passes before the agent runs`)
    return problems
  })
}

async function dryRun(tasks: Task[], arms: Arm[], root: string, limits: Limits, flags: Flags): Promise<void> {
  const jobs: Job[] = tasks.flatMap(task => arms.map(arm => ({ task, arm, trial: 1 })))
  const results: RunResult[] = []
  await pool(jobs, Number(flags.concurrency), async job => void results.push((await runJob(job, root, limits, !!flags.keep)).result))
  const problems = dryRunProblems(results)
  for (const problem of problems)
    consola.error(problem)
  if (problems.length)
    process.exitCode = 1
  else
    consola.success(`Dry run OK: ${results.length} workspaces build, and no task is solved before the agent runs.`)
}

const cli = cac('eval')
const configIds = CONFIGS.map(c => c.id)

cli
  .command('', 'Run the missing cells of the matrix: config x task x arm x trial')
  .option('--configs <ids>', `Comma-separated configs (default: all): ${configIds.join(', ')}`)
  .option('--tasks <ids>', `Comma-separated task ids (default: all): ${TASKS.map(t => t.id).join(', ')}`)
  .option('--arms <arms>', `Comma-separated arms: ${ARMS.join(', ')}`)
  .option('--trials <n>', 'Trials per task and arm: runs trials 1 to n', { default: 5 })
  .option('--max-turns <n>', 'Max agent turns per run', { default: 40 })
  .option('--timeout <min>', 'Agent timeout per run, in minutes', { default: 10 })
  .option('--concurrency <n>', 'Runs in parallel', { default: 2 })
  .option('--force', 'Run the selected cells again, even when a current run is stored')
  .option('--dry-run', 'No agent: check the fixtures build and every task check fails before work')
  .option('--keep', 'Keep the workspaces in the temp dir')
  .action(async (flags: Flags) => {
    const ids = pick(flags.tasks, TASKS.map(t => t.id), 'task')
    const tasks = TASKS.filter(task => ids.includes(task.id))
    const arms = pick(flags.arms, ARMS, 'arm')
    const limits: Limits = {
      maxTurns: Number(flags.maxTurns),
      timeoutMin: Number(flags.timeout),
    }
    const root = join(tmpdir(), 'nuxt-explicit-imports-eval', new Date().toISOString().replace(/[:.]/g, '-'))
    if (flags.dryRun)
      return dryRun(tasks, arms, root, limits, flags)

    const configs = CONFIGS.filter(c => pick(flags.configs, configIds, 'config').includes(c.id))
    const all = configs.flatMap(config => tasks.flatMap(task => arms.flatMap(arm =>
      Array.from({
        length: Number(flags.trials),
      }, (_, i) => ({ config, task, arm, trial: i + 1 })))))
    const jobs = await pending(all, !!flags.force)
    consola.info(`${all.length} cells selected, ${all.length - jobs.length} already stored, ${jobs.length} to run`)

    for (const config of configs.filter(c => jobs.some(j => j.config === c))) {
      if (!await preflight(config)) {
        process.exitCode = 1
        return
      }
    }
    if (jobs.length)
      consola.info(`Workspaces in ${root}`)
    // Each run is saved as soon as it ends, so a stopped eval keeps what it finished.
    await pool(jobs, Number(flags.concurrency), async job => saveRun(await runJob(job, root, limits, !!flags.keep)))
    consola.success(`Reports: ${await writeReports(CONFIGS)}`)
  })

cli
  .command('report', 'Write the reports from the stored runs, without running anything')
  .action(async () => {
    consola.success(`Reports: ${await writeReports(CONFIGS)}`)
  })

cli.help()
cli.parse()
