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

  it('imports a legacy product array as one supplier-free group and preserves names', () => {
    const name = 'штуцер прямой! под трубку 8 мм М12х1.5\\'
    const groups = parseProductImport(JSON.stringify([
      { name: 'Фитинг м12х1,5 D=8х1', producer: 'STARTEC', uniValue: 'INF211208' },
      { name, producer: 'STELLOX', uniValue: '8521306SX' },
      { name, producer: 'stellox', uniValue: '852-1306 SX' },
    ]))
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ supplier: null, duplicates: 1, rows: [
      { sku: 'INF211208', producer: 'STARTEC', name: 'Фитинг м12х1,5 D=8х1' },
      { sku: '8521306SX', producer: 'STELLOX', name },
    ] })
  })

  it('supports sku and uniValue together while preferring an explicitly supplied sku', () => {
    const groups = parseProductImport(JSON.stringify({ products: [
      product('FIRST'), { producer: 'MAN', uniValue: 'SECOND' }, { ...product('THIRD'), uniValue: 'IGNORED' },
    ] }))
    expect(groups[0]!.rows.map(row => row.sku)).toEqual(['FIRST', 'SECOND', 'THIRD'])
    expect(() => parseProductImport(JSON.stringify([{ producer: 'MAN', sku: '', uniValue: 'VALID' }]))).toThrow(ProductImportIssue)
  })

  it('applies product limits rather than group limits to legacy arrays', () => {
    const products = Array.from({ length: importLimits.perGroup }, (_, index) => ({ producer: 'MAN', uniValue: `SKU${index}` }))
    expect(parseProductImport(JSON.stringify(products))[0]!.rows).toHaveLength(importLimits.perGroup)
    expect(() => parseProductImport(JSON.stringify([...products, products[0]]))).toThrowError(expect.objectContaining({ code: 'productsLimit' }))
  })

  it.each([
    { values: [{ producer: 'MAN', uniValue: 123 }] },
    { values: [{ producer: 'MAN', uniValue: '---' }] },
    { values: [product(), { products: [product()] }] },
  ])('rejects invalid legacy rows and mixed group/product arrays: $values', ({ values }) => {
    expect(() => parseProductImport(JSON.stringify(values))).toThrow(ProductImportIssue)
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
