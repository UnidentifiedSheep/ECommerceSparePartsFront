import { beforeEach, describe, expect, it, vi } from 'vitest'
import { graphqlClient } from '@/services/graphql/client'
import { getProductById } from './products'

vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
vi.mock('./api', () => ({ default: {}, clampPageSize: (size: number) => Math.min(100, Math.max(1, size)) }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn() } }))

beforeEach(() => {
  vi.mocked(graphqlClient.query).mockReset()
  vi.mocked(graphqlClient.query).mockResolvedValue({ data: { products: { byId: {
    id: 4, sku: 'A', name: 'Part', producer: { id: 1, name: 'ACME' }, stock: 0, crosses: [],
  } } } } as never)
})

describe('cross sorting in the initial product details request', () => {
  it('requests stock descending on the server for embedded crosses', async () => {
    await getProductById(4, false, 20, false, ['-count'])
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toMatchObject({
      includeCrosses: true,
      crossesInput: { pagination: { page: 0, size: 20 }, sortBy: [{ field: 'count', isDescending: true }] },
    })
  })

  it('preserves user sorting when a product summary refresh includes crosses', async () => {
    await getProductById(4, false, 30, false, ['sku', '-count'])
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables?.crossesInput).toMatchObject({
      sortBy: [{ field: 'sku', isDescending: false }, { field: 'count', isDescending: true }],
    })
  })
})
