<script setup lang="ts">
import ProductGrid from '~/components/product/Grid.vue'
import { useProducts } from '~/composables/useProducts'

const { data: products } = await useProducts()
</script>

<template>
  <div>
    <h1>Shop</h1>
    <ProductGrid :products="products" />
  </div>
</template>
