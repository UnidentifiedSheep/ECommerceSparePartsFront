import { effectScope, watch } from 'vue'
import { print } from 'graphql'
import { createClient, type Client } from 'graphql-ws'
import { tokenExpiresAt, requireSameSession } from '@/services/auth/session'
import { SessionChangedError, type AuthSession } from '@/services/auth/types'
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useAuthStore } from '@/stores/authStore.ts'
import { getAcceptLanguage, t } from '@/i18n'
import { graphqlUrl } from './client.ts'
import { getGraphqlErrors, isGraphqlAuthError, goToLogin, refreshGraphqlSession } from './auth.ts'

interface Callbacks<T> {
  next(data: T): void
  connected(): void
  disconnected(): void
  error(error: Error): void
}
interface Operation {
  query: string
  variables: Record<string, unknown>
  callbacks: Callbacks<unknown>
  connected: boolean
  version: number
  stop?: () => void
}
type AuthStore = ReturnType<typeof useAuthStore>
const connections = new WeakMap<AuthStore, Map<string, ReturnType<typeof createConnection>>>()

// One client/socket per auth session; graphql-ws multiplexes the operations.
function createConnection(auth: AuthStore, owner: AuthSession, released: () => void) {
  const operations = new Set<Operation>()
  const scope = effectScope(true)
  let disposed = false
  let recovering = false
  let connectionVersion = 0
  let connectionSession: AuthSession = owner
  let recoveryVersion = 0
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let expiryTimer: ReturnType<typeof setTimeout> | undefined
  let failures = 0
  let retriedToken: string | null = null
  let client: Client | undefined
  let connected = false
  let connecting = false

  function disconnected(operation: Operation) {
    if (!operation.connected) return
    operation.connected = false
    operation.callbacks.disconnected()
  }

  function stopConnection() {
    ++connectionVersion
    connected = false
    if (retryTimer !== undefined) clearTimeout(retryTimer)
    retryTimer = undefined
    if (expiryTimer !== undefined) clearTimeout(expiryTimer)
    expiryTimer = undefined
    for (const operation of operations) {
      ++operation.version
      operation.stop?.()
      operation.stop = undefined
    }
    if (client) void Promise.resolve(client.dispose()).catch(() => {})
    client = undefined
  }

  function dispose(notify = false) {
    if (disposed) return
    disposed = true
    ++recoveryVersion
    scope.stop()
    stopConnection()
    released()
    if (notify) operations.forEach(disconnected)
    operations.clear()
  }

  function remove(operation: Operation, notify = false) {
    if (!operations.delete(operation)) return
    ++operation.version
    operation.stop?.()
    operation.stop = undefined
    if (notify) disconnected(operation)
    if (!operations.size) dispose()
  }

  async function recoverSession(rejected = true) {
    if (disposed || recovering) return
    const expected = connectionSession
    const expiry = tokenExpiresAt(expected.token)
    if (rejected && retriedToken === expected.token && (!expiry || expiry > Date.now())) {
      dispose(true)
      goToLogin(expected)
      return
    }
    recovering = true
    const recovery = ++recoveryVersion
    stopConnection()
    operations.forEach(disconnected)
    if (disposed) return
    try {
      const session = await refreshGraphqlSession(expected)
      if (disposed || recovery !== recoveryVersion) return
      requireSameSession(session)
      retriedToken = rejected ? session.token : null
      recovering = false
      connect()
    } catch (cause) {
      if (disposed || recovery !== recoveryVersion || cause instanceof SessionChangedError) return
      const error = cause instanceof Error ? cause : new Error(t('notifications.connectionError'))
      operations.forEach(operation => operation.callbacks.error(error))
      if (!disposed && operations.size && auth.getSession()?.id === expected.id) {
        retryTimer = setTimeout(() => {
          retryTimer = undefined
          connect()
        }, Math.min(1000 * 2 ** Math.min(failures++, 5), 30000))
      }
    } finally { if (recovery === recoveryVersion) recovering = false }
  }

  function handleErrors(operation: Operation, cause: unknown, terminal: boolean) {
    if (disposed || recovering || !operations.has(operation)) return
    const errors = getGraphqlErrors(cause)
    if (isGraphqlAuthError(errors)) {
      void recoverSession()
      return
    }
    // A rejected/completed operation must not disconnect unrelated subscriptions.
    if (terminal) remove(operation, true)
    operation.callbacks.error(new Error(errors.length
      ? errors.map(error => error.message).join('\n')
      : t('notifications.connectionError')))
  }

  function startOperation(operation: Operation) {
    if (!client || disposed || operation.stop || !operations.has(operation)) return
    const currentVersion = connectionVersion
    const operationVersion = ++operation.version
    const current = () => !disposed && currentVersion === connectionVersion
      && operation.version === operationVersion && operations.has(operation)
    const stop = client.subscribe<unknown>({ query: operation.query, variables: operation.variables }, {
      next: result => {
        if (!current()) return
        if (result.errors?.length) {
          handleErrors(operation, result.errors, false)
          if (isGraphqlAuthError(result.errors)) return
        } else retriedToken = null
        if (result.data) operation.callbacks.next(result.data)
      },
      error: cause => { if (current()) handleErrors(operation, cause, true) },
      complete: () => { if (current()) remove(operation, true) },
    })
    if (current()) {
      operation.stop = stop
      if (connected && !operation.connected) {
        operation.connected = true
        operation.callbacks.connected()
      }
    } else stop()
  }

  function connect() {
    if (disposed || connecting) return
    connecting = true
    try {
      stopConnection()
      operations.forEach(disconnected)
      const session = auth.getSession()
      if (disposed || !operations.size || !session || session.id !== owner.id) return
      connectionSession = session
      const expiresAt = tokenExpiresAt(session.token)
      if (expiresAt && expiresAt <= Date.now()) {
        void recoverSession(false)
        return
      }
      const currentVersion = connectionVersion
      const current = () => !disposed && currentVersion === connectionVersion
      client = createClient({
        url: graphqlUrl.replace(/^http/, 'ws'),
        lazy: true,
        retryAttempts: Infinity,
        retryWait: attempt => new Promise(resolve => setTimeout(resolve, Math.min(1000 * 2 ** Math.min(attempt, 5), 30000))),
        connectionAckWaitTimeout: 10000,
        keepAlive: 20000,
        connectionParams: () => ({ authorization: `Bearer ${connectionSession.token}`, 'Accept-Language': getAcceptLanguage() }),
        on: {
          connected: () => {
            if (!current()) return
            connected = true
            failures = 0
            for (const operation of operations) {
              if (operation.connected) continue
              operation.connected = true
              operation.callbacks.connected()
            }
            if (!current()) return
            const expiry = tokenExpiresAt(connectionSession.token)
            if (expiryTimer !== undefined) clearTimeout(expiryTimer)
            if (expiry) expiryTimer = setTimeout(() => {
              if (current()) void recoverSession(false)
            }, Math.min(2147483647, Math.max(1000, expiry - Date.now() - 5000)))
          },
          closed: event => {
            if (!current()) return
            connected = false
            if (expiryTimer !== undefined) clearTimeout(expiryTimer)
            expiryTimer = undefined
            operations.forEach(disconnected)
            if (event && typeof event === 'object' && 'code' in event && (event.code === 4401 || event.code === 4403)) {
              void recoverSession()
            }
          },
        },
      })
      operations.forEach(startOperation)
    } finally { connecting = false }
  }

  scope.run(() => watch(() => [auth.sessionId, auth.token] as const, ([id]) => {
    if (disposed) return
    if (id !== owner.id) { dispose(true); return }
    if (!recovering) connect()
  }, { flush: 'sync' }))

  return {
    add(query: string, variables: Record<string, unknown>, callbacks: Callbacks<unknown>) {
      const operation: Operation = { query, variables, callbacks, connected: false, version: 0 }
      operations.add(operation)
      if (client) startOperation(operation)
      else if (!recovering && !connecting && retryTimer === undefined) connect()
      return () => remove(operation)
    },
  }
}

export function subscribeGraphql<TData, TVariables extends Record<string, unknown>>(
  document: TypedDocumentNode<TData, TVariables>,
  variables: TVariables,
  callbacks: Callbacks<TData>,
) {
  const auth = useAuthStore()
  const session = auth.getSession()
  if (!session) return () => {}
  let pool = connections.get(auth)
  if (!pool) { pool = new Map(); connections.set(auth, pool) }
  let connection = pool.get(session.id)
  if (!connection) {
    connection = createConnection(auth, session, () => pool.delete(session.id))
    pool.set(session.id, connection)
  }
  return connection.add(print(document), variables, { ...callbacks, next: data => callbacks.next(data as TData) })
}
