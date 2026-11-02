import { beforeEach, describe, expect, it, vi } from 'vitest'
import { print } from 'graphql'
import { graphqlClient } from '@/services/graphql/client'
import { getCurrencyHistory } from './currencies'

vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn() } }))
vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn() }, clampPageSize: (size: number) => Math.min(Math.max(size, 1), 100) }))
beforeEach(() => vi.resetAllMocks())

describe('currency history GraphQL contract', () => {
  it('keeps pagination and returns the rate and complete currency pair from the response', async () => {
    const fromCurrency = { id: 2, name: 'Dollar', shortName: 'USD', code: 'USD', currencySign: '$' }
    const toCurrency = { id: 1, name: 'Ruble', shortName: 'RUB', code: 'RUB', currencySign: '₽' }
    const history = [{ id: 7, rate: 97.12345678, createdAt: '2026-11-02T08:00:00Z', fromCurrency, toCurrency }]
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { currencies: { byId: { id: 2, history } } } } as never)
    expect(await getCurrencyHistory({ currencyId: 2, page: 3, size: 500 })).toEqual({ history })
    const call = vi.mocked(graphqlClient.query).mock.calls[0]![0]
    expect(call).toMatchObject({ variables: { id: 2, pagination: { page: 3, size: 100 } }, fetchPolicy: 'no-cache' })
    const query = print(call.query)
    expect(query).toContain('currencySign: sign')
    expect(query).not.toMatch(/prevRate|newRate/)
  })
  it('distinguishes an empty history from a missing currency', async () => {
    vi.mocked(graphqlClient.query)
      .mockResolvedValueOnce({ data: { currencies: { byId: { id: 2, history: [] } } } } as never)
      .mockResolvedValueOnce({ data: { currencies: { byId: null } } } as never)
    expect(await getCurrencyHistory({ currencyId: 2, page: 0, size: 20 })).toEqual({ history: [] })
    await expect(getCurrencyHistory({ currencyId: 9, page: 0, size: 20 })).rejects.toThrow('Currency not found')
  })
})
