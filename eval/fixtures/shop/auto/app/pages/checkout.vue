<script setup lang="ts">
definePageMeta({ middleware: 'cart-not-empty' })

await useProducts()
const email = ref('')
const { notify } = useNotify()
</script>

<template>
  <div>
    <h1>Checkout</h1>
    <UiBadge class="secure">
      Secure checkout
    </UiBadge>
    <FormInput v-model="email" label="Email" />
    <CartSummary />
    <UiButton id="place-order" @click="notify(`Order placed for ${email}`)">
      Place order
    </UiButton>
  </div>
</template>
