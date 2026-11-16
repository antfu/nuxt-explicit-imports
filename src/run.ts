import type { FileAnalysis } from './analyze'
import type { Project } from './project'
import type { Category, Finding, Mode, Report } from './types'
import { readFile, writeFile } from 'node:fs/promises'
import { buildNuxt, loadNuxt } from '@nuxt/kit'
import { resolve } from 'pathe'
import { glob } from 'tinyglobby'
import { analyzeFile, toFindings } from './analyze'
import { applyFixes } from './fix'
import { resolveModes } from './options'
import { collectContexts, createProject, isInside, SOURCE_PATTERN } from './project'
import { reportPath, sortFindings, writeReport } from './report'
import { CATEGORIES } from './types'

export interface RunOptions {
  /** The Nuxt root dir. */
  root: string
  /** Only these files or directories. Relative paths resolve from `root`. */
  paths?: string[]
  /** Only these categories. Defaults to every category whose mode is not `off`. */
  categories?: Category[]
}

export interface Session {
  project: Project
  modes: Record<Category, Mode>
  categories: Category[]
  files: string[]
}

/**
 * Load the Nuxt project like `nuxi prepare` does and collect the auto-import contexts.
 */
export async function openSession(options: RunOptions): Promise<Session> {
  const root = resolve(options.root)
  const nuxt = await loadNuxt({
    cwd: root,
    ready: false,
    overrides: {
      _prepare: true,
      logLevel: 'silent',
      // Keep the contexts complete even when a category is already strict.
      explicitImports: { _analyze: true },
    } as any,
  })
  const collected = collectContexts(nuxt)
  try {
    await nuxt.ready()
    await buildNuxt(nuxt)
    const config = (nuxt.options as any).explicitImports as { mode?: Mode, exclude?: string[] } | undefined
    const modes = resolveModes(config?.mode)
    const project = await createProject(nuxt, collected, config?.exclude)
    const categories = options.categories ?? CATEGORIES.filter(c => modes[c] !== 'off')
    const files = await listFiles(project, options.paths)
    return { project, modes, categories, files }
  }
  finally {
    await nuxt.close()
  }
}

async function listFiles(project: Project, paths?: string[]): Promise<string[]> {
  const files = await glob(SOURCE_PATTERN, {
    cwd: project.rootDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.nuxt/**', '**/.output/**'],
  })
  const filters = paths?.map(p => resolve(project.rootDir, p))
  return files
    .filter(file => project.isTarget(file))
    .filter(file => !filters?.length || filters.some(dir => isInside(file, dir)))
    .sort()
}

async function analyzeAll(session: Session): Promise<FileAnalysis[]> {
  const analyses: FileAnalysis[] = []
  for (const file of session.files) {
    const analysis = await analyzeFile(session.project, file, await readFile(file, 'utf8'))
    analysis.usages = analysis.usages.filter(u => session.categories.includes(u.category))
    if (analysis.usages.length)
      analyses.push(analysis)
  }
  return analyses
}

export interface CheckResult {
  report: Report
  reportFile: string
}

/** Find every implicit auto-import and write the report. */
export async function check(session: Session): Promise<CheckResult> {
  const findings: Finding[] = []
  for (const analysis of await analyzeAll(session))
    findings.push(...toFindings(session.project, analysis))
  const report: Report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'check',
    modes: session.modes,
    findings: sortFindings(findings),
  }
  const reportFile = reportPath(session.project.rootDir, session.project.buildDir)
  await writeReport(reportFile, report)
  return { report, reportFile }
}

export interface MigrateResult {
  changed: string[]
  fixed: Finding[]
  manual: Finding[]
}

/** Rewrite files to import every fixable auto-import explicitly. */
export async function migrate(session: Session, { dryRun = false } = {}): Promise<MigrateResult> {
  const result: MigrateResult = { changed: [], fixed: [], manual: [] }
  for (const analysis of await analyzeAll(session)) {
    for (const finding of toFindings(session.project, analysis))
      (finding.fixable ? result.fixed : result.manual).push(finding)
    const code = applyFixes(analysis)
    if (code === undefined || code === analysis.code)
      continue
    result.changed.push(session.project.relative(analysis.file))
    if (!dryRun)
      await writeFile(analysis.file, code)
  }
  return result
}
