import api, { analyticsApiPrefix, clampPageSize } from '@/services/api/api.ts'

export type CalculationStatus =
  | 'Pending'
  | 'Locked'
  | 'Processing'
  | 'Failed'
  | 'Succeeded'
  | 'Cancelled'
  | 'Calculating'
  | 'AwaitingWorker'

type CalculationStatusDto = CalculationStatus | 0 | 1 | 2 | 3 | 4 | 5

export interface MetricInfoModel {
  systemName: string
  name: string
  description: string
  inputSchema: string
}

export type MetricSchemaFieldControl = 'UploadFile' | 'TextField' | 'DatePicker' | 'EntitySelector' | string

export interface MetricSchemaField {
  name: string
  type: string
  label?: string
  description?: string
  required?: boolean
  control?: MetricSchemaFieldControl
  accepts?: string[]
  dependsOnEntity?: string
  dependsOnField?: string
}

export interface MetricInitStateSchema {
  fields: MetricSchemaField[]
}

export type MetricSortBy =
  | 'id_asc'
  | 'id_desc'
  | 'createdAt_asc'
  | 'createdAt_desc'
  | 'updatedAt_asc'
  | 'updatedAt_desc'
  | 'recalculatedAt_asc'
  | 'recalculatedAt_desc'

export type MetricCalculationJobSortBy =
  | 'jobId_asc'
  | 'jobId_desc'
  | 'metricId_asc'
  | 'metricId_desc'
  | 'createdAt_asc'
  | 'createdAt_desc'
  | 'updatedAt_asc'
  | 'updatedAt_desc'
  | 'status_asc'
  | 'status_desc'

export interface CalculationJobModel {
  jobId: string
  metricId: string
  status: CalculationStatus
  attempts: number
  maxAttempts: number
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
}

export interface GetMetricsRequest {
  page: number
  limit: number
  sortBy?: MetricSortBy
  metricSystemName?: string
}

export interface GetMetricCalculationJobsRequest {
  metricId: string
  page: number
  limit: number
  sortBy?: MetricCalculationJobSortBy
}

export interface GetMetricInfosResponse {
  metrics: MetricInfoModel[]
}

export interface GetMetricsResponse {
  metrics: MetricModel[]
}

export interface GetMetricCalculationJobsResponse {
  jobs: CalculationJobModel[]
}

export interface UpsertMetricRequest {
  metricSystemName: string
  inputPayload: Record<string, string | number | boolean | null>
}

export interface UpsertMetricResponse {
  metric: MetricModel
}

interface CalculationJobDto extends Omit<CalculationJobModel, 'status'> {
  status: CalculationStatusDto
}

interface MetricDto extends Omit<MetricModel, 'lastMetricJob'> {
  lastMetricJob: CalculationJobDto | null
}

export interface MetricModel {
  id: string
  systemName: string
  name: string
  description: string
  data: string | null
  tags: string
  rangeStart: string
  rangeEnd: string
  currencyId: number
  productId?: number | null
  lastMetricJob: CalculationJobModel | null
}

const statusByNumber: Record<number, CalculationStatus> = {
  0: 'Pending',
  1: 'Locked',
  2: 'Processing',
  3: 'Failed',
  4: 'Succeeded',
  5: 'Cancelled',
}

function analyticsUrl(path: string): string {
  return `${analyticsApiPrefix}${path}`
}

function mapCalculationJob(dto: CalculationJobDto): CalculationJobModel {
  return {
    ...dto,
    status: typeof dto.status === 'number'
      ? (statusByNumber[dto.status] ?? 'Calculating')
      : dto.status,
  }
}

function mapMetric(dto: MetricDto): MetricModel {
  return {
    ...dto,
    lastMetricJob: dto.lastMetricJob
      ? mapCalculationJob(dto.lastMetricJob)
      : null,
  }
}

export async function getMetricInfos(): Promise<GetMetricInfosResponse> {
  const resp = await api.get<GetMetricInfosResponse>(analyticsUrl('/metrics/info'))
  return resp.data
}

export async function getMetrics(req: GetMetricsRequest): Promise<GetMetricsResponse> {
  const resp = await api.get<{ metrics: MetricDto[] }>(analyticsUrl('/metrics'), {
    params: {
      page: req.page,
      limit: clampPageSize(req.limit),
      sortBy: req.sortBy,
      metricSystemName: req.metricSystemName,
    },
  })
  return {
    metrics: resp.data.metrics.map(mapMetric),
  }
}

export async function getMetricCalculationJobs(
  req: GetMetricCalculationJobsRequest,
): Promise<GetMetricCalculationJobsResponse> {
  const resp = await api.get<{ jobs: CalculationJobDto[] }>(analyticsUrl(`/metrics/${req.metricId}/jobs`), {
    params: {
      page: req.page,
      limit: clampPageSize(req.limit),
      sortBy: req.sortBy,
    },
  })
  return {
    jobs: resp.data.jobs.map(mapCalculationJob),
  }
}

export async function upsertMetric(req: UpsertMetricRequest): Promise<UpsertMetricResponse> {
  const resp = await api.post<{ metric: MetricDto }>(analyticsUrl('/metrics'), {
    metricSystemName: req.metricSystemName,
    inputPayload: JSON.stringify(req.inputPayload),
  })
  return {
    metric: mapMetric(resp.data.metric),
  }
}
