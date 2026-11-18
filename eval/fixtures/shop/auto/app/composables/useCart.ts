import type { CartLine } from '#shared/types/cart'

/** The cart, persisted in the `cart` cookie. Overrides the base layer's legacy `useCart`. */
export function useCart() {
  const lines = useCookie<CartLine[]>('cart', { default: () => [] })
  const count = computed(() => sumBy(lines.value, line => line.qty))
  function add(slug: string, qty = 1) {
    const existing = lines.value.find(line => line.slug === slug)
    lines.value = existing
      ? lines.value.map(line => (line.slug === slug ? { ...line, qty: line.qty + qty } : line))
      : [...lines.value, { slug, qty }]
  }
  function remove(slug: string) {
    lines.value = lines.value.filter(line => line.slug !== slug)
  }
  return { lines, count, add, remove }
}
