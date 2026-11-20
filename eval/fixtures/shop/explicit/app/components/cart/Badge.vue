<script setup lang="ts">
import UiBadge from '#layers/ui/app/components/UiBadge.vue'
import { useCart } from '~/composables/useCart'

const { count } = useCart()
</script>

<template>
  <UiBadge class="cart-badge">
    {{ count }}
  </UiBadge>
</template>
