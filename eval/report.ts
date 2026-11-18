import type { AgentMetrics, Arm, ErrorKind, RunResult, Taxonomy } from './types'
import { ARMS } from './types'

type Agent = Omit<AgentMetrics, 'toolOutputs'>

const KINDS: ErrorKind[] = [
  'missing-name',
  'bad-module-path',
  'bad-export',
  'duplicate-declaration',
  'other-ts',
  'build-resolve',
]

const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0)
const toolCalls = (a: Agent): number => sum(Object.values(a.toolCalls))
const inputTokens = (a: Agent): number => a.inputTokens + a.cacheReadTokens + a.cacheWriteTokens

interface Metric {
  label: string
  get: (a: Agent) => number
  digits?: number
}

/** Per-run efficiency metrics. Lower is better for all of them. */
const METRICS: Metric[] = [
  {
    label: 'Turns',
    get: a => a.turns,
  },
  { label: 'Tool calls', get: toolCalls },
  {
    label: '- explore (read, search)',
    get: a => a.toolKinds.explore,
  },
  {
    label: '- edit',
    get: a => a.toolKinds.edit,
  },
  {
    label: '- verify (typecheck, build)',
    get: a => a.toolKinds.verify,
  },
  {
    label: '- other',
    get: a => a.toolKinds.other,
  },
  { label: 'Input tokens (incl. cache)', get: inputTokens },
  {
    label: '- uncached',
    get: a => a.inputTokens,
  },
  {
    label: '- cache read',
    get: a => a.cacheReadTokens,
  },
  {
    label: '- cache write',
    get: a => a.cacheWriteTokens,
  },
  {
    label: 'Output tokens',
    get: a => a.outputTokens,
  },
  {
    label: 'Total tokens',
    get: a => inputTokens(a) + a.outputTokens,
  },
  {
    label: 'Tool output read (k chars)',
    get: a => a.toolOutputChars / 1000,
    digits: 1,
  },
  {
    label: 'Agent time (s)',
    get: a => a.ms / 1000,
    digits: 1,
  },
  {
    label: 'API time (s)',
    get: a => a.apiMs / 1000,
    digits: 1,
  },
  {
    label: 'Cost ($)',
    get: a => a.costUsd,
    digits: 4,
  },
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

function mean(values: number[]): number {
  return values.length
    ? sum(values) / values.length
    : Number.NaN
}
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

/** Change from `auto` to `explicit`, as a signed percentage. */
function delta(auto: number, explicit: number): string {
  if (Number.isNaN(auto) || Number.isNaN(explicit))
    return '-'
  if (auto === 0) {
    return explicit === 0
      ? '0%'
      : 'n/a'
  }
  const change = (explicit - auto) / auto * 100
  return `${change > 0
    ? '+'
    : ''}${change.toFixed(0)}%`
}

function table(head: string[], rows: string[][]): string {
  return [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n')
}

function agentsOf(runs: RunResult[]): Agent[] {
  return runs.flatMap(r => (r.agent
    ? [r.agent]
    : []))
}

/** Every metric for both arms: median, mean and the change from auto to explicit. */
function efficiencyTable(runsByArm: Record<Arm, RunResult[]>): string {
  const agents = {
    auto: agentsOf(runsByArm.auto),
    explicit: agentsOf(runsByArm.explicit),
  }
  return table(
    [
      'Metric (per run)',
      'auto median',
      'explicit median',
      'change',
      'auto mean',
      'explicit mean',
      'change',
    ],
    METRICS.map(({ label, get, digits }) => {
      const med = {
        auto: median(agents.auto.map(get)),
        explicit: median(agents.explicit.map(get)),
      }
      const avg = {
        auto: mean(agents.auto.map(get)),
        explicit: mean(agents.explicit.map(get)),
      }
      return [
        label,
        fmt(med.auto, digits),
        fmt(med.explicit, digits),
        delta(med.auto, med.explicit),
        fmt(avg.auto, digits),
        fmt(avg.explicit, digits),
        delta(avg.auto, avg.explicit),
      ]
    }),
  )
}

/** Per task: pass rate, then median turns, tool calls, tokens and time per arm, with the change in tokens and time. */
function perTaskTable(tasks: string[], byArm: (arm: Arm, list?: RunResult[]) => RunResult[], results: RunResult[]): string {
  const cols: Metric[] = [
    {
      label: 'turns',
      get: a => a.turns,
    },
    { label: 'tools', get: toolCalls },
    {
      label: 'k tokens',
      get: a => (inputTokens(a) + a.outputTokens) / 1000,
      digits: 0,
    },
    {
      label: 's',
      get: a => a.ms / 1000,
      digits: 0,
    },
  ]
  return table(
    [
      'Task',
      ...ARMS.flatMap(arm => [
        `${arm} pass`,
        ...cols.map(c => `${arm} ${c.label}`),
      ]),
      'tokens change',
      'time change',
    ],
    tasks.map((task) => {
      const list = results.filter(r => r.task === task)
      const agents = {
        auto: agentsOf(byArm('auto', list)),
        explicit: agentsOf(byArm('explicit', list)),
      }
      const med = (arm: Arm, m: Metric): number => median(agents[arm].map(m.get))
      return [
        task,
        ...ARMS.flatMap((arm) => {
          const runs = byArm(arm, list)
          return [
            pct(runs.filter(r => r.pass).length, runs.length),
            ...cols.map(c => fmt(med(arm, c), c.digits)),
          ]
        }),
        delta(med('auto', cols[2]!), med('explicit', cols[2]!)),
        delta(med('auto', cols[3]!), med('explicit', cols[3]!)),
      ]
    }),
  )
}

/** Mean calls per run of each tool, by arm. */
function toolTable(runsByArm: Record<Arm, RunResult[]>): string {
  const agents = {
    auto: agentsOf(runsByArm.auto),
    explicit: agentsOf(runsByArm.explicit),
  }
  const names = [
    ...new Set([
      ...agents.auto,
      ...agents.explicit,
    ].flatMap(a => Object.keys(a.toolCalls))),
  ].sort()
  return table(
    [
      'Tool',
      'auto calls/run',
      'explicit calls/run',
      'change',
    ],
    names.map((name) => {
      const avg = (arm: Arm): number => mean(agents[arm].map(a => a.toolCalls[name] ?? 0))
      return [
        name,
        fmt(avg('auto'), 2),
        fmt(avg('explicit'), 2),
        delta(avg('auto'), avg('explicit')),
      ]
    }),
  )
}

function sumTaxonomy(results: RunResult[], key: 'errorsDuringRun' | 'errorsAtEnd'): Taxonomy {
  const total: Taxonomy = {}
  for (const result of results) {
    for (const kind of KINDS)
      total[kind] = (total[kind] ?? 0) + (result[key][kind] ?? 0)
  }
  return total
}

function failureLine(r: RunResult): string {
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
}

/** Markdown summary: pass rate, efficiency per arm and per task, tool usage, then error counts. */
export function summarize(results: RunResult[], meta: Record<string, string | number>): string {
  const byArm = (arm: Arm, list = results): RunResult[] => list.filter(r => r.arm === arm && !r.harnessError)
  const runsByArm = {
    auto: byArm('auto'),
    explicit: byArm('explicit'),
  }
  const passedByArm = {
    auto: runsByArm.auto.filter(r => r.pass),
    explicit: runsByArm.explicit.filter(r => r.pass),
  }
  const tasks = [
    ...new Set(results.map(r => r.task)),
  ]
  const failures = results.filter(r => !r.pass && !r.harnessError)
  const harnessErrors = results.filter(r => r.harnessError)

  const passRate = table(
    [
      'Arm',
      'Pass',
      'Total agent time (min)',
      'Total tokens',
      'Total cost ($)',
    ],
    ARMS.map((arm) => {
      const runs = runsByArm[arm]
      const agents = agentsOf(runs)
      return [
        arm,
        pct(runs.filter(r => r.pass).length, runs.length),
        fmt(sum(agents.map(a => a.ms)) / 60_000, 1),
        fmt(sum(agents.map(a => inputTokens(a) + a.outputTokens))),
        fmt(sum(agents.map(a => a.costUsd)), 3),
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
      ...ARMS.flatMap(arm => [
        String(sumTaxonomy(runsByArm[arm], 'errorsDuringRun')[kind] ?? 0),
        String(sumTaxonomy(runsByArm[arm], 'errorsAtEnd')[kind] ?? 0),
      ]),
    ]),
  )

  return [
    '# Auto-imports on/off eval',
    '',
    Object.entries(meta).map(([k, v]) => `- ${k}: ${v}`).join('\n'),
    '',
    '## Pass rate',
    '',
    passRate,
    '',
    '## Efficiency',
    '',
    'Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.',
    '',
    efficiencyTable(runsByArm),
    '',
    ...(failures.length
      ? [
          '### Passing runs only',
          '',
          'The same metrics without failed runs, which often stop early or run out of turns.',
          '',
          efficiencyTable(passedByArm),
          '',
        ]
      : []),
    '## Per task',
    '',
    'Medians per run. "k tokens" counts input (with cache) and output tokens.',
    '',
    perTaskTable(tasks, byArm, results),
    '',
    '## Tool usage',
    '',
    toolTable(runsByArm),
    '',
    '## Errors',
    '',
    'TypeScript and build errors, counted in the agent\'s tool output while it worked and in the final gates.',
    '',
    errors,
    '',
    ...(failures.length
      ? [
          '## Failures',
          '',
          ...failures.map(failureLine),
          '',
        ]
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
