import type { Plugin as VitePlugin } from 'vite'
import type { Project } from './project'
import type { Finding, ModuleOptions } from './types'
import { readFile } from 'node:fs/promises'
import { addVitePlugin, defineNuxtModule, useLogger } from '@nuxt/kit'
import { normalize } from 'pathe'
import { analyzeFile, toFindings } from './analyze'
import { resolveModes } from './options'
import { collectContexts, createProject } from './project'
import { formatFileLine, mergeReport, reportPath } from './report'

export type { Category, Finding, Mode, ModeOption, ModuleOptions, Report } from './types'

const QUERY_RE = /\?.*$/

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-explicit-imports',
    configKey: 'explicitImports',
    compatibility: { nuxt: '>=4.0.0' },
  },
  defaults: {
    mode: 'warn',
    exclude: [],
    report: true,
  },
  setup(options, nuxt) {
    const collected = collectContexts(nuxt)
    if (options._analyze)
      return

    const modes = resolveModes(options.mode)
    const logger = useLogger('nuxt-explicit-imports')

    // User modules run before the core imports module, so this takes effect.
    const userAutoImport = nuxt.options.imports.autoImport !== false
    if (modes.imports === 'strict')
      nuxt.options.imports.autoImport = false

    // Nuxt passes `imports.autoImport` on to Nitro. Decouple the server category from it.
    nuxt.hook('nitro:config', (config) => {
      if (config.imports) {
        config.imports.autoImport = modes.server === 'strict'
          ? false
          : userAutoImport
      }
    })

    if (Object.values(modes).every(mode => mode === 'off'))
      return

    let project: Project | undefined
    const getProject = async (): Promise<Project> => project ??= await createProject(nuxt, collected, options.exclude)

    const source = nuxt.options.dev ? 'dev' : 'build'
    const byFile = new Map<string, Finding[]>()
    const warned = new Map<string, string>()
    let writeTimer: ReturnType<typeof setTimeout> | undefined

    const writeReport = (): Promise<void> | undefined => {
      if (!options.report)
        return
      clearTimeout(writeTimer)
      writeTimer = undefined
      return mergeReport(reportPath(nuxt.options.rootDir, nuxt.options.buildDir), source, modes, byFile)
    }
    const scheduleReport = (): void => {
      clearTimeout(writeTimer)
      writeTimer = setTimeout(writeReport, 300)
    }

    /**
     * Analyze one file. Reports warnings once per change and returns the error message
     * for strict categories, if any.
     */
    async function inspect(id: string): Promise<string | undefined> {
      // Nitro (rollup) ids use backslashes on Windows.
      const file = normalize(id.replace(QUERY_RE, ''))
      const p = await getProject()
      if (!p.isTarget(file))
        return
      const analysis = await analyzeFile(p, file, await readFile(file, 'utf8'))
      const findings = toFindings(p, analysis).filter(f => modes[f.category] !== 'off')
      const relative = p.relative(file)
      byFile.set(relative, findings)
      scheduleReport()

      const warnings = findings.filter(f => modes[f.category] === 'warn')
      const line = warnings.length
        ? formatFileLine(relative, warnings)
        : ''
      if (line && warned.get(relative) !== line)
        logger.warn(`Implicit auto-import in ${line}`)
      warned.set(relative, line)

      const errors = findings.filter(f => modes[f.category] === 'strict')
      if (errors.length) {
        return [
          `[nuxt-explicit-imports] Implicit auto-imports are disabled (strict mode) in ${relative}:`,
          ...errors.map(f => `  ${f.line}:${f.column}  ${f.suggestion.split('\n')[0]}`),
          'Run `npx nuxt-explicit-imports migrate` to add the imports.',
        ].join('\n')
      }
    }

    const appActive = modes.imports !== 'off' || modes.components !== 'off'
    if (appActive) {
      const plugin: VitePlugin = {
        name: 'nuxt-explicit-imports',
        enforce: 'pre',
        async transform(_code, id) {
          if (id.includes('?'))
            return
          // Other `pre` plugins (like Nuxt's lazy hydration transform) may already have changed the code.
          const error = await inspect(id)
          if (error)
            this.error(error)
        },
      }
      addVitePlugin(plugin)
    }

    if (modes.server !== 'off') {
      nuxt.hook('nitro:config', (config) => {
        const plugins = config.rollupConfig?.plugins
        const plugin = {
          name: 'nuxt-explicit-imports',
          async transform(this: { error: (message: string) => never }, _code: string, id: string) {
            const error = await inspect(id)
            if (error)
              this.error(error)
          },
        }
        config.rollupConfig ??= {}
        config.rollupConfig.plugins = Array.isArray(plugins)
          ? [...plugins, plugin]
          : plugins
            ? [plugins, plugin]
            : [plugin]
      })
    }

    nuxt.hook('close', async () => {
      await writeReport()
      const files = [
        ...byFile.values(),
      ].filter(list => list.some(f => modes[f.category] === 'warn'))
      if (!nuxt.options.dev && files.length) {
        const total = files.reduce((sum, list) => sum + list.length, 0)
        logger.warn(`Found ${total} implicit auto-imports in ${files.length} files. Run \`npx nuxt-explicit-imports check\` for the full report.`)
      }
    })
  },
})

declare module 'nuxt/schema' {
  interface NuxtConfig {
    explicitImports?: Partial<ModuleOptions>
  }
  interface NuxtOptions {
    explicitImports?: ModuleOptions
  }
}
