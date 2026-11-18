import { formatMoney } from '~/utils/money'

/**
 * Price after discount, as shown in the UI.
 * The discount is rounded down, so the UI never promises more than the server quote.
 */
export function applyDiscount(cents: number, percent: number): number {
  return cents - Math.floor(cents * percent / 100)
}

/** `399` -> `-$3.99`. */
export function formatDiscount(cents: number): string {
  return `-${formatMoney(cents)}`
}
