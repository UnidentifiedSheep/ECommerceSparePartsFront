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
  maxAttempts: number
  createdAt?: string
  updatedAt?: string
  errorMessage: string | null
}

interface MetricCalculationJobUpdatedDto {
  jobId?: string
  metricId?: string | null
  status?: CalculationStatus
  attempts?: number
  maxAttempts?: number
  createdAt?: string
  updatedAt?: string
  errorMessage?: string | null
  requestId?: string
  calculationStatus?: CalculationStatus
}

function hubUrl(): string {
  return `${apiBaseUrl}${analyticsApiPrefix}/hubs/calculation-jobs`
}

function mapEvent(event: MetricCalculationJobUpdatedDto): MetricCalculationJobUpdatedEvent {
  const updatedAt = event.updatedAt ?? new Date().toISOString()
  return {
    jobId: event.jobId ?? event.requestId ?? '',
    metricId: event.metricId ?? null,
    status: event.status ?? event.calculationStatus ?? 'Processing',
    attempts: event.attempts ?? 0,
    maxAttempts: event.maxAttempts ?? 0,
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

  connection.on('MetricCalculationJobUpdated', (event: MetricCalculationJobUpdatedDto) => {
    void onUpdated(mapEvent(event))
  })

  await connection.start()
  return connection
}
