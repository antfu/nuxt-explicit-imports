<script setup lang="ts">
const { count } = useCart()
</script>

<template>
  <UiBadge class="cart-badge">
    {{ count }}
  </UiBadge>
</template>
