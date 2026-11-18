<script setup lang="ts">
import type { Product } from '#shared/types/product'

defineProps<{ product: Product }>()
</script>

<template>
  <article class="ui-product-card">
    {{ product.name }}
  </article>
</template>
