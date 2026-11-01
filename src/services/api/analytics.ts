import { normalizeObjectSchema, type ObjectSchema } from '@/models/schemaModel'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { AvailableChartsDocument, SalesProfitChartDocument } from '@/graphql/generated/graphql'
import { getGraphqlErrors } from '@/services/graphql/auth'
import { t } from '@/i18n'

export interface ChartModel {
  systemName: string
  name: string
  description: string
  queryInputSchema: ObjectSchema
  dataPointSchema: ObjectSchema
}
export interface GetChartsResponse { charts: ChartModel[] }
export type ChartGranularity = 'Day' | 'Month' | 'Year'
export interface SalesProfitChartQueryInput {
  organizationId?: string | null
  buyerId?: string | null
  startDate: string
  endDate: string
  granularity: ChartGranularity
  cursor?: string | null
  size: number
}
export interface SalesProfitDataPoint {
  periodStart: string
  revenue: number
  cost: number
  grossProfit: number
  salesCount: number
  productsCount: number
  margin: number
}
export interface QuerySalesProfitChartResponse { dataPoints: SalesProfitDataPoint[]; nextCursor: string | null }

export async function getCharts(signal?: AbortSignal): Promise<GetChartsResponse> {
  const { data } = await operationRequest(graphqlClient.query({
    query: AvailableChartsDocument, fetchPolicy: 'no-cache', context: { fetchOptions: { signal } },
  }))
  return { charts: data.analytics.charts.map(chart => ({ ...chart,
    queryInputSchema: normalizeObjectSchema(chart.queryInputSchema),
    dataPointSchema: normalizeObjectSchema(chart.dataPointSchema),
  })) }
}
export async function querySalesProfitChart(queryInput: SalesProfitChartQueryInput, signal?: AbortSignal): Promise<QuerySalesProfitChartResponse> {
  const { data } = await operationRequest(graphqlClient.query({
    query: SalesProfitChartDocument,
    variables: { systemName: 'SalesProfitOverTimeChartDataSource', queryInput },
    fetchPolicy: 'no-cache', context: { fetchOptions: { signal } },
  })).catch((error: unknown) => {
    const messages = [error instanceof Error ? error.message : '', ...getGraphqlErrors(error).map(item => item.message)]
    if (messages.some(message => /missing analytics|restore historical analytics/i.test(message))) throw new Error(t('home.analyticsNotReady'))
    throw error
  })
  if (!data.analytics.chart) return { dataPoints: [], nextCursor: null }
  const result = data.analytics.chart.data
  // Chart points are an Any scalar: check their shape before rendering numbers.
  const dataPoints = result.dataPoints.map(point => {
    if (!point || typeof point !== 'object' || Array.isArray(point)) throw new Error(t('home.loadError'))
    const row = point as Record<string, unknown>
    if (typeof row.periodStart !== 'string' || !Number.isFinite(Date.parse(row.periodStart))
      || ['revenue', 'cost', 'grossProfit', 'salesCount', 'productsCount', 'margin'].some(key => typeof row[key] !== 'number' || !Number.isFinite(row[key]))) throw new Error(t('home.loadError'))
    return row as unknown as SalesProfitDataPoint
  })
  return { dataPoints, nextCursor: result.nextCursor ?? null }
}
