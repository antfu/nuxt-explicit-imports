import type { CartLine } from '#shared/types/cart'

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
