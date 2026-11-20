import { createError, defineEventHandler, getRouterParam } from 'h3'
import { findProduct } from '#server/utils/db'
import { formatMoney } from '#server/utils/money'

export default defineEventHandler((event) => {
  const product = findProduct(getRouterParam(event, 'slug') ?? '')
  if (!product)
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  return { ...product, price: formatMoney(product.priceCents) }
})
