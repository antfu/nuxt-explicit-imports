export const DISCOUNT_CODES: Record<string, number> = {
  SAVE10: 10,
  HALF: 50,
}

/** Discount percentage for a code, 0 when the code is unknown. */
export function discountPercent(code: string | null | undefined): number {
  return clamp(DISCOUNT_CODES[code?.toUpperCase() ?? ''] ?? 0, 0, 100)
}
