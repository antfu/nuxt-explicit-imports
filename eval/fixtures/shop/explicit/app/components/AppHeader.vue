<script setup lang="ts">
import CartBadge from '~/components/cart/Badge.vue'
import { NuxtLink } from '#components'
</script>

<template>
  <header class="app-header">
    <NuxtLink to="/">
      Shop
    </NuxtLink>
    <NuxtLink to="/cart">
      Cart <CartBadge />
    </NuxtLink>
  </header>
</template>
