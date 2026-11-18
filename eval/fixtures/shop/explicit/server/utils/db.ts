import type { Product } from '#shared/types/product'
import { slugify } from '#shared/utils/slug'

const products: Product[] = [
  ['Notebook', 1999],
  ['Pencil', 150],
  ['Backpack', 4500],
  ['Eraser', 99],
  ['Sticky Notes', 350],
  ['Stapler', 1250],
].map(([name, priceCents]) => ({ slug: slugify(name as string), name: name as string, priceCents: priceCents as number }))

export function listProducts(): Product[] {
  return products
}

export function findProduct(slug: string): Product | undefined {
  return products.find(p => p.slug === slug)
}
