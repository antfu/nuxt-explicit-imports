import type { Category, Finding, Mode, Report } from './types'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'pathe'

const REPORT_FILENAME = 'explicit-imports-report.json'

/**
 * `nuxi build` uses a build dir inside `node_modules/.cache`. Keep the report in `.nuxt`
 * so dev, build and the CLI all write to the same file.
 */
export function reportPath(rootDir: string, buildDir: string): string {
  return join(buildDir.includes('/node_modules/')
    ? join(rootDir, '.nuxt')
    : buildDir, REPORT_FILENAME)
}

export function sortFindings(findings: Finding[]): Finding[] {
  return findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column)
}

export async function writeReport(path: string, report: Report): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`)
}

/**
 * Replace the findings of the given files in an existing report, keeping the others.
 * Dev and build only see the files they transform, so they merge instead of overwriting.
 */
export async function mergeReport(path: string, source: Report['source'], modes: Record<Category, Mode>, byFile: Map<string, Finding[]>): Promise<void> {
  let previous: Finding[] = []
  if (existsSync(path)) {
    try {
      previous = (JSON.parse(await readFile(path, 'utf8')) as Report).findings ?? []
    }
    catch {}
  }
  const findings = previous.filter(f => !byFile.has(f.file))
  for (const list of byFile.values())
    findings.push(...list)
  await writeReport(path, {
    version: 1,
    generatedAt: new Date().toISOString(),
    source,
    modes,
    findings: sortFindings(findings),
  })
}

/** One line per file, used by the dev and build warnings. */
export function formatFileLine(file: string, findings: Finding[]): string {
  const names = findings.map(f => f.kind === 'component' || f.kind === 'lazy-component'
    ? `<${f.name}>`
    : f.name)
  const shown = names.slice(0, 6).join(', ')
  return `${file}: ${shown}${names.length > 6
    ? ` (+${names.length - 6} more)`
    : ''}`
}
