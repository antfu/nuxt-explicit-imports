import { defineEventHandler } from 'h3'
import { listProducts } from '#server/utils/db'

export default defineEventHandler(() => {
  return listProducts()
})
