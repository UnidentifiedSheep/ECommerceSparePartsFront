import { describe, expect, it } from 'vitest'
import { createGroupJson, createPurchaseJson, maxGroupProducts } from './export.js'
import { parsePurchaseImport } from '../../src/models/purchaseJsonImport'
import { parseProductImport } from '../../src/models/productGroupImport'
import { messages } from './messages.js'
import manifest from './manifest.json'
import { getSupplierAdapter } from './suppliers.js'

describe('supplier extension export', () => {
  it('exports independent invoice positions as a purchase and prevents using cross-group import', () => {
    const invoice = { mode: 'purchase', supplier: 'Armtek', currency: 'RUB', partial: false, products: [
      { key: 'invoice:0', sku: 'SR1035', producer: 'ZEKKERT', name: 'Bearing\\', count: 1, price: 651, returnedCount: 0 },
      { key: 'invoice:1', sku: 'SR1035', producer: 'ZEKKERT', name: 'Roller', count: 2, price: 650, returnedCount: 1 },
    ] }
    const selected = new Set(invoice.products.map(row => row.key))
    const json = createPurchaseJson(invoice, selected)
    expect(parsePurchaseImport(json).group.rows.map(row => [row.sku, row.count, row.price, row.returnedCount])).toEqual([['SR1035', 1, 651, 0], ['SR1035', 2, 650, 1]])
    expect(() => createGroupJson(invoice, selected)).toThrow('wrongMode')
    expect(() => parseProductImport(json)).toThrowError(expect.objectContaining({ code: 'document' }))
    expect(parsePurchaseImport(createPurchaseJson(invoice, new Set(['invoice:0']))).partial).toBe(true)
    expect(getSupplierAdapter('https://etp.armtek.ru/invoice/index/123/456')?.collect.name).toBe('collectArmtekInvoice')
  })
  it('exports only selected references in a format accepted by the product group importer', () => {
    const products = [
      { key: 'STARTEC:INF211208', producer: 'STARTEC', sku: 'INF211208', name: 'Фитинг М12\\', sections: ['results'] },
      { key: 'OTHER:ABC', producer: 'OTHER', sku: 'ABC', name: 'Other', sections: ['replacements'] },
    ]
    const json = createGroupJson({ supplier: 'Armtek', products }, new Set([products[0].key]))
    expect(JSON.parse(json)).toEqual({ supplier: 'Armtek', products: [{ producer: 'STARTEC', sku: 'INF211208', name: 'Фитинг М12\\' }] })
    const parsed = parseProductImport(json)
    expect(parsed[0].supplier).toBe('Armtek')
    expect(parsed[0].rows[0].name).toBe('Фитинг М12\\')
    expect(parsed[0].rows).toHaveLength(1)
  })
  it('requires a non-empty selection and honors the importer group limit', () => {
    const products = Array.from({ length: maxGroupProducts + 1 }, (_, index) => ({ key: String(index), producer: 'MAN', sku: `SKU${index}`, name: 'Part' }))
    const group = { supplier: 'Armtek', products }
    expect(() => createGroupJson(group, new Set())).toThrow('selection')
    expect(() => createGroupJson(group, new Set(products.map(row => row.key)))).toThrow('limit')
    expect(parseProductImport(createGroupJson(group, new Set(products.slice(0, maxGroupProducts).map(row => row.key))))[0].rows).toHaveLength(1000)
  })
  it('selects suppliers by exact HTTPS host and supported path, preserving supplier in exports', () => {
    expect(getSupplierAdapter('https://etp.armtek.ru/search/123')?.supplier).toBe('Armtek')
    expect(getSupplierAdapter('https://market.tmtr.ru/goods/A152?q=1')?.supplier).toBe('Tmtr')
    for (const address of ['https://market.tmtr.ru/cart', 'https://market.tmtr.ru/goods/', 'https://market.tmtr.ru.example.org/goods/123', 'http://market.tmtr.ru/goods/123', 'https://etp.armtek.ru.example.org', 'invalid']) {
      expect(getSupplierAdapter(address)).toBeUndefined()
    }
    const product = { key: 'MAN:ABC', producer: 'MAN', sku: 'ABC', name: 'Part' }
    const json = createGroupJson({ supplier: 'Tmtr', products: [product] }, new Set([product.key]))
    expect(parseProductImport(json)[0].supplier).toBe('Tmtr')
    expect(() => createGroupJson({ supplier: 'UNKNOWN', products: [product] }, new Set([product.key]))).toThrow('unsupported')
  })
  it('ships matching translations without permanent site access or backend integration permissions', () => {
    for (const locale of ['en', 'tr']) expect(Object.keys(messages[locale]).sort()).toEqual(Object.keys(messages.ru).sort())
    expect(manifest.permissions).toEqual(['activeTab', 'scripting', 'clipboardWrite'])
    expect(manifest.host_permissions).toBeUndefined()
    expect(manifest.content_scripts).toBeUndefined()
    expect(manifest.background).toBeUndefined()
  })
  it('supports Favorit analogues and keeps its supplier mapping compatible with import', () => {
    expect(getSupplierAdapter('https://lk.favorit-parts.ru/analogues/?id=123')?.supplier).toBe('FavoritParts')
    expect(getSupplierAdapter('https://lk.favorit-parts.ru/analogues/123')?.supplier).toBe('FavoritParts')
    for (const address of ['https://lk.favorit-parts.ru/analogues-other/', 'https://lk.favorit-parts.ru/search/', 'https://lk.favorit-parts.ru.example.org/analogues/', 'http://lk.favorit-parts.ru/analogues/']) expect(getSupplierAdapter(address)).toBeUndefined()
    const product = { key: 'MFILTER:A152', producer: 'MFILTER', sku: 'A152', name: 'Air filter' }
    expect(parseProductImport(createGroupJson({ supplier: 'FavoritParts', products: [product] }, new Set([product.key])))[0].supplier).toBe('FavoritParts')
  })
})
