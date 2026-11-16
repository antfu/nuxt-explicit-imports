import type { Session } from '../src/run'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import { beforeAll, describe, expect, it } from 'vitest'
import { check, migrate, openSession } from '../src/run'
import { copyFixture, nuxtBuild } from './_utils'

const SOURCE_FILES = [
  'app/app.vue',
  'app/components/ClientWidget.client.vue',
  'app/components/MyButton.vue',
  'app/composables/useCounter.ts',
  'app/middleware/auth.ts',
  'app/pages/about.vue',
  'app/pages/index.vue',
  'app/plugins/hello.ts',
  'layers/base/app/composables/useBase.ts',
  'server/api/hello.get.ts',
]

describe('basic fixture', () => {
  let dir: string
  let session: Session

  beforeAll(async () => {
    dir = await copyFixture('basic', 'migrate')
    session = await openSession({ root: dir })
  })

  it('lists only project source files', () => {
    const files = session.files.map(f => session.project.relative(f))
    expect(files).not.toContain('app/utils/format.test.ts')
    expect(files).not.toContain('nuxt.config.ts')
    expect(files).toContain('layers/base/app/composables/useBase.ts')
    expect(files).toContain('server/api/hello.get.ts')
  })

  it('check reports every implicit auto-import', async () => {
    const { report, reportFile } = await check(session)
    expect(reportFile).toBe(join(dir, '.nuxt/explicit-imports-report.json'))
    expect(report.findings.every(f => f.fixable)).toBe(true)
    expect(report.findings.map(f => `${f.file}:${f.line}:${f.column} [${f.category}] ${f.name} -> ${f.suggestion.replace(/\n/g, ' | ')}`))
      .toMatchSnapshot()
  })

  it('check filters by category and path', async () => {
    const server = await check({
      ...session,
      categories: ['server'],
    })
    expect(new Set(server.report.findings.map(f => f.file))).toEqual(new Set(['server/api/hello.get.ts']))

    const components = await check({
      ...session,
      categories: ['components'],
    })
    expect(components.report.findings.every(f => f.category === 'components')).toBe(true)
  })

  it('migrate rewrites files', async () => {
    const result = await migrate(session)
    expect(result.manual).toEqual([])
    expect(result.changed.sort()).toEqual(SOURCE_FILES)
    for (const file of SOURCE_FILES)
      await expect(await readFile(join(dir, file), 'utf8')).toMatchFileSnapshot(`__snapshots__/basic/${file}`)
  })

  it('check is clean and migrate is a no-op after migration', async () => {
    const after = await openSession({ root: dir })
    const { report } = await check(after)
    expect(report.findings).toEqual([])
    const again = await migrate(after)
    expect(again.changed).toEqual([])
  })

  it('the migrated app builds in strict mode', async () => {
    const config = join(dir, 'nuxt.config.ts')
    await writeFile(config, (await readFile(config, 'utf8')).replace(`mode: 'warn'`, `mode: 'strict'`))
    const { ok, output } = await nuxtBuild(dir)
    expect(output).not.toContain('Implicit auto-import')
    expect(ok).toBe(true)
  })
})

describe('build', () => {
  it('warn mode builds, warns and writes the report', async () => {
    const dir = await copyFixture('basic', 'build-warn')
    const { ok, output } = await nuxtBuild(dir)
    expect(ok).toBe(true)
    expect(output).toContain('Implicit auto-import in app/pages/index.vue')
    expect(output).toContain('Implicit auto-import in server/api/hello.get.ts')
    const report = JSON.parse(await readFile(join(dir, '.nuxt/explicit-imports-report.json'), 'utf8'))
    expect(report.source).toBe('build')
    // Same findings as `check`, including `<LazyFancyCard hydrate-on-visible>`.
    expect(report.findings).toHaveLength(29)
  })

  it('strict mode fails the build on implicit auto-imports', async () => {
    const dir = await copyFixture('basic', 'build-strict')
    const config = join(dir, 'nuxt.config.ts')
    await writeFile(config, (await readFile(config, 'utf8')).replace(`mode: 'warn'`, `mode: { imports: 'warn', components: 'strict', server: 'warn' }`))
    const { ok, output } = await nuxtBuild(dir)
    expect(ok).toBe(false)
    expect(output).toContain('Implicit auto-imports are disabled (strict mode)')
    expect(output).toContain(`import MyButton from '~/components/MyButton.vue'`)
  })
})
