<script setup lang="ts">
import FormInput from '#layers/ui/app/components/form/Input.vue'
import CartSummary from '~/components/cart/Summary.vue'
import UiBadge from '#layers/ui/app/components/UiBadge.vue'
import UiButton from '#layers/ui/app/components/UiButton.vue'
import { definePageMeta } from '#app/composables/pages'
import { useProducts } from '~/composables/useProducts'
import { ref } from 'vue'
import { useNotify } from '#layers/base/app/composables/useNotify'

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
