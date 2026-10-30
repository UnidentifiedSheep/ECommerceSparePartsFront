import { describe, expect, it } from 'vitest'
import { fullGroupLinkages, importLimits, parseProductImport, ProductImportIssue } from './productGroupImport'

const product = (sku = 'ABC-123', producer = 'MAN', name = 'Part') => ({ sku, producer, name })
describe('product group import input', () => {
  it('accepts a single group and multiple isolated groups with optional supplier', () => {
    const one = parseProductImport(JSON.stringify({ supplier: 'ARMTEK', products: [product()] }))
    expect(one[0]).toMatchObject({ supplier: 'Armtek', done: false, rows: [{ sku: 'ABC-123', producer: 'MAN', name: 'Part' }] })
    const groups = parseProductImport(JSON.stringify([{ supplier: 'FavoritParts', products: [product()] }, { products: [product()] }]))
    expect(groups.map(group => group.supplier)).toEqual(['FavoritParts', null])
    expect(groups).toHaveLength(2)
  })

  it('deduplicates normalized references within a group, keeps names and does not mix group boundaries', () => {
    const input = { supplier: 'Armtek', products: [product(' ab-123 ', ' MAN ', ''), product('AB 123', 'man', 'Name'), product('AB 123', 'OTHER')] }
    const groups = parseProductImport(JSON.stringify([input, input]))
    expect(groups[0]!.rows).toHaveLength(2)
    expect(groups[0]!.rows[0]!.name).toBe('Name')
    expect(groups[0]!.duplicates).toBe(1)
    expect(groups[1]!.rows).toHaveLength(2)
  })

  it.each(['{', 'null', '[]', '{}', '{"products":[]}', '{"supplier":"Other","products":[{}]}'])('rejects malformed or unsupported input %s', text => {
    expect(() => parseProductImport(text)).toThrow(ProductImportIssue)
  })

  it.each([product('---'), product('12'), product('A'.repeat(129)), product('ABC', ''), product('ABC', 'MAN', 'x'.repeat(256)), { sku: 123, producer: 'MAN' }])('rejects invalid row values', value => {
    expect(() => parseProductImport(JSON.stringify({ products: [value] }))).toThrow(ProductImportIssue)
  })

  it('allows missing names for references that may resolve to existing products', () => {
    expect(parseProductImport('{"products":[{"sku":"ABC","producer":"MAN"}]}')[0]!.rows[0]!.name).toBe('')
  })

  it.each(['constructor', '__proto__'])('rejects inherited property names as suppliers: %s', supplier => {
    expect(() => parseProductImport(JSON.stringify({ supplier, products: [product()] }))).toThrow(ProductImportIssue)
  })

  it('bounds group and product counts before contacting the API', () => {
    const tooManyProducts = { products: Array.from({ length: importLimits.perGroup + 1 }, () => product()) }
    const tooManyGroups = Array.from({ length: importLimits.groups + 1 }, () => ({ products: [product()] }))
    expect(() => parseProductImport(JSON.stringify(tooManyProducts))).toThrow(ProductImportIssue)
    expect(() => parseProductImport(JSON.stringify(tooManyGroups))).toThrow(ProductImportIssue)
  })

  it('builds n−1 FullCross links and excludes duplicate product IDs and self-links', () => {
    const group = parseProductImport(JSON.stringify({ products: [product(), product('XYZ'), product('DEF'), product('GHI')] }))[0]!
    group.rows.forEach((row, index) => { row.productId = [4, 5, 4, 6][index] })
    expect(fullGroupLinkages(group.rows)).toEqual([
      { productId: 4, crossProductId: 5, linkageType: 'FullCross' },
      { productId: 4, crossProductId: 6, linkageType: 'FullCross' },
    ])
  })
})
