import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useCart } from '~/composables/useCart'

export default defineNuxtRouteMiddleware(() => {
  const { count } = useCart()
  if (!count.value)
    return navigateTo('/cart')
})
