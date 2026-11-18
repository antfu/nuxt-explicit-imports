export default defineNuxtRouteMiddleware(() => {
  const { count } = useCart()
  if (!count.value)
    return navigateTo('/cart')
})
