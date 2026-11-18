import { beforeEach, describe, expect, it, vi } from 'vitest'
import { print } from 'graphql'
import { graphqlClient } from '@/services/graphql/client'
import { getCharts, querySalesProfitChart, getAnalyticsRuns, getAnalyses, getAbcXyzItems, getSchemaAnalysisItems, setAnalyticsRunPinned, getAnalysisDefinition } from './analytics'

vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
beforeEach(() => vi.resetAllMocks())
const input = { startDate: '2026-11-01T00:00:00Z', endDate: '2026-11-01T23:59:59Z', granularity: 'Day' as const, size: 100 }

describe('Main GraphQL analytics', () => {
  it('pins or unpins the selected run by its ID and uses the server state', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { analytics: { setRunPinned: { id: 'run-1', isPinned: false } } } } as never)
    expect(await setAnalyticsRunPinned('run-1', false)).toEqual({ id: 'run-1', isPinned: false })
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]?.[0].variables).toEqual({ runId: 'run-1', isPinned: false })
    vi.mocked(graphqlClient.mutate).mockRejectedValueOnce(new Error('denied'))
    await expect(setAnalyticsRunPinned('run-1', true)).rejects.toThrow('denied')
  })
  it('normalizes all result schemas including nested group summaries for a new analysis', async () => {
    const schema = { version: 1, fields: [] }
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { analytics: { analysis: { systemName: 'NewAnalysis', name: 'New analysis', description: '', lrtSystemName: 'NewLrt', itemsChartSystemName: 'NewItems', schemaVersion: 1, parametersSchema: schema, summarySchema: { version: 1, fields: [{ name: 'groups', type: 'ARRAY', required: true, accepts: [], nestedSchema: { version: 1, fields: [{ name: 'value', type: 'NUMBER', required: true, accepts: [] }] } }] }, segmentsSchema: schema, dataSchema: schema } } } } as never)
    const result = await getAnalysisDefinition('NewAnalysis')
    expect(result?.summarySchema.fields[0]?.type).toBe('Array')
    expect(result?.summarySchema.fields[0]?.nestedSchema?.fields[0]?.type).toBe('Number')
    expect(result?.itemsChartSystemName).toBe('NewItems')
  })
  it('converts rank cursors back to numbers and keeps Unclassified distinct from Z', async () => {
    const point = { productId: 1, rank: 40, value: 10, share: 0.1, cumulativeShare: 1, abc: 'B', quantity: 1, revenue: 10, periodsCount: 1 }
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { analytics: { chart: { data: { points: [{ value: point, references: [] }], nextCursor: '40' } } } } } as never)
    expect((await getAbcXyzItems('Items', { runId: 'run-1', xyz: 'Unclassified', cursor: 20, size: 40 })).nextCursor).toBe(40)
    expect(vi.mocked(graphqlClient.query).mock.calls[0]?.[0].variables).toEqual({ systemName: 'Items', queryInput: { runId: 'run-1', xyz: 'Unclassified', cursor: 20, size: 40 }, products: false, organizations: false, users: false })
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { analytics: { chart: { data: { points: [], nextCursor: 'bad' } } } } } as never)
    await expect(getAbcXyzItems('Items', { runId: 'run-1', size: 40 })).rejects.toThrow()
  })
  it('gets linked products with the page in one request', async () => {
    const point = { productId: 7, rank: 1, value: 10, share: 1, cumulativeShare: 1, abc: 'A', quantity: 1, revenue: 10, periodsCount: 2 }
    const target = { __typename: 'Product', productId: 7, sku: 'SKU', name: 'Filter', producer: { name: 'MAN' } }
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { analytics: { chart: { data: { points: [{ value: point, references: [{ field: 'productId', entity: 'Product', target }] }], nextCursor: null } } } } } as never)
    const result = await getAbcXyzItems('Items', { runId: 'run-1', size: 40 }, undefined, true)
    expect(result.products).toEqual([{ id: 7, sku: 'SKU', name: 'Filter', producer: { name: 'MAN' } }])
    expect(graphqlClient.query).toHaveBeenCalledTimes(1)
  })
  it('retries without entity details only when references fail, preserving the rows', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: null, errors: [{ message: 'Deleted product', path: ['analytics', 'chart', 'data', 'points', 0, 'references', 0, 'target', 'name'] }] } as never)
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { analytics: { chart: { data: { points: [{ value: { subject: 7 }, references: [] }], nextCursor: null } } } } } as never)
    const result = await getSchemaAnalysisItems('Items', { runId: 'run-1' }, undefined, { products: true })
    expect(result.referencesUnavailable).toBe(true)
    expect(result.points[0]?.value).toEqual({ subject: 7 })
    expect(vi.mocked(graphqlClient.query).mock.calls[1]?.[0].variables).toMatchObject({ products: false, organizations: false, users: false })
  })
  it('does not mask general GraphQL errors as missing entity names', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: null, errors: [{ message: 'Invalid filter', path: ['analytics', 'chart', 'data'] }] } as never)
    await expect(getSchemaAnalysisItems('Items', {}, undefined, { products: true })).rejects.toMatchObject({ graphQLErrors: [{ message: 'Invalid filter' }] })
    expect(graphqlClient.query).toHaveBeenCalledTimes(1)
  })
  it('reads analysis labels without loading schemas or result details', async () => {
    const definitions = [{ systemName: 'AbcXyz', name: 'ABC/XYZ', description: 'Analysis' }]
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { analytics: { analyses: definitions } } } as never)
    expect(await getAnalyses()).toEqual(definitions)
    const document = print(vi.mocked(graphqlClient.query).mock.calls[0]![0].query)
    expect(document).not.toContain('parametersSchema')
  })
  it('sends false pin filters and exact cursor timestamps without loading item or summary payloads', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { analytics: { runs: [] } } } as never)
    const filters = { isPinned: false, analysisType: 'AbcXyz', periodFrom: '2026-01-01T00:00:00.000Z', periodTo: '2026-12-01T00:00:00.000Z' }
    const cursor = { id: 'run-1', createdAt: '2026-11-17T00:00:00.123456Z' }
    await getAnalyticsRuns(filters, cursor, 20)
    const query = vi.mocked(graphqlClient.query).mock.calls[0]![0]
    expect(query.variables).toEqual({ input: { ...filters, cursor: { size: 20, value: cursor } } })
    expect(print(query.query)).not.toMatch(/\b(summary|parameters)\b/)
  })
  it('normalizes GraphQL schema enums and preserves field dependencies', async () => {
    const schema = { version: 1, fields: [{ name: 'organizationId', type: 'STRING', required: false, control: 'ENTITY_SELECTOR', accepts: [], dependency: { entityName: 'Organization', fieldName: 'id' } }] }
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { analytics: { charts: [{ systemName: 'SalesProfitOverTimeChartDataSource', name: 'Profit', description: '', queryInputSchema: schema, dataPointSchema: { version: 1, fields: [] } }] } } } as never)
    const result = await getCharts()
    expect(result.charts[0]!.queryInputSchema.fields[0]).toMatchObject({ type: 'String', control: 'EntitySelector', dependency: { entityName: 'Organization', fieldName: 'id' } })
    expect(print(vi.mocked(graphqlClient.query).mock.calls[0]![0].query)).toContain('analytics')
  })
  it('keeps filters, UTC boundaries, cursor and cancellation when loading points', async () => {
    const point = { periodStart: '2026-11-01T00:00:00Z', revenue: 90, cost: 50, grossProfit: 40, margin: 40 / 90, salesCount: 1, productsCount: 2 }
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { analytics: { chart: { data: { points: [{ value: point }], nextCursor: '2026-11-02T00:00:00Z' } } } } } as never)
    const controller = new AbortController()
    const filters = { ...input, organizationId: 'org-1', buyerId: 'user-1', cursor: '2026-11-01T00:00:00Z' }
    expect(await querySalesProfitChart(filters, controller.signal)).toEqual({ dataPoints: [point], nextCursor: '2026-11-02T00:00:00Z' })
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0]).toMatchObject({ variables: { queryInput: filters }, context: { fetchOptions: { signal: controller.signal } }, fetchPolicy: 'no-cache' })
  })
  it('refuses malformed scalar points instead of rendering misleading totals', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { analytics: { chart: { data: { points: [{ value: { periodStart: 'bad', revenue: '90' } }], nextCursor: null } } } } } as never)
    await expect(querySalesProfitChart(input)).rejects.toThrow('home.loadError')
  })
  it('explains missing historical analytics without treating it as an empty report', async () => {
    vi.mocked(graphqlClient.query).mockRejectedValue({ graphQLErrors: [{ message: 'Sales contain missing analytics. Restore historical analytics before querying reports.' }] })
    await expect(querySalesProfitChart(input)).rejects.toThrow('home.analyticsNotReady')
  })
})
