import type { Arm, Task } from './types'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { join } from 'pathe'

export const repoRoot = join(import.meta.dirname, '..')
const exec = promisify(execFile)

/** Repo files every run needs. An agent that runs `npm install` in a workspace must never remove them. */
const TOOLCHAIN = [
  'node_modules/nuxt/bin/nuxt.mjs',
  'node_modules/@anthropic-ai/claude-agent-sdk/package.json',
  'node_modules/@earendil-works/pi-coding-agent/dist/bundle/cli.js',
]

/** Throw when the repo's `node_modules` lost a package the runs need, so no run starts on a broken toolchain. */
export function checkToolchain(): void {
  const missing = TOOLCHAIN.filter(file => !existsSync(join(repoRoot, file)))
  if (missing.length)
    throw new Error(`The repo's node_modules is missing ${missing.join(', ')}. Run \`pnpm install --force\`.`)
}

/**
 * Link the repo's packages into a workspace's `node_modules`, one symlink per package.
 * Scope folders and `.bin` are real folders with a link per entry: npm prunes packages it does not
 * know, and through a linked scope folder or `.bin` it would delete them from the repo itself.
 */
async function linkModules(modules: string): Promise<void> {
  const source = join(repoRoot, 'node_modules')
  await mkdir(modules)
  for (const entry of await readdir(source)) {
    if (entry === '.cache')
      continue
    if (entry === '.bin' || entry.startsWith('@')) {
      await mkdir(join(modules, entry))
      for (const inner of await readdir(join(source, entry)))
        await symlink(join(source, entry, inner), join(modules, entry, inner))
    }
    else {
      await symlink(join(source, entry), join(modules, entry))
    }
  }
}

/**
 * Copy a fixture arm to `dir`, apply the task seed and commit it, so the run diff is `git diff`.
 * The app sits outside the repo so the agent sees neither the other arm nor the hidden checks.
 * `node_modules` links the repo's packages (see `linkModules`), so `.cache` and build output stay local.
 */
export async function createWorkspace(task: Task, arm: Arm, dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
  await cp(join(repoRoot, 'eval/fixtures', task.fixture, arm), dir, { recursive: true })

  for (const seed of (task.seed ?? []).filter(seed => !seed.arm || seed.arm === arm)) {
    const file = join(dir, seed.file)
    const content = await readFile(file, 'utf8')
    if (!content.includes(seed.from))
      throw new Error(`Seed for ${task.id} not found in ${arm}/${seed.file}: ${seed.from}`)
    await writeFile(file, content.replace(seed.from, seed.to))
  }

  await linkModules(join(dir, 'node_modules'))

  await writeFile(join(dir, '.gitignore'), 'node_modules\n.nuxt\n.output\n')
  const git = (...args: string[]): Promise<unknown> => exec('git', args, { cwd: dir })
  await git('init', '-q')
  await git('add', '-A')
  await git('-c', 'user.name=eval', '-c', 'user.email=eval@localhost', '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'init')
}

/** Everything the agent changed, including new files. */
export async function workspaceDiff(dir: string): Promise<string> {
  await exec('git', ['add', '-A'], { cwd: dir })
  const { stdout } = await exec('git', ['diff', '--cached'], { cwd: dir, maxBuffer: 64 * 1024 * 1024 })
  return stdout
}
