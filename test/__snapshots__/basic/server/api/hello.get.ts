import { defineEventHandler, getQuery } from 'h3'
import { useGreeting } from '#server/utils/greeting'
import { sum } from '#shared/utils/sum'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  return { message: useGreeting(String(query.name ?? 'world')), total: sum(1, 2) }
})
