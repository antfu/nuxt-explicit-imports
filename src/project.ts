import type { Component, Nuxt } from 'nuxt/schema'
import type { Import, Unimport } from 'unimport'
import { existsSync } from 'node:fs'
import { resolveModuleExportNames, resolvePath } from 'mlly'
import { isAbsolute, join, relative, resolve } from 'pathe'
import picomatch from 'picomatch'

/**
 * The live contexts that Nuxt builds during setup. They are filled by hooks.
 */
export interface Collected {
  app?: Unimport
  server?: Unimport
  components?: Component[]
}

export function collectContexts(nuxt: Nuxt): Collected {
  const collected: Collected = {}
  nuxt.hook('imports:context', (ctx) => {
    collected.app = ctx
  })
  nuxt.hook('components:extend', (components) => {
    collected.components = components
  })
  nuxt.hook('nitro:init', (nitro) => {
    collected.server = nitro.unimport as Unimport | undefined
  })
  return collected
}

interface LocalLayer {
  rootDir: string
  srcDir: string
  serverDir: string
  sharedDir: string
}

interface Barrel {
  prefix: string
  barrel: string
  names: Set<string>
  /** Used when the barrel does not export the name and the original path is not importable. */
  fallback?: string
}

const SCRIPT_EXT_RE = /\.[cm]?[jt]sx?$/
const NODE_MODULES_RE = /[\\/]node_modules[\\/]/
const TRAILING_SLASH_RE = /\/$/
const INDEX_RE = /\/index$/

export const SOURCE_PATTERN = '**/*.{vue,ts,tsx,js,jsx,mjs,mts,cjs,cts}'

/**
 * Files that are never checked or migrated.
 */
const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/.nuxt/**',
  '**/.output/**',
  '**/.data/**',
  '**/dist/**',
  '**/*.d.{ts,mts,cts}',
  // Config files: `defineNuxtConfig`, `defineAppConfig` and friends are injected by Nuxt.
  '**/*.config.*',
  '**/*.config',
  // Tests may rely on `@nuxt/test-utils` auto-imports.
  '**/*.{test,spec}.*',
  '**/{test,tests,__tests__}/**',
]

export type Side = 'app' | 'server'

/**
 * Everything the analyzer and the codemod need to know about a Nuxt project.
 */
export class Project {
  readonly layers: LocalLayer[]
  readonly typescript: boolean
  private readonly aliases: [alias: string, dir: string][]
  private readonly isExcludedMatcher: (path: string) => boolean

  constructor(
    readonly rootDir: string,
    readonly buildDir: string,
    alias: Record<string, string>,
    layers: LocalLayer[],
    exclude: string[],
    private readonly collected: Collected,
    private readonly barrels: Barrel[],
  ) {
    this.layers = layers
    this.typescript = existsSync(join(rootDir, 'tsconfig.json'))
    this.aliases = Object.entries(alias)
      .filter(([, dir]) => isAbsolute(dir) && !NODE_MODULES_RE.test(dir) && !dir.startsWith(buildDir))
      .map(([key, dir]): [string, string] => [
        key,
        dir.replace(TRAILING_SLASH_RE, ''),
      ])
      // Longest directory wins. On a tie, the alias declared first wins (`~` before `@`).
      .sort((a, b) => b[1].length - a[1].length)
    this.isExcludedMatcher = picomatch([
      ...DEFAULT_EXCLUDE,
      ...exclude,
    ], { dot: true })
  }

  relative(file: string): string {
    return relative(this.rootDir, file)
  }

  /** The directories that hold user code, in local layers only. */
  get sourceDirs(): string[] {
    return [
      ...new Set(this.layers.flatMap(l => [l.srcDir, l.serverDir, l.sharedDir])),
    ]
  }

  isLocal(file: string): boolean {
    return !NODE_MODULES_RE.test(file) && this.layers.some(l => isInside(file, l.rootDir))
  }

  isExcluded(file: string): boolean {
    return this.isExcludedMatcher(this.relative(file))
  }

  /** Whether a file belongs to the project and should be analyzed. */
  isTarget(file: string): boolean {
    return this.isLocal(file)
      && this.sourceDirs.some(dir => isInside(file, dir))
      && picomatch.isMatch(this.relative(file), SOURCE_PATTERN)
      && !this.isExcluded(file)
  }

  sideOf(file: string): Side {
    return this.layers.some(l => isInside(file, l.serverDir))
      ? 'server'
      : 'app'
  }

  async getImports(side: Side): Promise<Import[]> {
    const ctx = side === 'server'
      ? this.collected.server
      : this.collected.app
    return await ctx?.getImports() ?? []
  }

  getComponents(): Component[] {
    return this.collected.components ?? []
  }

  /**
   * Turn an absolute path into an aliased specifier, like `~/composables/foo`.
   * Returns `undefined` for paths outside the project aliases.
   */
  aliasFor(file: string, keepExtension = false): string | undefined {
    for (const [alias, dir] of this.aliases) {
      if (!isInside(file, dir))
        continue
      let rest = file.slice(dir.length)
      if (!keepExtension)
        rest = rest.replace(SCRIPT_EXT_RE, '').replace(INDEX_RE, '')
      return alias + rest
    }
  }

  /**
   * The specifier to write for an auto-import, following the original source:
   * - bare packages stay as they are (`vue`, `h3`),
   * - Nuxt internals use their public barrel when it exports the name (`#app/composables/router` -> `#app`),
   * - local files use an alias (`~/composables/foo`, `#server/utils/bar`),
   * - anything else falls back to the virtual `#imports`.
   */
  sourceFor(imp: Import): string {
    const { from } = imp
    if (isAbsolute(from)) {
      if (this.isLocal(from))
        return this.aliasFor(from) ?? '#imports'
      return '#imports'
    }
    for (const barrel of this.barrels) {
      if (!from.startsWith(barrel.prefix))
        continue
      if (barrel.names.has(imp.name))
        return barrel.barrel
      return barrel.fallback ?? from
    }
    return from
  }
}

export function isInside(file: string, dir: string): boolean {
  return file === dir || file.startsWith(`${dir.replace(TRAILING_SLASH_RE, '')}/`)
}

async function exportNames(id: string, url: string | undefined): Promise<Set<string>> {
  try {
    return new Set(await resolveModuleExportNames(id, { url }))
  }
  catch {
    return new Set()
  }
}

async function tryResolve(id: string, url: string | undefined): Promise<string | undefined> {
  try {
    return await resolvePath(id, { url })
  }
  catch {}
}

export async function createProject(nuxt: Nuxt, collected: Collected, exclude: string[] = []): Promise<Project> {
  const { rootDir, buildDir, alias } = nuxt.options
  const layers: LocalLayer[] = nuxt.options._layers
    .filter(layer => !NODE_MODULES_RE.test(layer.cwd ?? layer.config.rootDir))
    .map((layer) => {
      const root = layer.config.rootDir
      return {
        rootDir: root,
        srcDir: layer.config.srcDir,
        serverDir: layer.config.serverDir ?? resolve(root, 'server'),
        sharedDir: resolve(root, layer.config.dir?.shared ?? 'shared'),
      }
    })

  const appDir = alias['#app']
  // With pnpm, `nitropack` is only reachable through Nuxt's own dependencies.
  const nuxtPkg = await tryResolve('nuxt/package.json', rootDir)
  const nitroServer = nuxtPkg && await tryResolve('@nuxt/nitro-server', nuxtPkg)
  const barrels: Barrel[] = [
    {
      prefix: '#app/',
      barrel: '#app',
      names: appDir
        ? await exportNames(join(appDir, 'index.js'), rootDir)
        : new Set(),
    },
    {
      // Nuxt maps `nitropack/runtime` in the server tsconfig, but not its internal paths.
      prefix: 'nitropack/runtime/',
      barrel: 'nitropack/runtime',
      names: await exportNames('nitropack/runtime', nitroServer ?? rootDir),
      fallback: '#imports',
    },
  ]

  return new Project(rootDir, buildDir, alias, layers, exclude, collected, barrels)
}
