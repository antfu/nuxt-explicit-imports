import type { Product } from '#shared/types/product'
import { useCart } from '~/composables/useCart'
import { useDiscount } from '~/composables/useDiscount'
import { useNuxtData } from '#app'
import { computed } from 'vue'
import { sumBy } from '#shared/utils/math'
import { applyDiscount } from '~/utils/discount'

/** Cart totals in cents, as shown to the customer. */
export function useCartTotal() {
  const { lines } = useCart()
  const { percent } = useDiscount()
  const { data: products } = useNuxtData<Product[]>('products')
  const subtotal = computed(() => sumBy(lines.value, (line) => {
    const product = products.value?.find(p => p.slug === line.slug)
    return (product?.priceCents ?? 0) * line.qty
  }))
  const total = computed(() => applyDiscount(subtotal.value, percent.value))
  return { subtotal, total, percent }
}
