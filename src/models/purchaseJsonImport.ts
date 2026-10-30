import { importLimits, normalizedImportSku, type ProductImportGroup, type ProductImportRow } from '@/models/productGroupImport'
import type { Supplier } from '@/models/producerModel'
import type { CurrencyModel } from '@/models/currencyModel'
import { importQuantity, importPriceCents } from '@/utils/importNumbers'

export const purchaseImportLimits = { rows: importLimits.perGroup, text: importLimits.text }
export class PurchaseImportIssue extends Error {
  constructor(public code: 'json' | 'shape' | 'limit' | 'reference' | 'count' | 'price' | 'currency', public row = 0) { super(code) }
}
export interface PurchaseImportRow extends ProductImportRow { count: number; price: number; returnedCount: number }
export interface PurchaseImportData { group: Omit<ProductImportGroup, 'rows'> & { rows: PurchaseImportRow[] }; currency: string | null; partial: boolean }
function object(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) }
export function parsePurchaseImport(text: string): PurchaseImportData {
  if (text.length > purchaseImportLimits.text) throw new PurchaseImportIssue('limit')
  let data: unknown
  try { data = JSON.parse(text) } catch { throw new PurchaseImportIssue('json') }
  const suppliers: Supplier[] = ['Armtek', 'Tmtr', 'FavoritParts']
  if (!object(data) || data.type !== 'purchase' || typeof data.supplier !== 'string' || !suppliers.includes(data.supplier as Supplier)
    || !Array.isArray(data.products) || !data.products.length || data.partial != null && typeof data.partial !== 'boolean') throw new PurchaseImportIssue('shape')
  if (data.products.length > purchaseImportLimits.rows) throw new PurchaseImportIssue('limit')
  if (data.currency != null && (typeof data.currency !== 'string' || !/^[A-Z]{3}$/.test(data.currency))) throw new PurchaseImportIssue('currency')
  let totalCents = 0
  const rows = data.products.map((value, index): PurchaseImportRow => {
    const row = index + 1
    if (!object(value) || typeof value.sku !== 'string' || value.sku.trim().length < 3 || value.sku.trim().length > 128 || !normalizedImportSku(value.sku)
      || typeof value.producer !== 'string' || !value.producer.trim() || value.name != null && typeof value.name !== 'string') throw new PurchaseImportIssue('reference', row)
    const count = importQuantity(value.count), cents = importPriceCents(value.price, true), returnedCount = importQuantity(value.returnedCount ?? 0, true)
    if (count === undefined || returnedCount === undefined || returnedCount > count) throw new PurchaseImportIssue('count', row)
    if (cents === undefined) throw new PurchaseImportIssue('price', row)
    totalCents += cents * count
    if (!Number.isSafeInteger(totalCents)) throw new PurchaseImportIssue('price', row)
    const name = typeof value.name === 'string' ? value.name.trim() : ''
    if (name.length > 255) throw new PurchaseImportIssue('reference', row)
    return { key: `purchase:${index}`, sku: value.sku.trim(), producer: value.producer.trim(), name, count, price: cents / 100, returnedCount }
  })
  return { group: { supplier: data.supplier as Supplier, rows, duplicates: 0, done: false, error: '' }, currency: typeof data.currency === 'string' ? data.currency : null, partial: data.partial === true }
}
export function purchaseCurrencyMatches(code: string | null, currency?: CurrencyModel): boolean {
  if (!code) return true
  if (!currency) return false
  const aliases: Record<string, string[]> = { RUB: ['RUB', 'RUR', '643', '₽', 'РУБ'], USD: ['USD', '840', '$'], EUR: ['EUR', '978', '€'] }
  const identifiers = [currency.code, currency.shortName].map(value => value.replace(/[.\s]/g, '').toUpperCase())
  const allowed = aliases[code] ?? [code]
  if (identifiers.some(value => /^[A-Z]{3}$|^\d{3}$/.test(value))) return identifiers.some(value => allowed.includes(value))
  return [...identifiers, currency.currencySign].some(value => allowed.includes(value))
}
