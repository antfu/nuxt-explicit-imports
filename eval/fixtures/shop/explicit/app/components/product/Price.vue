<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney } from '~/utils/money'

const props = defineProps<{ cents: number }>()
const text = computed(() => formatMoney(props.cents))
</script>

<template>
  <p class="product-price">
    {{ text }}
  </p>
</template>
