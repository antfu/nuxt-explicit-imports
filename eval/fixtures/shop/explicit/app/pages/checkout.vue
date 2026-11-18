<script setup lang="ts">
import { ref } from 'vue'
import { definePageMeta } from '#imports'
import { useNotify } from '#layers/base/app/composables/useNotify'
import UiBadge from '#layers/ui/app/components/UiBadge.vue'
import UiButton from '#layers/ui/app/components/UiButton.vue'
import FormInput from '#layers/ui/app/components/form/Input.vue'
import CartSummary from '~/components/cart/Summary.vue'
import { useProducts } from '~/composables/useProducts'

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
