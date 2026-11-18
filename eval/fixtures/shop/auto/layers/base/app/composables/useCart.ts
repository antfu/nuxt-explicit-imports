import type { CartLine } from '#shared/types/cart'

/**
 * Legacy in-memory cart, kept for older apps built on this layer.
 * Apps that persist the cart override it with their own `useCart`.
 */
export function useCart() {
  const lines = useState<CartLine[]>('legacy-cart', () => [])
  const count = computed(() => lines.value.length)
  function add(slug: string, qty = 1) {
    lines.value = [...lines.value, { slug, qty }]
  }
  function remove(slug: string) {
    lines.value = lines.value.filter(line => line.slug !== slug)
  }
  return { lines, count, add, remove }
}
