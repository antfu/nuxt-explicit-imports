import type { CartLine } from '#shared/types/cart'
import { sumBy } from '#shared/utils/math'
import { findProduct } from '#server/utils/db'
import { computeDiscount } from '#server/utils/discount'
import { discountPercent } from '#shared/utils/discount'
import { formatMoney } from '#server/utils/money'

export interface Quote {
  subtotal: string
  discount: string
  total: string
}

export function computeQuote(lines: CartLine[], code?: string): Quote {
  const subtotal = sumBy(lines, line => (findProduct(line.slug)?.priceCents ?? 0) * line.qty)
  const discount = computeDiscount(subtotal, discountPercent(code))
  return {
    subtotal: formatMoney(subtotal),
    discount: formatMoney(discount),
    total: formatMoney(subtotal - discount),
  }
}
