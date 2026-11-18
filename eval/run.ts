import type { AgentOptions } from './agent'
import type { Arm, RunResult, Task } from './types'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import process from 'node:process'
import { cac } from 'cac'
import { consola } from 'consola'
import { join } from 'pathe'
import { describeAuth, runAgent } from './agent'
import { build, runCheck, typecheck } from './gates'
import { summarize } from './report'
import { TASKS } from './tasks'
import { classify, mergeTaxonomy } from './taxonomy'
import { ARMS } from './types'
import { createWorkspace, repoRoot, workspaceDiff } from './workspace'

interface Flags {
  tasks?: string
  arms?: string
  trials: number
  model: string
  maxTurns: number
  timeout: number
  concurrency: number
  dryRun?: boolean
  keep?: boolean
}

interface Job {
  task: Task
  arm: Arm
  trial: number
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

/** One cheap agent call, so a bad key fails here and not in every run. */
async function preflight(options: AgentOptions): Promise<boolean> {
  consola.info(`Agent auth: ${describeAuth()}`)
  const probe = await runAgent('Reply with OK.', tmpdir(), { ...options, maxTurns: 1, timeoutMs: 60_000 })
  if (probe.stop === 'success')
    return true
  consola.error(`Agent preflight failed: ${probe.stop === 'timeout'
    ? 'no answer in 60s. Claude Code retries auth errors, so check the key'
    : probe.stop}`)
  return false
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length })
  let next = 0
  await Promise.all(Array.from({
    length: Math.min(size, items.length),
  }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index]!)
    }
  }))
  return results
}

/**
 * One run: fresh workspace, agent (skipped in dry run), then the hidden gates and check.
 * The verdict comes only from the hidden gates, never from what the agent reports.
 */
async function runJob(job: Job, root: string, outDir: string, agentOptions: AgentOptions | undefined, keep: boolean): Promise<RunResult> {
  const name = `${job.task.id}-${job.arm}-${job.trial}`
  const dir = join(root, name)
  const result: RunResult = {
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
    dir,
  }
  try {
    await createWorkspace(job.task, job.arm, dir)
    if (agentOptions) {
      consola.start(`${name}: agent`)
      const { calls, ...metrics } = await runAgent(job.task.prompt, dir, agentOptions)
      result.agent = metrics
      result.errorsDuringRun = mergeTaxonomy(...calls.map(c => classify(c.output)))
      await writeFile(join(outDir, 'tools', `${name}.json`), `${JSON.stringify(calls, null, 2)}\n`)
      await writeFile(join(outDir, 'diffs', `${name}.diff`), await workspaceDiff(dir))
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
      await writeFile(join(outDir, 'gates', `${name}.log`), `# typecheck\n${tc.output}\n# build\n${bd.output}`)
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
    if (!keep)
      await rm(dir, { recursive: true, force: true })
  }
  return result
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

const cli = cac('eval')

cli
  .command('', 'Compare a coding agent on the same Nuxt tasks with auto-imports on and off')
  .option('--tasks <ids>', `Comma-separated task ids (default: all): ${TASKS.map(t => t.id).join(', ')}`)
  .option('--arms <arms>', `Comma-separated arms: ${ARMS.join(', ')}`)
  .option('--trials <n>', 'Trials per task and arm', { default: 5 })
  .option('--model <id>', 'Agent model', { default: 'claude-sonnet-5-5' })
  .option('--max-turns <n>', 'Max agent turns per run', { default: 40 })
  .option('--timeout <min>', 'Agent timeout per run, in minutes', { default: 10 })
  .option('--concurrency <n>', 'Runs in parallel', { default: 2 })
  .option('--dry-run', 'No agent: check the fixtures build and every task check fails before work')
  .option('--keep', 'Keep the workspaces in the temp dir')
  .action(async (flags: Flags) => {
    const ids = pick(flags.tasks, TASKS.map(t => t.id), 'task')
    const arms = pick(flags.arms, ARMS, 'arm')
    const trials = flags.dryRun
      ? 1
      : Number(flags.trials)
    const jobs: Job[] = TASKS
      .filter(task => ids.includes(task.id))
      .flatMap(task => arms.flatMap(arm => Array.from({ length: trials }, (_, i) => ({ task, arm, trial: i + 1 }))))

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outDir = join(repoRoot, 'eval/results', flags.dryRun
      ? `${stamp}-dry`
      : stamp)
    const root = join(tmpdir(), 'nuxt-explicit-imports-eval', stamp)
    await mkdir(join(outDir, 'diffs'), { recursive: true })
    await mkdir(join(outDir, 'gates'), { recursive: true })
    await mkdir(join(outDir, 'tools'), { recursive: true })

    const agentOptions: AgentOptions | undefined = flags.dryRun
      ? undefined
      : {
          model: flags.model,
          maxTurns: Number(flags.maxTurns),
          timeoutMs: Number(flags.timeout) * 60_000,
        }
    if (agentOptions && !await preflight(agentOptions)) {
      await rm(outDir, { recursive: true, force: true })
      process.exitCode = 1
      return
    }

    consola.info(`${jobs.length} runs, workspaces in ${root}`)
    const results = await pool(jobs, Number(flags.concurrency), job => runJob(job, root, outDir, agentOptions, !!flags.keep))

    const meta = {
      date: new Date().toISOString(),
      model: flags.dryRun ? 'none (dry run)' : flags.model,
      trials,
      maxTurns: flags.maxTurns,
      timeoutMin: flags.timeout,
    }
    await writeFile(join(outDir, 'results.json'), `${JSON.stringify({ meta, results }, null, 2)}\n`)

    if (flags.dryRun) {
      const problems = dryRunProblems(results)
      if (problems.length) {
        for (const problem of problems)
          consola.error(problem)
        process.exitCode = 1
      }
      else {
        consola.success(`Dry run OK: ${results.length} workspaces build, and no task is solved before the agent runs.`)
      }
      return
    }

    await writeFile(join(outDir, 'summary.md'), summarize(results, meta))
    consola.success(`Results: ${join(outDir, 'summary.md')}`)
  })

cli.help()
cli.parse()
