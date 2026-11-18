/** Money format for the UI: `1999` -> `$19.99`. */
export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
