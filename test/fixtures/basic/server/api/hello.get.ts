export default defineEventHandler((event) => {
  const query = getQuery(event)
  return { message: useGreeting(String(query.name ?? 'world')), total: sum(1, 2) }
})
