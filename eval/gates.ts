import type { Assertion, CheckContext, GateResult, Task } from './types'
import { execFile, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'
import { join } from 'pathe'
import { glob } from 'tinyglobby'

const GATE_TIMEOUT = 5 * 60_000

function nuxt(dir: string, command: string): Promise<GateResult> {
  const start = Date.now()
  return new Promise((resolve) => {
    execFile(process.execPath, [
      join(dir, 'node_modules/nuxt/bin/nuxt.mjs'),
      command,
    ], {
      cwd: dir,
      env: { ...process.env, NO_COLOR: '1', CI: '1' },
      maxBuffer: 64 * 1024 * 1024,
      timeout: GATE_TIMEOUT,
    }, (error, stdout, stderr) => {
      resolve({ ok: !error, output: `${stdout}${stderr}`, ms: Date.now() - start })
    })
  })
}

export const typecheck = (dir: string): Promise<GateResult> => nuxt(dir, 'typecheck')
export const build = (dir: string): Promise<GateResult> => nuxt(dir, 'build')

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    })
  })
}

/**
 * Start the built app, run the task's hidden check against it and stop it.
 * A thrown error, like a failed fetch, is one failed assertion, not a harness error.
 */
export async function runCheck(task: Task, dir: string): Promise<Assertion[]> {
  const assertions: Assertion[] = []
  const entry = join(dir, '.output/server/index.mjs')
  if (!existsSync(entry)) {
    return [
      { name: 'built server exists', ok: false },
    ]
  }

  const port = await freePort()
  const server = spawn(process.execPath, [entry], {
    cwd: dir,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
    },
    stdio: 'ignore',
  })
  const base = `http://127.0.0.1:${port}`
  async function get(path: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(base + path, init)
    if (!res.ok)
      throw new Error(`${init?.method ?? 'GET'} ${path} returned ${res.status}`)
    return res
  }

  const ctx: CheckContext = {
    fetchText: async (path, init) => (await get(path, init)).text(),
    fetchJson: async (path, init) => (await get(path, init)).json(),
    read: file => readFile(join(dir, file), 'utf8').catch(() => undefined),
    exists: async file => existsSync(join(dir, file)),
    async grep(pattern, sub) {
      const files = await glob('**/*.{ts,vue}', {
        cwd: join(dir, sub),
        ignore: ['**/node_modules/**'],
      })
      const hits: string[] = []
      for (const file of files) {
        if (pattern.test(await readFile(join(dir, sub, file), 'utf8')))
          hits.push(join(sub, file))
      }
      return hits
    },
    assert: (name, ok, detail) => assertions.push({
      name,
      ok,
      ...(ok || detail === undefined
        ? {}
        : { detail }),
    }),
  }

  try {
    for (let i = 0; ; i++) {
      try {
        await fetch(base)
        break
      }
      catch (error) {
        if (i > 50)
          throw new Error(`Server did not start: ${error}`)
        await sleep(200)
      }
    }
    await task.check(ctx)
  }
  catch (error) {
    assertions.push({
      name: 'check ran to the end',
      ok: false,
      detail: String(error),
    })
  }
  finally {
    server.kill()
  }
  return assertions
}
