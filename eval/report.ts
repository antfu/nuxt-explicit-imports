import type { Arm, ErrorKind, RunResult, Taxonomy } from './types'
import { ARMS } from './types'

const KINDS: ErrorKind[] = [
  'missing-name',
  'bad-module-path',
  'bad-export',
  'duplicate-declaration',
  'other-ts',
  'build-resolve',
]

function median(values: number[]): number {
  if (!values.length)
    return Number.NaN
  const sorted = values.toSorted((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}

const mean = (values: number[]): number => values.reduce((a, b) => a + b, 0) / values.length
function fmt(n: number, digits = 0): string {
  return Number.isNaN(n)
    ? '-'
    : n.toFixed(digits)
}
function pct(pass: number, total: number): string {
  return total
    ? `${pass}/${total} (${Math.round(pass / total * 100)}%)`
    : '-'
}

function sumTaxonomy(results: RunResult[], key: 'errorsDuringRun' | 'errorsAtEnd'): Taxonomy {
  const total: Taxonomy = {}
  for (const result of results) {
    for (const kind of KINDS)
      total[kind] = (total[kind] ?? 0) + (result[key][kind] ?? 0)
  }
  return total
}

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n')
}

/** Markdown summary: pass rate and median cost per arm, per task and per arm, then error counts. */
export function summarize(results: RunResult[], meta: Record<string, string | number>): string {
  const byArm = (arm: Arm, list = results): RunResult[] => list.filter(r => r.arm === arm && !r.harnessError)
  const tasks = [
    ...new Set(results.map(r => r.task)),
  ]
  const harnessErrors = results.filter(r => r.harnessError)

  const overall = table(
    [
      'Arm',
      'Pass',
      'Median turns',
      'Median tool calls',
      'Median output tokens',
      'Median time (s)',
      'Mean cost ($)',
    ],
    ARMS.map((arm) => {
      const list = byArm(arm)
      const agents = list.flatMap(r => (r.agent
        ? [r.agent]
        : []))
      return [
        arm,
        pct(list.filter(r => r.pass).length, list.length),
        fmt(median(agents.map(a => a.turns))),
        fmt(median(agents.map(a => Object.values(a.toolCalls).reduce((x, y) => x + y, 0)))),
        fmt(median(agents.map(a => a.outputTokens))),
        fmt(median(agents.map(a => a.ms / 1000))),
        agents.length
          ? fmt(mean(agents.map(a => a.costUsd)), 3)
          : '-',
      ]
    }),
  )

  const perTask = table(
    [
      'Task',
      ...ARMS.flatMap(arm => [`${arm} pass`, `${arm} turns`]),
    ],
    tasks.map((task) => {
      const list = results.filter(r => r.task === task)
      return [
        task,
        ...ARMS.flatMap((arm) => {
          const runs = byArm(arm, list)
          return [
            pct(runs.filter(r => r.pass).length, runs.length),
            fmt(median(runs.flatMap(r => (r.agent
              ? [r.agent.turns]
              : [])))),
          ]
        }),
      ]
    }),
  )

  const errors = table(
    [
      'Error kind',
      ...ARMS.flatMap(arm => [`${arm} during run`, `${arm} at end`]),
    ],
    KINDS.map(kind => [
      kind,
      ...ARMS.flatMap((arm) => {
        const runs = byArm(arm)
        return [
          String(sumTaxonomy(runs, 'errorsDuringRun')[kind] ?? 0),
          String(sumTaxonomy(runs, 'errorsAtEnd')[kind] ?? 0),
        ]
      }),
    ]),
  )

  const failures = results
    .filter(r => !r.pass && !r.harnessError)
    .map((r) => {
      const why = [
        r.typecheck.ok ? '' : 'typecheck failed',
        r.build.ok ? '' : 'build failed',
        ...r.assertions.filter(a => !a.ok).map(a => (a.detail
          ? `${a.name} (got: ${a.detail})`
          : a.name)),
        r.agent && r.agent.stop !== 'success'
          ? `agent stopped: ${r.agent.stop}`
          : '',
      ].filter(Boolean)
      return `- \`${r.task}\` ${r.arm} #${r.trial}: ${why.join('; ')}`
    })

  return [
    '# Auto-imports on/off eval',
    '',
    Object.entries(meta).map(([k, v]) => `- ${k}: ${v}`).join('\n'),
    '',
    '## Overall',
    '',
    overall,
    '',
    '## Per task',
    '',
    perTask,
    '',
    '## Errors',
    '',
    'TypeScript and build errors, counted in the agent\'s tool output while it worked and in the final gates.',
    '',
    errors,
    '',
    ...(failures.length
      ? ['## Failures', '', ...failures, '']
      : []),
    ...(harnessErrors.length
      ? [
          '## Harness errors',
          '',
          ...harnessErrors.map(r => `- \`${r.task}\` ${r.arm} #${r.trial}: ${r.harnessError}`),
          '',
        ]
      : []),
  ].join('\n')
}
