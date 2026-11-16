#!/usr/bin/env node
import type { Category, Finding } from './types'
import process from 'node:process'
import { cac } from 'cac'
import { consola } from 'consola'
import { version } from '../package.json'
import { check, migrate, openSession } from './run'
import { CATEGORIES } from './types'

interface CommonFlags {
  root: string
  category?: string
}

function parseCategories(value: string | undefined): Category[] | undefined {
  if (!value)
    return
  const list = value.split(',').map(v => v.trim()).filter(Boolean)
  for (const item of list) {
    if (!CATEGORIES.includes(item as Category))
      throw new Error(`Unknown category "${item}". Use: ${CATEGORIES.join(', ')}.`)
  }
  return list as Category[]
}

function printFindings(findings: Finding[]): void {
  let current = ''
  for (const finding of findings) {
    if (finding.file !== current) {
      current = finding.file
      consola.log(`\n${current}`)
    }
    const fix = finding.fixable
      ? finding.suggestion.split('\n')[0]
      : `manual: ${finding.reason}`
    consola.log(`  ${`${finding.line}:${finding.column}`.padEnd(8)} ${finding.category.padEnd(10)} ${finding.name.padEnd(24)} ${fix}`)
  }
}

function countBy(findings: Finding[]): string {
  return CATEGORIES.map(c => `${c}: ${findings.filter(f => f.category === c).length}`).join(', ')
}

const cli = cac('nuxt-explicit-imports')

cli
  .command('check [...paths]', 'Report every implicit auto-import. Exits with code 1 when any is found.')
  .option('--root <dir>', 'Nuxt root directory', { default: '.' })
  .option('--category <list>', `Comma-separated categories: ${CATEGORIES.join(', ')}`)
  .option('--json', 'Print the report as JSON')
  .action(async (paths: string[], flags: CommonFlags & { json?: boolean }) => {
    const session = await openSession({
      root: flags.root,
      paths,
      categories: parseCategories(flags.category),
    })
    const { report, reportFile } = await check(session)
    if (flags.json) {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    }
    else {
      printFindings(report.findings)
      const modes = CATEGORIES.map(c => `${c}=${session.modes[c]}`).join(', ')
      consola.log('')
      consola.info(`Modes: ${modes}`)
      consola.info(`Checked ${session.files.length} files in: ${session.categories.join(', ')}`)
      if (report.findings.length) {
        const manual = report.findings.filter(f => !f.fixable).length
        consola.warn(`${report.findings.length} implicit auto-imports (${countBy(report.findings)}), ${manual} need manual work.`)
        consola.info(`Report: ${reportFile}`)
      }
      else {
        consola.success('No implicit auto-imports found.')
      }
    }
    process.exitCode = report.findings.length ? 1 : 0
  })

cli
  .command('migrate [...paths]', 'Add explicit imports for every fixable implicit auto-import.')
  .option('--root <dir>', 'Nuxt root directory', { default: '.' })
  .option('--category <list>', `Comma-separated categories: ${CATEGORIES.join(', ')}`)
  .option('--dry-run', 'List the changes without writing files')
  .action(async (paths: string[], flags: CommonFlags & { dryRun?: boolean }) => {
    const session = await openSession({
      root: flags.root,
      paths,
      categories: parseCategories(flags.category),
    })
    const result = await migrate(session, { dryRun: flags.dryRun })
    for (const file of result.changed)
      consola.log(`  ${flags.dryRun ? 'would update' : 'updated'} ${file}`)
    consola.success(`${flags.dryRun ? 'Would fix' : 'Fixed'} ${result.fixed.length} implicit auto-imports in ${result.changed.length} files.`)
    if (result.manual.length) {
      consola.warn(`${result.manual.length} need manual work:`)
      printFindings(result.manual)
    }
    if (!flags.dryRun)
      consola.info('Next: run `nuxt-explicit-imports check`, then your typecheck, lint and tests.')
  })

cli.help()
cli.version(version)

async function main(): Promise<void> {
  try {
    cli.parse(process.argv, { run: false })
    if (!cli.matchedCommand) {
      cli.outputHelp()
      return
    }
    await cli.runMatchedCommand()
  }
  catch (error) {
    consola.error(error)
    process.exitCode = 2
  }
}

main()
