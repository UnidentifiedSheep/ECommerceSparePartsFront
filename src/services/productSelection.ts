import type { ProductSearchModel } from '@/models/productSearchModel'
import { getProductsAvailableStock } from '@/services/api/products'

export async function loadSelectionStock(products: ProductSearchModel[], storageCode?: string): Promise<ProductSearchModel[]> {
  if (!storageCode || products.length === 0) return products
  const stocks = await getProductsAvailableStock(products.map(product => product.id), storageCode)
  return products.map(product => ({ ...product, availableStock: stocks.get(product.id) ?? 0 }))
}
