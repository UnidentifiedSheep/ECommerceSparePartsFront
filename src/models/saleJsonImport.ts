import { normalizedImportSku } from '@/models/productGroupImport'
import type { ProductSearchModel } from '@/models/productSearchModel'
import { importQuantity, importPriceCents } from '@/utils/importNumbers'

export const saleImportLimits = { rows: 1000, text: 2_000_000 }
export class SaleImportIssue extends Error {
  constructor(public code: 'json' | 'shape' | 'limit' | 'reference' | 'count' | 'price' | 'resolve', public row = 0) { super(code) }
}
export interface SaleImportInput { sku: string; producer: string; count: number; price: number }
export interface SaleImportRow extends SaleImportInput {
  product?: ProductSearchModel
  availableStock: number
  requestedCount: number
}

export function parseSaleImport(text: string): SaleImportInput[] {
  if (text.length > saleImportLimits.text) throw new SaleImportIssue('limit')
  let data: unknown
  try { data = JSON.parse(text) } catch { throw new SaleImportIssue('json') }
  if (!Array.isArray(data) || !data.length) throw new SaleImportIssue('shape')
  if (data.length > saleImportLimits.rows) throw new SaleImportIssue('limit')
  let totalCents = 0
  return data.map((value, index) => {
    const row = index + 1
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SaleImportIssue('reference', row)
    const { uniValue, producer, count, price } = value
    if (typeof uniValue !== 'string' || uniValue.trim().length < 3 || uniValue.trim().length > 128 || !normalizedImportSku(uniValue)
      || typeof producer !== 'string' || !producer.trim()) throw new SaleImportIssue('reference', row)
    const quantity = importQuantity(count)
    if (quantity === undefined) throw new SaleImportIssue('count', row)
    const cents = importPriceCents(price)
    if (cents === undefined) throw new SaleImportIssue('price', row)
    totalCents += cents * quantity
    if (!Number.isSafeInteger(totalCents)) throw new SaleImportIssue('price', row)
    return { sku: uniValue.trim(), producer: producer.trim(), count: quantity, price: cents / 100 }
  })
}

export function saleImportStockExceeded(row: SaleImportRow) { return !!row.product && row.requestedCount > row.availableStock }
