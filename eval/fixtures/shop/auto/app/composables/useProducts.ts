import type { Product } from '#shared/types/product'

/** All products. Cached under the `products` key, so `useNuxtData('products')` reads them too. */
export function useProducts() {
  return useFetch<Product[]>('/api/products', { key: 'products', default: () => [] })
}
