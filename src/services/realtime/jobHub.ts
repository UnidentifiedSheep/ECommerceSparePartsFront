import { watch } from 'vue'
import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr'
import { apiBaseUrl } from '@/services/api/config'
import { getValidSession, refreshAuthSession, requireSameSession, tokenExpiresAt } from '@/services/auth/session'
import { SessionChangedError } from '@/services/auth/types'
import { getAcceptLanguage } from '@/i18n'
import { useAuthStore } from '@/stores/authStore.ts'

export interface JobStatusUpdatedEvent { jobId: string; status: string; attempts: number }
interface JobStatusUpdatedPayload { jobId?: string; id?: string; status?: string; attempts?: number; currentAttempt?: number }
function isUnauthorized(error: unknown) {
  return !!error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401
}

export async function startJobHub(serviceKey: string, onUpdated: (event: JobStatusUpdatedEvent) => void | Promise<void>): Promise<HubConnection> {
  const auth = useAuthStore()
  const expected = await getValidSession()
  let usedSession = expected
  let rejected = false
  let authRetryToken: string | null = null
  let disposed = false
  let restarting = false
  let failures = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let stopWatch: (() => void) | undefined
  let restarts: Promise<void> = Promise.resolve()
  const connection = new HubConnectionBuilder()
    .withUrl(`${apiBaseUrl}/${serviceKey}/hubs/jobs`, {
      accessTokenFactory: async () => {
        requireSameSession(expected)
        usedSession = rejected ? await refreshAuthSession(usedSession) : await getValidSession()
        if (rejected) authRetryToken = usedSession.token
        rejected = false
        return usedSession.token
      },
      headers: { 'Accept-Language': getAcceptLanguage() },
    })
    .withAutomaticReconnect({ nextRetryDelayInMilliseconds: (context) => {
      if (disposed) return null
      if (isUnauthorized(context.retryReason)) {
        if (authRetryToken === usedSession.token) { auth.logout(usedSession); return null }
        rejected = true
      }
      return Math.min(1000 * 2 ** Math.min(context.previousRetryCount, 5), 30000)
    } })
    .configureLogging(LogLevel.Warning)
    .build()

  const rawStop = connection.stop.bind(connection)
  function clearTimer() { if (timer !== undefined) clearTimeout(timer); timer = undefined }
  function scheduleRetry() {
    if (disposed) return
    clearTimer()
    timer = setTimeout(() => { timer = undefined; restart() }, Math.min(1000 * 2 ** Math.min(failures++, 5), 30000))
  }
  function scheduleRefresh() {
    clearTimer()
    const expiry = tokenExpiresAt(auth.token)
    if (!expiry || disposed) return
    timer = setTimeout(() => {
      timer = undefined
      void getValidSession().then(() => { if (!disposed) scheduleRefresh() }).catch(() => { if (auth.sessionId === expected.id) scheduleRetry() })
    }, Math.min(2147483647, Math.max(1000, expiry - Date.now() - 5000)))
  }
  async function start() {
    try { await connection.start() }
    catch (error) {
      if (!isUnauthorized(error)) throw error
      usedSession = await refreshAuthSession(usedSession)
      try { await connection.start() }
      catch (retryError) { if (isUnauthorized(retryError)) auth.logout(usedSession); throw retryError }
    }
    requireSameSession(expected)
    failures = 0
    scheduleRefresh()
  }
  function restart() {
    restarts = restarts.then(async () => {
      if (disposed) return
      requireSameSession(expected)
      restarting = true
      try {
        await rawStop()
        if (!disposed) await start()
      } finally { restarting = false }
    }).catch((error) => {
      if (!(error instanceof SessionChangedError) && auth.sessionId === expected.id) scheduleRetry()
    })
  }
  // Consumers already own this connection and call stop() on unmount. Dispose our
  // token watcher and timers at the same time, including an in-flight restart.
  connection.stop = async () => {
    disposed = true
    clearTimer()
    stopWatch?.()
    await rawStop()
  }
  const handleUpdated = (payload: JobStatusUpdatedPayload) => {
    if (disposed || auth.sessionId !== expected.id) return
    const jobId = payload.jobId ?? payload.id, attempts = payload.attempts ?? payload.currentAttempt
    if (jobId && payload.status && attempts !== undefined) void onUpdated({ jobId, status: payload.status, attempts })
  }
  connection.on('JobStatusUpdated', handleUpdated)
  connection.on('MetricCalculationJobUpdated', handleUpdated)
  connection.onreconnected(() => { authRetryToken = null; failures = 0; scheduleRefresh() })
  connection.onclose(() => { if (!disposed && !restarting && auth.sessionId === expected.id) scheduleRetry() })
  try {
    await start()
    stopWatch = watch(() => [auth.sessionId, auth.token] as const, ([id]) => {
      if (id !== expected.id) void connection.stop()
      else restart()
    }, { flush: 'sync' })
    return connection
  } catch (error) { await connection.stop(); throw error }
}
