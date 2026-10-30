import { describe, expect, it, vi } from 'vitest'
import { graphqlClient } from '@/services/graphql/client'
import { resolveImportReferences } from './productImport'
vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn() } }))

describe('product resolve API', () => {
  it('maps supplier enum values and requests the producer even when no product exists', async () => {
    const result = { sku: 'ABC', producerName: 'MAN', supplier: 'ARMTEK', productId: null, producer: { id: 7, name: 'MAN' }, product: null }
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { products: { resolve: [result] } } } as never)
    expect(await resolveImportReferences([
      { sku: 'ABC', producerName: 'MAN', supplier: 'Armtek' },
      { sku: 'DEF', producerName: 'MAN', supplier: 'FavoritParts' },
      { sku: 'GHI', producerName: 'MAN', supplier: 'Tmtr' },
      { sku: 'JKL', producerName: 'MAN', supplier: null },
    ])).toEqual([result])
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables!.references).toEqual([
      { sku: 'ABC', producerName: 'MAN', supplier: 'ARMTEK' },
      { sku: 'DEF', producerName: 'MAN', supplier: 'FAVORIT_PARTS' },
      { sku: 'GHI', producerName: 'MAN', supplier: 'TMTR' },
      { sku: 'JKL', producerName: 'MAN', supplier: null },
    ])
  })
})
