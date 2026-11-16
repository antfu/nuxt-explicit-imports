import { execFile } from 'node:child_process'
import { cp, mkdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { join } from 'pathe'

const root = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)

/**
 * Copy a fixture to `test/.tmp/<name>`. It stays inside the repo so `nuxt` resolves from the root `node_modules`.
 */
export async function copyFixture(fixture: string, name: string): Promise<string> {
  const dir = join(root, 'test/.tmp', name)
  await rm(dir, { recursive: true, force: true })
  await mkdir(join(root, 'test/.tmp'), { recursive: true })
  await cp(join(root, 'test/fixtures', fixture), dir, {
    recursive: true,
    filter: src => !/[\\/]\.(?:nuxt|output)(?:[\\/]|$)/.test(src),
  })
  return dir
}

/** Run `nuxt build` in a child process, like a user would. */
export async function nuxtBuild(dir: string): Promise<{ ok: boolean, output: string }> {
  const bin = join(require.resolve('nuxt/package.json'), '../bin/nuxt.mjs')
  try {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, [bin, 'build', dir], {
      env: { ...process.env, NO_COLOR: '1', CI: '1' },
      maxBuffer: 64 * 1024 * 1024,
    })
    return { ok: true, output: stdout + stderr }
  }
  catch (error: any) {
    return { ok: false, output: `${error.stdout}${error.stderr}` }
  }
}
