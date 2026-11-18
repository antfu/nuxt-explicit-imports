import type { ErrorKind, Taxonomy } from './types'

const TS_CODES: Record<string, ErrorKind> = {
  // Cannot find name 'x' (and the "Did you mean" variant).
  TS2304: 'missing-name',
  TS2552: 'missing-name',
  // Cannot find module 'x'.
  TS2307: 'bad-module-path',
  // Module 'x' has no exported member 'y'.
  TS2305: 'bad-export',
  TS2614: 'bad-export',
  TS2724: 'bad-export',
  // Duplicate identifier / import conflicts with a local declaration / cannot redeclare.
  TS2300: 'duplicate-declaration',
  TS2440: 'duplicate-declaration',
  TS2451: 'duplicate-declaration',
}

/** Build errors from Rollup/Vite when an import cannot be resolved or is not exported. */
const BUILD_PATTERNS = [
  /Could not resolve ["']/g,
  /is not exported by /g,
  /Failed to resolve import ["']/g,
  /\[UNRESOLVED_IMPORT\]/g,
  /\[MISSING_EXPORT\]/g,
]

/**
 * Count errors in gate or tool output by kind.
 * Each `file(line,col): error TSxxxx` line counts once, so the same error printed twice in one output counts twice.
 */
export function classify(output: string): Taxonomy {
  const result: Taxonomy = {}
  const add = (kind: ErrorKind): void => {
    result[kind] = (result[kind] ?? 0) + 1
  }
  for (const [, code] of output.matchAll(/error (TS\d+):/g))
    add(TS_CODES[code!] ?? 'other-ts')
  for (const pattern of BUILD_PATTERNS) {
    for (const _ of output.matchAll(pattern))
      add('build-resolve')
  }
  return result
}

export function mergeTaxonomy(...items: Taxonomy[]): Taxonomy {
  const result: Taxonomy = {}
  for (const item of items) {
    for (const [kind, n] of Object.entries(item) as [ErrorKind, number][])
      result[kind] = (result[kind] ?? 0) + n
  }
  return result
}
