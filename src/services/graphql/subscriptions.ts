import { watch } from 'vue'
import { print } from 'graphql'
import { createClient, type Client } from 'graphql-ws'
import { jwtDecode } from 'jwt-decode'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useAuthStore } from '@/stores/authStore.ts'
import { getCurrentLocale, t } from '@/i18n'
import { graphqlUrl } from './client.ts'
import { getGraphqlErrors, isGraphqlAuthError, goToLogin, refreshGraphqlSession } from './auth.ts'

export function subscribeGraphql<TData, TVariables extends Record<string, unknown>>(
  document: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  callbacks: {
    next(data: TData): void
    connected(): void
    disconnected(): void
    error(error: Error): void
  },
) {
  const auth = useAuthStore()
  let disposed = false
  let recovering = false
  let connectionVersion = 0
  let connectionToken: string | null = null
  let retriedToken: string | null = null
  let client: Client | undefined
  let unsubscribe: (() => void) | undefined
  let expiryTimer: ReturnType<typeof setTimeout> | undefined

  function tokenExpiresAt(token: string | null) {
    if (!token) return undefined
    try {
      const { exp } = jwtDecode<{ exp?: number }>(token)
      return exp ? exp * 1000 : undefined
    } catch { return undefined }
  }

  function stopConnection() {
    connectionVersion += 1
    if (expiryTimer !== undefined) clearTimeout(expiryTimer)
    expiryTimer = undefined
    unsubscribe?.()
    unsubscribe = undefined
    if (client) void client.dispose()
    client = undefined
  }

  async function recoverSession(rejected = true) {
    if (disposed || recovering) return
    const failedToken = connectionToken
    const expiry = tokenExpiresAt(failedToken)
    if (rejected && retriedToken === failedToken && (!expiry || expiry > Date.now())) {
      stopConnection()
      callbacks.disconnected()
      goToLogin()
      return
    }
    recovering = true
    stopConnection()
    callbacks.disconnected()
    try {
      const token = await refreshGraphqlSession(failedToken)
      if (disposed) return
      retriedToken = rejected ? token : null
      recovering = false
      connect()
    } catch (cause) {
      if (!disposed) callbacks.error(cause instanceof Error ? cause : new Error(t('notifications.connectionError')))
    } finally { recovering = false }
  }

  function handleErrors(cause: unknown, terminal: boolean) {
    if (disposed || recovering) return
    const errors = getGraphqlErrors(cause)
    if (isGraphqlAuthError(errors)) {
      void recoverSession()
      return
    }
    if (terminal) {
      stopConnection()
      callbacks.disconnected()
    }
    callbacks.error(new Error(errors.length
      ? errors.map((error) => error.message).join('\n')
      : t('notifications.connectionError')))
  }

  function connect() {
    stopConnection()
    if (disposed || !auth.token) return
    connectionToken = auth.token
    const expiresAt = tokenExpiresAt(connectionToken)
    if (expiresAt && expiresAt <= Date.now()) {
      void recoverSession(false)
      return
    }
    const currentVersion = connectionVersion
    const current = () => !disposed && currentVersion === connectionVersion
    const currentClient = createClient({
      url: graphqlUrl.replace(/^http/, 'ws'),
      lazy: true,
      retryAttempts: Infinity,
      retryWait: (attempt) => new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** Math.min(attempt, 5), 30000))),
      connectionAckWaitTimeout: 10000,
      keepAlive: 20000,
      connectionParams: () => ({ authorization: `Bearer ${connectionToken}`, 'Accept-Language': getCurrentLocale() }),
      on: {
        connected: () => {
          if (!current()) return
          callbacks.connected()
          const expiry = tokenExpiresAt(connectionToken)
          if (expiryTimer !== undefined) clearTimeout(expiryTimer)
          if (expiry) expiryTimer = setTimeout(() => {
            if (current()) void recoverSession(false)
          }, Math.min(2147483647, Math.max(1000, expiry - Date.now() - 5000)))
        },
        closed: (event) => {
          if (!current()) return
          if (expiryTimer !== undefined) clearTimeout(expiryTimer)
          expiryTimer = undefined
          callbacks.disconnected()
          if (event && typeof event === 'object' && 'code' in event && (event.code === 4401 || event.code === 4403)) {
            void recoverSession()
          }
        },
      },
    })
    client = currentClient
    unsubscribe = currentClient.subscribe<TData>({ query: print(document), variables }, {
      next: (result) => {
        if (!current()) return
        if (result.errors?.length) {
          handleErrors(result.errors, false)
          if (isGraphqlAuthError(result.errors)) return
        } else retriedToken = null
        if (result.data) callbacks.next(result.data)
      },
      error: (cause) => { if (current()) handleErrors(cause, true) },
      complete: () => { if (current()) callbacks.disconnected() },
    })
  }

  const stopTokenWatch = watch(() => auth.token, (token) => {
    if (disposed || recovering) return
    callbacks.disconnected()
    if (token) connect()
    else stopConnection()
  })
  connect()

  return () => {
    disposed = true
    stopTokenWatch()
    stopConnection()
  }
}
