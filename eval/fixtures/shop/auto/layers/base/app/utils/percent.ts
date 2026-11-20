/** `10` -> `10%`. */
export function formatPercent(percent: number): string {
  return `${percent}%`
}

/** `percent` of `cents`, rounded to the nearest cent. */
export function percentOf(cents: number, percent: number): number {
  return Math.round(cents * percent / 100)
}
