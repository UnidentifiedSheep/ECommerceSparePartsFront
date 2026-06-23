import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useAuthStore } from '@/stores/authStore.ts'
import { analyticsApiPrefix, apiBaseUrl } from '@/services/api/api.ts'
import type { CalculationStatus } from '@/services/api/analytics.ts'
import { getCurrentLocale } from '@/i18n'

export interface MetricCalculationJobUpdatedEvent {
  jobId: string
  metricId: string | null
  status: CalculationStatus
  attempts: number
  maxAttempts?: number
  createdAt?: string
  updatedAt?: string
  errorMessage?: string | null
}

interface MetricCalculationJobUpdatedDto {
  jobId?: string
  id?: string
  metricId?: string | null
  status?: CalculationStatus
  attempts?: number
  currentAttempt?: number
  maxAttempts?: number
  createdAt?: string
  updatedAt?: string
  errorMessage?: string | null
  requestId?: string
  calculationStatus?: CalculationStatus
}

function hubUrl(): string {
  return `${apiBaseUrl}${analyticsApiPrefix}/hubs/metrics`
}

function mapEvent(event: MetricCalculationJobUpdatedDto): MetricCalculationJobUpdatedEvent | null {
  const jobId = event.jobId ?? event.id ?? event.requestId
  const status = event.status ?? event.calculationStatus

  if (!jobId || !status) return null

  const updatedAt = event.updatedAt ?? new Date().toISOString()
  return {
    jobId,
    metricId: event.metricId ?? null,
    status,
    attempts: event.attempts ?? event.currentAttempt ?? 0,
    maxAttempts: event.maxAttempts,
    createdAt: event.createdAt,
    updatedAt,
    errorMessage: event.errorMessage ?? null,
  }
}

export async function startMetricCalculationHub(
  onUpdated: (event: MetricCalculationJobUpdatedEvent) => void | Promise<void>,
): Promise<HubConnection> {
  const authStore = useAuthStore()
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl(), {
      accessTokenFactory: () => authStore.token ?? '',
      headers: {
        'Accept-Language': getCurrentLocale(),
      },
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()

  const handleUpdated = (payload: MetricCalculationJobUpdatedDto) => {
    const event = mapEvent(payload)
    if (event) void onUpdated(event)
  }

  connection.on('JobStatusUpdated', handleUpdated)
  connection.on('MetricCalculationJobUpdated', handleUpdated)

  await connection.start()
  return connection
}
