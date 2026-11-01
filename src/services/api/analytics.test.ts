import { beforeEach, describe, expect, it, vi } from 'vitest'
import { print } from 'graphql'
import { graphqlClient } from '@/services/graphql/client'
import { getCharts, querySalesProfitChart } from './analytics'

vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn() } }))
vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
beforeEach(() => vi.resetAllMocks())
const input = { startDate: '2026-11-01T00:00:00Z', endDate: '2026-11-01T23:59:59Z', granularity: 'Day' as const, size: 100 }

describe('Main GraphQL analytics', () => {
  it('normalizes GraphQL schema enums and preserves field dependencies', async () => {
    const schema = { version: 1, fields: [{ name: 'organizationId', type: 'STRING', required: false, control: 'ENTITY_SELECTOR', accepts: [], dependency: { entityName: 'Organization', fieldName: 'id' } }] }
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { analytics: { charts: [{ systemName: 'SalesProfitOverTimeChartDataSource', name: 'Profit', description: '', queryInputSchema: schema, dataPointSchema: { version: 1, fields: [] } }] } } } as never)
    const result = await getCharts()
    expect(result.charts[0]!.queryInputSchema.fields[0]).toMatchObject({ type: 'String', control: 'EntitySelector', dependency: { entityName: 'Organization', fieldName: 'id' } })
    expect(print(vi.mocked(graphqlClient.query).mock.calls[0]![0].query)).toContain('analytics')
  })
  it('keeps filters, UTC boundaries, cursor and cancellation when loading points', async () => {
    const point = { periodStart: '2026-11-01T00:00:00Z', revenue: 90, cost: 50, grossProfit: 40, margin: 40 / 90, salesCount: 1, productsCount: 2 }
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { analytics: { chart: { data: { dataPoints: [point], nextCursor: '2026-11-02T00:00:00Z' } } } } } as never)
    const controller = new AbortController()
    const filters = { ...input, organizationId: 'org-1', buyerId: 'user-1', cursor: '2026-11-01T00:00:00Z' }
    expect(await querySalesProfitChart(filters, controller.signal)).toEqual({ dataPoints: [point], nextCursor: '2026-11-02T00:00:00Z' })
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0]).toMatchObject({ variables: { queryInput: filters }, context: { fetchOptions: { signal: controller.signal } }, fetchPolicy: 'no-cache' })
  })
  it('refuses malformed scalar points instead of rendering misleading totals', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { analytics: { chart: { data: { dataPoints: [{ periodStart: 'bad', revenue: '90' }], nextCursor: null } } } } } as never)
    await expect(querySalesProfitChart(input)).rejects.toThrow('home.loadError')
  })
  it('explains missing historical analytics without treating it as an empty report', async () => {
    vi.mocked(graphqlClient.query).mockRejectedValue({ graphQLErrors: [{ message: 'Sales contain missing analytics. Restore historical analytics before querying reports.' }] })
    await expect(querySalesProfitChart(input)).rejects.toThrow('home.analyticsNotReady')
  })
})
