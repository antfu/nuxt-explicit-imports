export type Mode = 'off' | 'warn' | 'strict'

export type Category = 'imports' | 'components' | 'server'

export const CATEGORIES: readonly Category[] = ['imports', 'components', 'server']

export type ModeOption = Mode | Partial<Record<Category, Mode>>

export interface ModuleOptions {
  /**
   * How implicit auto-imports are treated.
   *
   * - `off`: do nothing.
   * - `warn`: auto-imports keep working, every implicit use is reported.
   * - `strict`: auto-imports are disabled, every implicit use fails the build.
   *
   * Pass an object to set the mode per category. Categories you leave out use `warn`.
   *
   * @default 'warn'
   */
  mode: ModeOption
  /**
   * Extra glob patterns, relative to the root dir, that are never checked or migrated.
   */
  exclude: string[]
  /**
   * Write the machine-readable report to `<buildDir>/explicit-imports-report.json`.
   *
   * @default true
   */
  report: boolean
  /**
   * Internal: set by the CLI. Collect the contexts but do not change Nuxt options or add plugins.
   *
   * @internal
   */
  _analyze?: boolean
}

export type FindingKind = 'import' | 'type' | 'component' | 'lazy-component'

/**
 * One implicit use of an auto-import. This is the shape written to the report JSON.
 */
export interface Finding {
  /** Path relative to the Nuxt root dir, with forward slashes. */
  file: string
  line: number
  column: number
  category: Category
  kind: FindingKind
  /** The identifier or the component tag as written in the source. */
  name: string
  /** The import statement that makes this use explicit. */
  suggestion: string
  /** Whether `migrate` can fix this automatically. */
  fixable: boolean
  /** Why the finding needs manual work. Only set when `fixable` is `false`. */
  reason?: string
}

export interface Report {
  version: 1
  generatedAt: string
  source: 'check' | 'dev' | 'build'
  modes: Record<Category, Mode>
  findings: Finding[]
}
