<script setup lang="ts">
import type { Product } from '#shared/types/product'
import ProductCard from '~/components/product/Card.vue'

defineProps<{ products: Product[] }>()
</script>

<template>
  <section class="product-grid">
    <ProductCard v-for="product in products" :key="product.slug" :product="product" />
  </section>
</template>
