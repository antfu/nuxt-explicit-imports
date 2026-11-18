import type { Arm, Task } from './types'
import { execFile } from 'node:child_process'
import { cp, mkdir, readdir, readFile, symlink, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { join } from 'pathe'

export const repoRoot = join(import.meta.dirname, '..')
const exec = promisify(execFile)

/**
 * Copy a fixture arm to `dir`, apply the task seed and commit it, so the run diff is `git diff`.
 * The app sits outside the repo so the agent sees neither the other arm nor the hidden checks.
 * `node_modules` holds one symlink per package of the repo, so `.cache` and build output stay local.
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

  const modules = join(dir, 'node_modules')
  await mkdir(modules)
  for (const entry of await readdir(join(repoRoot, 'node_modules'))) {
    if (entry !== '.cache')
      await symlink(join(repoRoot, 'node_modules', entry), join(modules, entry))
  }

  await writeFile(join(dir, '.gitignore'), 'node_modules\n.nuxt\n.output\n')
  const git = (...args: string[]): Promise<unknown> => exec('git', args, { cwd: dir })
  await git('init', '-q')
  await git('add', '-A')
  await git('-c', 'user.name=eval', '-c', 'user.email=eval@localhost', 'commit', '-q', '-m', 'init')
}

/** Everything the agent changed, including new files. */
export async function workspaceDiff(dir: string): Promise<string> {
  await exec('git', ['add', '-A'], { cwd: dir })
  const { stdout } = await exec('git', ['diff', '--cached'], { cwd: dir, maxBuffer: 64 * 1024 * 1024 })
  return stdout
}
