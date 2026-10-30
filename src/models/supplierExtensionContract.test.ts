import { describe, expect, it } from 'vitest'
import { parseProductImport } from './productGroupImport'
import { parsePurchaseImport } from './purchaseJsonImport'
import group from './fixtures/supplier-group.json'
import purchase from './fixtures/supplier-purchase.json'

// Public interchange examples are also tested by ecommerce-extensions.
// Keep this consumer check independent of the extension source/build.
describe('supplier extension JSON contract', () => {
  it('accepts the modern group format', () => {
    const parsed = parseProductImport(JSON.stringify(group))
    expect(parsed[0]!.supplier).toBe('Armtek')
    expect(parsed[0]!.rows[0]).toMatchObject({ producer: 'MAN', sku: '9048305903', name: 'Part' })
  })
  it('preserves duplicate purchase positions and rejects them as a cross group', () => {
    const text = JSON.stringify(purchase)
    expect(parsePurchaseImport(text).group.rows.map(row => [row.sku, row.count, row.price, row.returnedCount]))
      .toEqual([['SR1035', 1, 651, 0], ['SR1035', 2, 650, 1]])
    expect(() => parseProductImport(text)).toThrowError(expect.objectContaining({ code: 'document' }))
  })
})
