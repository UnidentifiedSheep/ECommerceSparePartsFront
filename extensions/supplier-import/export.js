export const maxGroupProducts = 1000

export function createGroupJson(products, selected) {
  const chosen = products.filter(product => selected.has(product.key))
  if (!chosen.length) throw new Error('selection')
  if (chosen.length > maxGroupProducts) throw new Error('limit')
  return JSON.stringify({ supplier: 'Armtek', products: chosen.map(({ producer, sku, name }) => ({ producer, sku, name })) }, null, 2)
}
