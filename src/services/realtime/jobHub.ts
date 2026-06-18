import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr'
import { apiBaseUrl } from '@/services/api/api.ts'
import { getCurrentLocale } from '@/i18n'
import { useAuthStore } from '@/stores/authStore.ts'

export interface JobStatusUpdatedEvent {
  jobId: string
  status: string
  attempts: number
}

interface JobStatusUpdatedPayload {
  jobId?: string
  id?: string
  status?: string
  attempts?: number
  currentAttempt?: number
}

function hubUrl(serviceKey: string): string {
  return `${apiBaseUrl}/${serviceKey}/hubs/jobs`
}

function mapJobStatusUpdatedEvent(payload: JobStatusUpdatedPayload): JobStatusUpdatedEvent | null {
  const jobId = payload.jobId ?? payload.id
  const status = payload.status
  const attempts = payload.attempts ?? payload.currentAttempt

  if (!jobId || !status || attempts === undefined) return null

  return {
    jobId,
    status,
    attempts,
  }
}

export async function startJobHub(
  serviceKey: string,
  onUpdated: (event: JobStatusUpdatedEvent) => void | Promise<void>,
): Promise<HubConnection> {
  const authStore = useAuthStore()
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl(serviceKey), {
      accessTokenFactory: () => authStore.token ?? '',
      headers: {
        'Accept-Language': getCurrentLocale(),
      },
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()

  const handleUpdated = (payload: JobStatusUpdatedPayload) => {
    const event = mapJobStatusUpdatedEvent(payload)
    if (event) void onUpdated(event)
  }

  connection.on('JobStatusUpdated', handleUpdated)
  connection.on('MetricCalculationJobUpdated', handleUpdated)

  await connection.start()
  return connection
}
