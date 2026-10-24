import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import { authStorageKey, useAuthStore } from '@/stores/authStore'
import { apiBaseUrl } from '@/services/api/config'
import { getAcceptLanguage } from '@/i18n'
import { ApiError, type ErrorResponse } from '@/models/errorModel'
import { SessionChangedError, type AuthSession, type TokenPair } from './types'

const refreshes = new Map<string, Promise<AuthSession>>()
const lockName = `ecom-auth-refresh:${apiBaseUrl}`

export function tokenExpiresAt(token: string | null): number | undefined {
  if (!token) return undefined
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token)
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : undefined
  } catch { return undefined }
}

export function requireSameSession(expected: AuthSession | null): AuthSession {
  const current = useAuthStore().getSession()
  if (!expected || !current || current.id !== expected.id) throw new SessionChangedError()
  return current
}

function rotated(current: AuthSession, previous: AuthSession) {
  return current.token !== previous.token || current.refreshToken !== previous.refreshToken
}
function isInvalidRefresh(error: unknown) {
  if (!axios.isAxiosError(error)) return false
  // 400 is terminal only for the backend's specific invalid-token error.
  return error.response?.status === 401
    || (error.response?.status === 400 && error.response.data?.title === 'InvalidTokenException')
}

async function waitForOtherTab(expected: AuthSession) {
  await new Promise<void>((resolve) => {
    const finish = () => { clearTimeout(timer); window.removeEventListener('storage', changed); resolve() }
    const changed = (event: StorageEvent) => {
      if (event.key !== authStorageKey && event.key !== null) return
      const current = useAuthStore().getSession()
      if (!current || current.id !== expected.id || rotated(current, expected)) finish()
    }
    // A concurrent winner has the same 10-second request timeout. Storage events
    // normally resolve this immediately; the timeout also covers a closed tab.
    const timer = setTimeout(finish, 10000)
    window.addEventListener('storage', changed)
    changed({ key: authStorageKey } as StorageEvent)
  })
}

async function rotate(expected: AuthSession): Promise<AuthSession> {
  const store = useAuthStore()
  const current = requireSameSession(expected)
  if (rotated(current, expected)) return current
  try {
    const { data } = await axios.post<TokenPair>(`${apiBaseUrl}/main/auth/refresh`, {
      refreshToken: current.refreshToken,
    }, { timeout: 10000, headers: { 'Accept-Language': getAcceptLanguage() } })
    // Persistence stays inside the cross-tab lock, including unchanged JWT strings.
    if (!store.refresh(current, data)) {
      const latest = requireSameSession(current)
      if (rotated(latest, current)) return latest
      throw new SessionChangedError()
    }
    return requireSameSession(current)
  } catch (error) {
    let latest = requireSameSession(current)
    if (rotated(latest, current)) return latest
    if (isInvalidRefresh(error)) {
      // Older browsers without Web Locks may race. Give the winning tab time to publish.
      if (!navigator.locks) {
        await waitForOtherTab(current)
        latest = requireSameSession(current)
        if (rotated(latest, current)) return latest
      }
      store.logout(current)
    }
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.title) throw new ApiError({ ...error.response.data as ErrorResponse, errorRelatedData: undefined })
      throw new Error(error.message || 'Unable to refresh authentication session.')
    }
    throw error
  }
}

export function refreshAuthSession(expected: AuthSession): Promise<AuthSession> {
  try {
    const current = requireSameSession(expected)
    if (rotated(current, expected)) return Promise.resolve(current)
    const pending = refreshes.get(current.id)
    if (pending) return pending
    const promise = Promise.resolve().then(async () => navigator.locks
      ? await navigator.locks.request(lockName, () => rotate(current))
      : await rotate(current)
    ).finally(() => { if (refreshes.get(current.id) === promise) refreshes.delete(current.id) })
    refreshes.set(current.id, promise)
    return promise
  } catch (error) { return Promise.reject(error) }
}

export async function getValidSession(): Promise<AuthSession> {
  const current = useAuthStore().getSession()
  if (!current) throw new SessionChangedError()
  const expiresAt = tokenExpiresAt(current.token)
  return !expiresAt || expiresAt <= Date.now() + 30000 ? refreshAuthSession(current) : current
}
