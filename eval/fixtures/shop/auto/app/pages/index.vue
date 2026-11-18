<script setup lang="ts">
const { data: products } = await useProducts()
</script>

<template>
  <div>
    <h1>Shop</h1>
    <ProductGrid :products="products" />
  </div>
</template>
