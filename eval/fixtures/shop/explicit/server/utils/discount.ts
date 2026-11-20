/** Authoritative discount in cents, used for quotes and orders. Rounds to the nearest cent. */
export function computeDiscount(cents: number, percent: number): number {
  return Math.round(cents * percent / 100)
}
