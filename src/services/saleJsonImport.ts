import { normalizedImportSku } from '@/models/productGroupImport'
import { SaleImportIssue, type SaleImportInput, type SaleImportRow } from '@/models/saleJsonImport'
import { resolveImportReferences } from '@/services/api/productImport'
import { getProductsAvailableStock } from '@/services/api/products'

export async function prepareSaleImport(input: SaleImportInput[], storageCode: string, existing: Array<{ productId: number; count: number }>): Promise<SaleImportRow[]> {
  const rows: SaleImportRow[] = []
  for (let start = 0; start < input.length; start += 100) {
    const batch = input.slice(start, start + 100)
    const resolved = await resolveImportReferences(batch.map(row => ({ sku: row.sku, producerName: row.producer, supplier: null })))
    if (resolved.length !== batch.length) throw new SaleImportIssue('resolve')
    batch.forEach((row, index) => {
      const ref = resolved[index]!
      if (ref.sku !== row.sku || ref.producerName !== row.producer) throw new SaleImportIssue('resolve', start + index + 1)
      if ((ref.productId != null && !ref.product) || (ref.product && (ref.productId !== ref.product.id || !ref.producer || normalizedImportSku(ref.product.sku) !== normalizedImportSku(row.sku)))) throw new SaleImportIssue('resolve', start + index + 1)
      rows.push({ ...row, availableStock: 0, requestedCount: 0,
        product: ref.product && ref.producer ? { id: ref.product.id, sku: ref.product.sku, name: ref.product.name, producerId: ref.producer.id, producerName: ref.producer.name, stock: 0 } : undefined,
      })
    })
  }
  const ids = [...new Set(rows.flatMap(row => row.product ? [row.product.id] : []))]
  const stocks = new Map<number, number>()
  for (let start = 0; start < ids.length; start += 100) {
    const batch = await getProductsAvailableStock(ids.slice(start, start + 100), storageCode)
    batch.forEach((stock, id) => { stocks.set(id, stock) })
  }
  const counts = new Map<number, number>()
  for (const row of existing) counts.set(row.productId, (counts.get(row.productId) ?? 0) + row.count)
  for (const row of rows) if (row.product) counts.set(row.product.id, (counts.get(row.product.id) ?? 0) + row.count)
  for (const row of rows) if (row.product) {
    row.availableStock = stocks.get(row.product.id) ?? 0
    row.requestedCount = counts.get(row.product.id) ?? row.count
    row.product.stock = row.availableStock
  }
  return rows
}
