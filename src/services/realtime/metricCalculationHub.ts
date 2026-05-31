import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr'
import api from '@/services/api/api.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import type { CalculationStatus } from '@/services/api/analytics.ts'

export interface MetricCalculationJobUpdatedEvent {
  metricId: string | null
  requestId: string
  calculationStatus: CalculationStatus
  errorMessage: string | null
}

const analyticsPrefix = (import.meta.env.VITE_ANALYTICS_API_PREFIX ?? '/analytics').replace(/\/$/, '')

function hubUrl(): string {
  return `${String(api.defaults.baseURL).replace(/\/$/, '')}${analyticsPrefix}/hubs/calculation-jobs`
}

export async function startMetricCalculationHub(
  onUpdated: (event: MetricCalculationJobUpdatedEvent) => void | Promise<void>,
): Promise<HubConnection> {
  const authStore = useAuthStore()
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl(), {
      accessTokenFactory: () => authStore.token ?? '',
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
