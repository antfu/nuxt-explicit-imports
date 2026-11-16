export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  return { provide: { hello: () => config.app.baseURL } }
})
