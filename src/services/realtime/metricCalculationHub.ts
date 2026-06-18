import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useAuthStore } from '@/stores/authStore.ts'
import { analyticsApiPrefix, apiBaseUrl } from '@/services/api/api.ts'
import type { CalculationStatus } from '@/services/api/analytics.ts'
import { getCurrentLocale } from '@/i18n'

export interface MetricCalculationJobUpdatedEvent {
  metricId: string | null
  requestId: string
  calculationStatus: CalculationStatus
  errorMessage: string | null
}

function hubUrl(): string {
  return `${apiBaseUrl}${analyticsApiPrefix}/hubs/calculation-jobs`
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

  connection.on('MetricCalculationJobUpdated', (event: MetricCalculationJobUpdatedEvent) => {
    void onUpdated(event)
  })

  await connection.start()
  return connection
}
