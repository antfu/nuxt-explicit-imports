<script setup lang="ts">
import { NuxtLink } from '#components'
import CartBadge from '~/components/cart/Badge.vue'
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
