import { beforeEach, describe, expect, it, vi } from 'vitest'
import { graphqlClient } from '@/services/graphql/client'
import { searchCatalogue, searchProducts, searchProductsBySku } from './search'
import { getProductCrosses } from './products'
import { emptyProductCriteria, parseProductCriteriaDraft, toProductCriteriaInput } from '@/models/productCriteriaModel'

vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
vi.mock('./api', () => ({ default: {}, clampPageSize: (size: number) => Math.min(100, Math.max(1, size)) }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
const product = { id: 1, sku: 'ABC', name: 'Part', stock: 3_000_000_000, producer: { id: 2, name: 'ACME' } }
const catalogueResponse = { data: { catalogue: { search: {
  products: { total: 1, items: [{ item: product }] }, catalogues: { total: 0, items: [] },
} } } }
const queryInput = () => {
  const calls = vi.mocked(graphqlClient.query).mock.calls
  return calls[calls.length - 1]![0].variables!.input
}

beforeEach(() => vi.resetAllMocks())

describe('warehouse stock search contracts', () => {
  it('keeps total stock sorting independent of warehouse selection and preserves Long quantities', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue(catalogueResponse as never)
    const result = await searchCatalogue({ page: 0, size: 20, sortBy: { products: ['-stock'] } })
    expect(queryInput()).toMatchObject({ stockStorageCode: null, productSortBy: [{ field: 'stock', isDescending: true }] })
    expect(result.products.items[0]?.stock).toBe(3_000_000_000)
  })

  it('passes the selected warehouse through every selector search path without filtering availability locally', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue(catalogueResponse as never)
    await searchCatalogue({ page: 1, size: 20, stockStorageCode: 'SECOND', sortBy: { products: ['stock_desc'] } })
    expect(queryInput()).toMatchObject({ stockStorageCode: 'SECOND', pagination: { page: 1, size: 20 }, productSortBy: [{ field: 'stock', isDescending: true }] })
    await searchProducts({ page: 0, size: 20, stockStorageCode: 'SECOND', sortBy: ['stock'] })
    expect(queryInput()).toMatchObject({ stockStorageCode: 'SECOND', productSortBy: [{ field: 'stock', isDescending: false }] })
    await searchProductsBySku({ sku: 'ABC', page: 0, size: 20, stockStorageCode: 'SECOND', sortBy: ['stock_desc'] })
    expect(queryInput()).toMatchObject({ stockStorageCode: 'SECOND', productSortBy: [{ field: 'stock', isDescending: true }] })
  })

  it('does not send the removed stock criterion alongside valid weight filters or legacy saved filters', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue(catalogueResponse as never)
    const draft = emptyProductCriteria()
    draft.weight.min = 2
    await searchCatalogue({ page: 0, size: 20, productCriteria: toProductCriteriaInput(draft) })
    expect(queryInput().productCriteria).toMatchObject({ weight: { range: { gte: 2 } } })
    expect(queryInput().productCriteria).not.toHaveProperty('stock')
    const legacy = parseProductCriteriaDraft(JSON.stringify({ stock: { min: 10 } }))
    await searchCatalogue({ page: 0, size: 20, productCriteria: toProductCriteriaInput(legacy) })
    expect(queryInput().productCriteria).toBeNull()
  })

  it('keeps server-side count sorting and pagination for crosses, with an optional search term', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { products: { byId: { crosses: [product] } } } } as never)
    await getProductCrosses({ productId: 1, page: 2, size: 20, sortBy: ['-count', 'id'] })
    expect(queryInput()).toEqual({ pagination: { page: 2, size: 20 }, sortBy: [{ field: 'count', isDescending: true }, { field: 'id', isDescending: false }] })
    await getProductCrosses({ productId: 1, page: 0, size: 20, searchTerm: '  ABC  ' })
    expect(queryInput()).toMatchObject({ searchTerm: 'ABC', pagination: { page: 0, size: 20 } })
  })
})
