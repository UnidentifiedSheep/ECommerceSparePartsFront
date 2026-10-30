import type { Supplier } from '@/models/producerModel'

export const importLimits = { groups: 100, perGroup: 1000, total: 5000, text: 2_000_000 }
export type ImportIssueCode = 'json' | 'shape' | 'textLimit' | 'groupsLimit' | 'productsLimit' | 'supplier' | 'row' | 'sku' | 'name' | 'producer' | 'resolve' | 'permissions'
export class ProductImportIssue extends Error {
  constructor(public code: ImportIssueCode, public params: Record<string, string | number> = {}) { super(code) }
}

export interface ProductImportRow {
  key: string
  sku: string
  producer: string
  name: string
  producerId?: number
  producerLabel?: string
  manualProducerId?: number
  productId?: number
  productName?: string
  created?: boolean
}
export interface ProductImportGroup {
  supplier: Supplier | null
  rows: ProductImportRow[]
  duplicates: number
  done: boolean
  error: string
}

export function normalizedImportSku(sku: string) { return sku.replace(/[^a-zA-Z0-9а-яА-Я]/g, '').toUpperCase() }
export function importProductKey(row: ProductImportRow) { return `${row.producerId}:${normalizedImportSku(row.sku)}` }

function object(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) }

export function parseProductImport(text: string): ProductImportGroup[] {
  if (text.length > importLimits.text) throw new ProductImportIssue('textLimit')
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new ProductImportIssue('json') }
  const groups = Array.isArray(parsed) ? parsed : [parsed]
  if (!groups.length) throw new ProductImportIssue('shape')
  if (groups.length > importLimits.groups) throw new ProductImportIssue('groupsLimit', { count: importLimits.groups })
  let total = 0
  return groups.map((group, index) => {
    const groupNumber = index + 1
    if (!object(group) || !Array.isArray(group.products) || !group.products.length) throw new ProductImportIssue('shape', { group: groupNumber })
    total += group.products.length
    if (group.products.length > importLimits.perGroup || total > importLimits.total) throw new ProductImportIssue('productsLimit', { count: group.products.length > importLimits.perGroup ? importLimits.perGroup : importLimits.total })
    let supplier: Supplier | null = null
    if (group.supplier != null && group.supplier !== '') {
      if (typeof group.supplier !== 'string') throw new ProductImportIssue('supplier', { group: groupNumber })
      const suppliers = new Map<string, Supplier>([['armtek', 'Armtek'], ['favoritparts', 'FavoritParts'], ['tmtr', 'Tmtr']])
      supplier = suppliers.get(group.supplier.replace(/[_\s-]/g, '').toLowerCase()) ?? null
      if (!supplier) throw new ProductImportIssue('supplier', { group: groupNumber })
    }
    const seen = new Map<string, ProductImportRow>()
    let duplicates = 0
    group.products.forEach((value, rowIndex) => {
      const position = { group: groupNumber, row: rowIndex + 1 }
      if (!object(value) || typeof value.producer !== 'string' || !value.producer.trim()) throw new ProductImportIssue('row', position)
      if (typeof value.sku !== 'string' || value.sku.trim().length < 3 || value.sku.trim().length > 128 || !normalizedImportSku(value.sku)) throw new ProductImportIssue('sku', position)
      if (value.name != null && typeof value.name !== 'string') throw new ProductImportIssue('name', position)
      const name = typeof value.name === 'string' ? value.name.trim() : ''
      if (name.length > 255) throw new ProductImportIssue('name', position)
      const row: ProductImportRow = { key: `${index}:${rowIndex}`, sku: value.sku.trim(), producer: value.producer.trim(), name }
      const key = `${row.producer.toUpperCase()}:${normalizedImportSku(row.sku)}`
      const existing = seen.get(key)
      if (existing) { duplicates++; if (!existing.name) existing.name = row.name }
      else seen.set(key, row)
    })
    return { supplier, rows: [...seen.values()], duplicates, done: false, error: '' }
  })
}

export function fullGroupLinkages(rows: ProductImportRow[]) {
  const ids = [...new Set(rows.map(row => row.productId).filter((id): id is number => id !== undefined))]
  const productId = ids[0]
  return productId === undefined ? [] : ids.slice(1).map(crossProductId => ({ productId, crossProductId, linkageType: 'FullCross' as const }))
}
