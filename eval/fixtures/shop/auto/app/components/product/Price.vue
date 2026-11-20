<script setup lang="ts">
const props = defineProps<{ cents: number }>()
const text = computed(() => formatMoney(props.cents))
</script>

<template>
  <p class="product-price">
    {{ text }}
  </p>
</template>
