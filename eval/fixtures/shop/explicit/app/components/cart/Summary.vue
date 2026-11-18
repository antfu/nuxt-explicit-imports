<script setup lang="ts">
import { useCartTotal } from '~/composables/useCartTotal'
import { formatMoney } from '~/utils/money'
import { formatDiscount } from '~/utils/discount'

const { subtotal, total, percent } = useCartTotal()
</script>

<template>
  <section id="cart-summary">
    <p>Subtotal: <span id="cart-subtotal">{{ formatMoney(subtotal) }}</span></p>
    <p v-if="percent">
      Discount: {{ formatDiscount(subtotal - total) }}
    </p>
    <p>Total: <span id="cart-total">{{ formatMoney(total) }}</span></p>
  </section>
</template>
