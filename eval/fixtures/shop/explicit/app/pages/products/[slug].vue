<script setup lang="ts">
import type { Product } from '#shared/types/product'
import { useFetch, useRoute } from '#imports'
import { useNotify } from '#layers/base/app/composables/useNotify'
import UiBadge from '#layers/ui/app/components/UiBadge.vue'
import UiButton from '#layers/ui/app/components/UiButton.vue'
import UiCard from '#layers/ui/app/components/UiCard.vue'
import ProductPrice from '~/components/product/Price.vue'
import { useCart } from '~/composables/useCart'

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
