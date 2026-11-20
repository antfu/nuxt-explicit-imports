import type { CartLine } from '#shared/types/cart'
import { defineEventHandler, readBody } from 'h3'
import { computeQuote } from '#server/utils/quote'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ lines?: CartLine[], code?: string }>(event)
  return computeQuote(body?.lines ?? [], body?.code)
})
