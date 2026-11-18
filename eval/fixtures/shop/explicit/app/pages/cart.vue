<script setup lang="ts">
import { NuxtLink } from '#components'
import CartItem from '~/components/cart/Item.vue'
import CartSummary from '~/components/cart/Summary.vue'
import { useCart } from '~/composables/useCart'
import { useProducts } from '~/composables/useProducts'

const { data: products } = await useProducts()
const { lines } = useCart()
</script>

<template>
  <div>
    <h1>Cart</h1>
    <ul v-if="lines.length">
      <CartItem
        v-for="line in lines"
        :key="line.slug"
        :line="line"
        :product="products.find(p => p.slug === line.slug)"
      />
    </ul>
    <p v-else id="cart-empty">
      Your cart is empty.
    </p>
    <CartSummary />
    <NuxtLink to="/checkout">
      Checkout
    </NuxtLink>
  </div>
</template>
