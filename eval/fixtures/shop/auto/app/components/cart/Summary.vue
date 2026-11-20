<script setup lang="ts">
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
