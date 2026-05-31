import api, { clampPageSize } from '@/services/api/api.ts'
import { analyticsApiPrefix } from '@/config/apiConfig.ts'
import { toUtcDateTimeString } from '@/utils/dateTime.ts'

export type CalculationStatus =
  | 'Calculating'
  | 'Failed'
  | 'Succeeded'
  | 'Cancelled'
  | 'AwaitingWorker'

type CalculationStatusDto = CalculationStatus | 0 | 1 | 2 | 3 | 4

export interface MetricInfoModel {
  systemName: string
  name: string
  description: string
}

export interface MetricPayloadRequest {
  currencyId: number
  rangeStart: string
  rangeEnd: string
  productId?: number
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
  | 'requestId_asc'
  | 'requestId_desc'
  | 'createdAt_asc'
  | 'createdAt_desc'
  | 'updatedAt_asc'
  | 'updatedAt_desc'
  | 'status_asc'
  | 'status_desc'

export interface CreateCalculationJobRequest {
  metricSystemName?: string
  metricPayload?: MetricPayloadRequest
  metricId?: string
}

export interface CalculationJobModel {
  requestId: string
  metricId?: string | null
  metricSystemName: string
  status: CalculationStatus
  createdAt: string
  updatedAt: string
  errorMessage?: string | null
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

export interface CreateCalculationJobResponse {
  requestId: string
}

interface CalculationJobDto extends Omit<CalculationJobModel, 'status'> {
  status: CalculationStatusDto
}

interface MetricDto extends Omit<MetricModel, 'lastCalculationJob'> {
  lastCalculationJob: CalculationJobDto | null
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
  productId: number | null
  lastCalculationJob: CalculationJobModel | null
}

const statusByNumber: Record<number, CalculationStatus> = {
  0: 'Calculating',
  1: 'Failed',
  2: 'Succeeded',
  3: 'Cancelled',
  4: 'AwaitingWorker',
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
    lastCalculationJob: dto.lastCalculationJob
      ? mapCalculationJob(dto.lastCalculationJob)
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

export async function createCalculationJob(
  req: CreateCalculationJobRequest,
): Promise<CreateCalculationJobResponse> {
  const resp = await api.post<CreateCalculationJobResponse>(analyticsUrl('/jobs'), {
    ...req,
    metricPayload: req.metricPayload
      ? {
          ...req.metricPayload,
          rangeStart: toUtcDateTimeString(req.metricPayload.rangeStart),
          rangeEnd: toUtcDateTimeString(req.metricPayload.rangeEnd),
        }
      : undefined,
  })
  return resp.data
}

export async function getCalculationJob(id: string): Promise<{ calculationJob: CalculationJobModel }> {
  const resp = await api.get<{ calculationJob: CalculationJobDto }>(analyticsUrl(`/jobs/${id}`))
  return {
    calculationJob: mapCalculationJob(resp.data.calculationJob),
  }
}
