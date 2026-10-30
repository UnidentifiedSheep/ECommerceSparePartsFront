import { supplierAdapters } from './suppliers.js'

export const maxGroupProducts = 1000

export function createGroupJson({ supplier, products }, selected) {
  if (!supplierAdapters.some(adapter => adapter.supplier === supplier)) throw new Error('unsupported')
  const chosen = products.filter(product => selected.has(product.key))
  if (!chosen.length) throw new Error('selection')
  if (chosen.length > maxGroupProducts) throw new Error('limit')
  return JSON.stringify({ supplier, products: chosen.map(({ producer, sku, name }) => ({ producer, sku, name })) }, null, 2)
}
