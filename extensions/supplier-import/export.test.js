import { describe, expect, it } from 'vitest'
import { createGroupJson, maxGroupProducts } from './export.js'
import { parseProductImport } from '../../src/models/productGroupImport'
import { messages } from './messages.js'
import manifest from './manifest.json'

describe('supplier extension export', () => {
  it('exports only selected references in a format accepted by the product group importer', () => {
    const products = [
      { key: 'STARTEC:INF211208', producer: 'STARTEC', sku: 'INF211208', name: 'Фитинг М12\\', sections: ['results'] },
      { key: 'OTHER:ABC', producer: 'OTHER', sku: 'ABC', name: 'Other', sections: ['replacements'] },
    ]
    const json = createGroupJson(products, new Set([products[0].key]))
    expect(JSON.parse(json)).toEqual({ supplier: 'Armtek', products: [{ producer: 'STARTEC', sku: 'INF211208', name: 'Фитинг М12\\' }] })
    const parsed = parseProductImport(json)
    expect(parsed[0].supplier).toBe('Armtek')
    expect(parsed[0].rows[0].name).toBe('Фитинг М12\\')
    expect(parsed[0].rows).toHaveLength(1)
  })
  it('requires a non-empty selection and honors the importer group limit', () => {
    const products = Array.from({ length: maxGroupProducts + 1 }, (_, index) => ({ key: String(index), producer: 'MAN', sku: `SKU${index}`, name: 'Part' }))
    expect(() => createGroupJson(products, new Set())).toThrow('selection')
    expect(() => createGroupJson(products, new Set(products.map(row => row.key)))).toThrow('limit')
    expect(parseProductImport(createGroupJson(products, new Set(products.slice(0, maxGroupProducts).map(row => row.key))))[0].rows).toHaveLength(1000)
  })
  it('ships matching translations without permanent site access or backend integration permissions', () => {
    for (const locale of ['en', 'tr']) expect(Object.keys(messages[locale]).sort()).toEqual(Object.keys(messages.ru).sort())
    expect(manifest.permissions).toEqual(['activeTab', 'scripting', 'clipboardWrite'])
    expect(manifest.host_permissions).toBeUndefined()
    expect(manifest.content_scripts).toBeUndefined()
    expect(manifest.background).toBeUndefined()
  })
})
