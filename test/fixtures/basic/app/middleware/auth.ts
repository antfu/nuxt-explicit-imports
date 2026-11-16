export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/secret')
    return navigateTo('/')
})
