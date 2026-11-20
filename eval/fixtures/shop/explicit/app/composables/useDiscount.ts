import { computed } from 'vue'
import { useCookie } from '#imports'
import { discountPercent } from '#shared/utils/discount'

/** The active discount code, read from the `discount-code` cookie. */
export function useDiscount() {
  const code = useCookie<string | null>('discount-code', { default: () => null })
  const percent = computed(() => discountPercent(code.value))
  return { code, percent }
}
