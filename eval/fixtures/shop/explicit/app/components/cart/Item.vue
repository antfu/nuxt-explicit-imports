<script setup lang="ts">
import type { CartLine } from '#shared/types/cart'
import type { Product } from '#shared/types/product'
import UiButton from '#layers/ui/app/components/UiButton.vue'
import { useCart } from '~/composables/useCart'
import { computed } from 'vue'
import { formatMoney } from '~/utils/money'

const props = defineProps<{ line: CartLine, product?: Product }>()
const { remove } = useCart()
const lineTotal = computed(() => formatMoney((props.product?.priceCents ?? 0) * props.line.qty))
</script>

<template>
  <li class="cart-item">
    <span class="name">{{ product?.name ?? line.slug }}</span>
    <span class="qty">x{{ line.qty }}</span>
    <span class="line-total">{{ lineTotal }}</span>
    <UiButton @click="remove(line.slug)">
      Remove
    </UiButton>
  </li>
</template>
