<script setup lang="ts">
import type { Product } from '#shared/types/product'
import { NuxtLink } from '#components'
import UiCard from '#layers/ui/app/components/UiCard.vue'
import ProductPrice from '~/components/product/Price.vue'

defineProps<{ product: Product }>()
</script>

<template>
  <UiCard>
    <article class="product-card">
      <NuxtLink :to="`/products/${product.slug}`">
        <h2>{{ product.name }}</h2>
      </NuxtLink>
      <ProductPrice :cents="product.priceCents" />
      <slot />
    </article>
  </UiCard>
</template>
