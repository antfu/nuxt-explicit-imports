/** Server-side money format for API responses: `1999` -> `19.99 USD`. */
export function formatMoney(cents: number): string {
  return `${(cents / 100).toFixed(2)} USD`
}
