import { beforeEach, describe, expect, it, vi } from 'vitest'
import { print } from 'graphql'
import { graphqlClient } from '@/services/graphql/client'
import { ApiError } from '@/models/errorModel'
import { deleteProduct, getProductById } from './products'

vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
vi.mock('./api', () => ({ default: {}, clampPageSize: (size: number) => Math.min(100, Math.max(1, size)) }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: {
  query: vi.fn(), mutate: vi.fn(), cache: { identify: vi.fn(() => 'Product:{"id":4}'), evict: vi.fn(), gc: vi.fn() },
} }))
beforeEach(() => vi.clearAllMocks())

describe('product deletion contract', () => {
  it('loads the product rowVersion from its details rather than guessing a version at deletion time', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { products: { byId: { id: 4, sku: 'A', name: 'Part', rowVersion: 17, producer: { id: 1, name: 'ACME' }, indicator: null, stock: 0, images: [] } } } } as never)
    expect((await getProductById(4)).product.rowVersion).toBe(17)
    expect(print(vi.mocked(graphqlClient.query).mock.calls[0]![0].query)).toMatch(/\browVersion\b/)
  })

  it('sends the displayed version and evicts only the deleted product after confirmed success', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { products: { delete: true } } } as never)
    await deleteProduct(4, 0)
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables).toEqual({ input: { productId: 4, rowVersion: 0 } })
    expect(graphqlClient.cache.identify).toHaveBeenCalledWith({ __typename: 'Product', id: 4 })
    expect(graphqlClient.cache.evict).toHaveBeenCalledWith({ id: 'Product:{"id":4}' })
    expect(graphqlClient.cache.gc).toHaveBeenCalledOnce()
  })

  it('preserves localized stock, relation and version conflict messages without evicting the product', async () => {
    vi.mocked(graphqlClient.mutate).mockRejectedValue({ graphQLErrors: [{ message: 'Товар нельзя удалить: есть продажи.', extensions: { status: 409 } }] })
    const result = deleteProduct(4, 17)
    await expect(result).rejects.toBeInstanceOf(ApiError)
    await expect(result).rejects.toMatchObject({ status: 409, message: 'Товар нельзя удалить: есть продажи.' })
    expect(graphqlClient.cache.evict).not.toHaveBeenCalled()
  })

  it('does not treat an unconfirmed deletion as success', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { products: { delete: false } } } as never)
    await expect(deleteProduct(4, 17)).rejects.toThrow()
    expect(graphqlClient.cache.evict).not.toHaveBeenCalled()
  })
})
