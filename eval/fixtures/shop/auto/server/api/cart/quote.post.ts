import type { CartLine } from '#shared/types/cart'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ lines?: CartLine[], code?: string }>(event)
  return computeQuote(body?.lines ?? [], body?.code)
})
