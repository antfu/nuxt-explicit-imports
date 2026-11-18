<script setup lang="ts">
import type { Product } from '#shared/types/product'
import ProductPrice from '~/components/product/Price.vue'
import UiCard from '#layers/ui/app/components/UiCard.vue'
import { NuxtLink } from '#components'

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
