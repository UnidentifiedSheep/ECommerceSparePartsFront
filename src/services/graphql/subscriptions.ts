import { watch } from 'vue'
import { print } from 'graphql'
import { createClient, type Client } from 'graphql-ws'
import { tokenExpiresAt, requireSameSession } from '@/services/auth/session'
import { SessionChangedError, type AuthSession } from '@/services/auth/types'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useAuthStore } from '@/stores/authStore.ts'
import { getAcceptLanguage, t } from '@/i18n'
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
  const ownerSession = auth.getSession()
  let disposed = false
  let recovering = false
  let connectionVersion = 0
  let connectionSession: AuthSession | null = null
  let recoveryVersion = 0
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let failures = 0
  let retriedToken: string | null = null
  let client: Client | undefined
  let unsubscribe: (() => void) | undefined
  let expiryTimer: ReturnType<typeof setTimeout> | undefined

  function stopConnection() {
    connectionVersion += 1
    if (retryTimer !== undefined) clearTimeout(retryTimer)
    retryTimer = undefined
    if (expiryTimer !== undefined) clearTimeout(expiryTimer)
    expiryTimer = undefined
    unsubscribe?.()
    unsubscribe = undefined
    if (client) void client.dispose()
    client = undefined
  }

  async function recoverSession(rejected = true) {
    if (disposed || recovering || !connectionSession) return
    const expected = connectionSession
    const expiry = tokenExpiresAt(expected.token)
    if (rejected && retriedToken === expected.token && (!expiry || expiry > Date.now())) {
      stopConnection()
      callbacks.disconnected()
      goToLogin(expected)
      return
    }
    recovering = true
    const recovery = ++recoveryVersion
    stopConnection()
    callbacks.disconnected()
    try {
      const session = await refreshGraphqlSession(expected)
      if (disposed || recovery !== recoveryVersion) return
      requireSameSession(session)
      retriedToken = rejected ? session.token : null
      recovering = false
      connect()
    } catch (cause) {
      if (disposed || recovery !== recoveryVersion || cause instanceof SessionChangedError) return
      callbacks.error(cause instanceof Error ? cause : new Error(t('notifications.connectionError')))
      if (auth.getSession()?.id === expected.id) {
        retryTimer = setTimeout(() => {
          retryTimer = undefined
          connect()
        }, Math.min(1000 * 2 ** Math.min(failures++, 5), 30000))
      }
    } finally { if (recovery === recoveryVersion) recovering = false }
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
    connectionSession = auth.getSession()
    if (disposed || !connectionSession || connectionSession.id !== ownerSession?.id) return
    const expiresAt = tokenExpiresAt(connectionSession.token)
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
      connectionParams: () => ({ authorization: `Bearer ${connectionSession?.token}`, 'Accept-Language': getAcceptLanguage() }),
      on: {
        connected: () => {
          if (!current()) return
          failures = 0
          callbacks.connected()
          const expiry = tokenExpiresAt(connectionSession?.token ?? null)
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

  const stopTokenWatch = watch(() => [auth.sessionId, auth.token] as const, ([id], previous) => {
    if (disposed) return
    if (previous?.[0] !== id) {
      recoveryVersion++
      recovering = false
      retriedToken = null
    }
    if (recovering) return
    callbacks.disconnected()
    connect()
  }, { flush: 'sync' })
  connect()

  return () => {
    disposed = true
    recoveryVersion++
    stopTokenWatch()
    stopConnection()
  }
}
