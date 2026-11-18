import { normalizeObjectSchema, type ObjectSchema } from '@/models/schemaModel'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { AvailableChartsDocument, SalesProfitChartDocument } from '@/graphql/generated/graphql'
import { getGraphqlErrors } from '@/services/graphql/auth'
import { t } from '@/i18n'
import { AnalyticsRunsDocument, AvailableAnalysesDocument, type AnalyticsRunsQuery, type AvailableAnalysesQuery } from '@/graphql/generated/graphql'
import { clampPageSize } from './api'
import { AnalysisDefinitionDocument, AnalyticsRunDetailsDocument, AnalysisRunItemsDocument, AnalysisItemsDefinitionDocument, SetAnalyticsRunPinnedDocument, type AnalysisDefinitionQuery, type AnalyticsRunDetailsQuery, type AnalysisRunItemsQuery } from '@/graphql/generated/graphql'
import { parseAbcXyzPoint, type AbcClass, type XyzFilter } from '@/models/abcXyz'

export type AnalysisRunDetails = NonNullable<AnalyticsRunDetailsQuery['analytics']['run']>
export interface AnalysisItemProduct { id: number; sku: string; name: string; producer: { name: string } }
export interface AnalysisReferenceAccess { products?: boolean; organizations?: boolean; users?: boolean }
export type AnalysisDataPoint = NonNullable<AnalysisRunItemsQuery['analytics']['chart']>['data']['points'][number]
export type AnalysisConfiguration = Omit<NonNullable<AnalysisDefinitionQuery['analytics']['analysis']>, 'parametersSchema' | 'summarySchema' | 'segmentsSchema' | 'dataSchema'> & { parametersSchema: ObjectSchema; summarySchema: ObjectSchema; segmentsSchema: ObjectSchema; dataSchema: ObjectSchema }

export async function getAnalysisDefinition(systemName: string, signal?: AbortSignal): Promise<AnalysisConfiguration | null> {
  const { data } = await operationRequest(graphqlClient.query({ query: AnalysisDefinitionDocument, variables: { systemName }, fetchPolicy: 'no-cache', context: { fetchOptions: { signal } } }))
  const definition = data.analytics.analysis
  return definition ? { ...definition, parametersSchema: normalizeObjectSchema(definition.parametersSchema), summarySchema: normalizeObjectSchema(definition.summarySchema), segmentsSchema: normalizeObjectSchema(definition.segmentsSchema), dataSchema: normalizeObjectSchema(definition.dataSchema) } : null
}
export async function getAnalysisItemsDefinition(systemName: string, signal?: AbortSignal) {
  const { data } = await operationRequest(graphqlClient.query({ query: AnalysisItemsDefinitionDocument, variables: { systemName }, fetchPolicy: 'no-cache', context: { fetchOptions: { signal } } }))
  const chart = data.analytics.chart
  return chart ? { ...chart, queryInputSchema: normalizeObjectSchema(chart.queryInputSchema), dataPointSchema: normalizeObjectSchema(chart.dataPointSchema) } : null
}
export async function getSchemaAnalysisItems(systemName: string, queryInput: Record<string, unknown>, signal?: AbortSignal, access: AnalysisReferenceAccess = {}) {
  const variables = { systemName, queryInput, products: access.products ?? false, organizations: access.organizations ?? false, users: access.users ?? false }
  const request = (references: boolean) => graphqlClient.query({ query: AnalysisRunItemsDocument, variables: references ? variables : { ...variables, products: false, organizations: false, users: false }, fetchPolicy: 'no-cache', errorPolicy: 'all', context: { fetchOptions: { signal } } })
  let result = await operationRequest(request(true))
  let referencesUnavailable = false
  // A deleted or inaccessible linked entity must not hide the calculation itself.
  if (result.errors?.length && result.errors.every(error => error.path?.includes('references')) && Object.values(access).some(Boolean) && !signal?.aborted) {
    result = await operationRequest(request(false))
    referencesUnavailable = true
  }
  if (result.errors?.length) await operationRequest(Promise.reject({ graphQLErrors: result.errors }))
  const { data } = result
  if (!data.analytics.chart) throw new Error(t('analysisDetails.unavailable'))
  return { ...data.analytics.chart.data, referencesUnavailable }
}
export async function setAnalyticsRunPinned(runId: string, isPinned: boolean): Promise<{ id: string; isPinned: boolean }> {
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: SetAnalyticsRunPinnedDocument, variables: { runId, isPinned } }))
  if (!data) throw new Error(t('analysisDetails.pinError'))
  return data.analytics.setRunPinned
}
export async function getAnalyticsRun(id: string, signal?: AbortSignal): Promise<AnalysisRunDetails | null> {
  const { data } = await operationRequest(graphqlClient.query({ query: AnalyticsRunDetailsDocument, variables: { id }, fetchPolicy: 'no-cache', context: { fetchOptions: { signal } } }))
  return data.analytics.run
}
export async function getAbcXyzItems(systemName: string, input: { runId: string; abc?: AbcClass; xyz?: XyzFilter; cursor?: number; size: number }, signal?: AbortSignal, canReadProducts = false) {
  const result = await getSchemaAnalysisItems(systemName, { ...input, size: clampPageSize(input.size) }, signal, { products: canReadProducts })
  const nextCursor = result.nextCursor == null ? null : Number(result.nextCursor)
  if (nextCursor !== null && (!/^\d+$/.test(result.nextCursor!) || !Number.isSafeInteger(nextCursor) || nextCursor < 0)) throw new Error(t('analysisDetails.invalidData'))
  const products: AnalysisItemProduct[] = []
  const points = result.points.map(item => {
    const point = parseAbcXyzPoint(item.value)
    const target = item.references.find(reference => reference.field === 'productId' && reference.entity === 'Product')?.target
    if (target?.__typename === 'Product' && target.productId === point.productId && target.sku != null && target.name != null && target.producer) {
      products.push({ id: target.productId, sku: target.sku, name: target.name, producer: target.producer })
    }
    return point
  })
  return { points, products, nextCursor, referencesUnavailable: result.referencesUnavailable }
}

export type AnalysisDefinition = AvailableAnalysesQuery['analytics']['analyses'][number]
export type AnalyticsRun = AnalyticsRunsQuery['analytics']['runs'][number]
export interface AnalyticsRunCursor { id: string; createdAt: string }
export interface AnalyticsRunsFilters {
  analysisType?: string
  isPinned?: boolean
  periodFrom?: string
  periodTo?: string
}

export async function getAnalyses(signal?: AbortSignal): Promise<AnalysisDefinition[]> {
  const { data } = await operationRequest(graphqlClient.query({ query: AvailableAnalysesDocument, fetchPolicy: 'no-cache', context: { fetchOptions: { signal } } }))
  return data.analytics.analyses
}

export async function getAnalyticsRuns(filters: AnalyticsRunsFilters, cursor: AnalyticsRunCursor | null, size = 20, signal?: AbortSignal): Promise<AnalyticsRun[]> {
  const { data } = await operationRequest(graphqlClient.query({
    query: AnalyticsRunsDocument,
    variables: { input: { ...filters, cursor: { size: clampPageSize(size), value: cursor } } },
    fetchPolicy: 'no-cache', context: { fetchOptions: { signal } },
  }))
  return data.analytics.runs
}

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
  const dataPoints = result.points.map(({ value: point }) => {
    if (!point || typeof point !== 'object' || Array.isArray(point)) throw new Error(t('home.loadError'))
    const row = point as Record<string, unknown>
    if (typeof row.periodStart !== 'string' || !Number.isFinite(Date.parse(row.periodStart))
      || ['revenue', 'cost', 'grossProfit', 'salesCount', 'productsCount', 'margin'].some(key => typeof row[key] !== 'number' || !Number.isFinite(row[key]))) throw new Error(t('home.loadError'))
    return row as unknown as SalesProfitDataPoint
  })
  return { dataPoints, nextCursor: result.nextCursor ?? null }
}
