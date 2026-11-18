<script setup lang="ts">
import type { Product } from '#shared/types/product'

const route = useRoute()
const { data: product } = await useFetch<Product & { price: string }>(`/api/products/${route.params.slug}`)
const { add } = useCart()
const { notify } = useNotify()

function addToCart() {
  if (!product.value)
    return
  add(product.value.slug)
  notify(`${product.value.name} added to the cart`)
}
</script>

<template>
  <UiCard v-if="product">
    <h1>{{ product.name }}</h1>
    <ProductPrice id="price" :cents="product.priceCents" />
    <UiBadge class="stock">
      In stock
    </UiBadge>
    <UiButton id="add-to-cart" @click="addToCart">
      Add to cart
    </UiButton>
  </UiCard>
</template>
