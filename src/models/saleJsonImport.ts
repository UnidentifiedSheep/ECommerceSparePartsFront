import { normalizedImportSku } from '@/models/productGroupImport'
import type { ProductSearchModel } from '@/models/productSearchModel'

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
    if (!['string', 'number'].includes(typeof count) || !/^\d+$/.test(String(count).trim())) throw new SaleImportIssue('count', row)
    const quantity = Number(count)
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 2147483647) throw new SaleImportIssue('count', row)
    if (!['string', 'number'].includes(typeof price) || !/^\d+(?:[.,]\d{1,2})?$/.test(String(price).trim())) throw new SaleImportIssue('price', row)
    const [whole = '', fraction = ''] = String(price).trim().replace(',', '.').split('.')
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
    totalCents += cents * quantity
    if (!Number.isSafeInteger(cents) || cents <= 0 || !Number.isSafeInteger(totalCents)) throw new SaleImportIssue('price', row)
    return { sku: uniValue.trim(), producer: producer.trim(), count: quantity, price: cents / 100 }
  })
}

export function saleImportStockExceeded(row: SaleImportRow) { return !!row.product && row.requestedCount > row.availableStock }
