import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import type { AuthSession, TokenPair } from '@/services/auth/types'

interface User {
  id: string
  userName?: string
  email?: string
  name?: string
  surname?: string
  roles: string[]
  permissions: string[]
}
interface JwtPayload {
  sub?: string
  nameid?: string
  unique_name?: string
  email?: string
  given_name?: string
  family_name?: string
  role?: string | string[]
  permission?: string | string[]
}
export const authStorageKey = 'authSession'

function decodeUser(jwt: string): User | null {
  try {
    const payload = jwtDecode<JwtPayload>(jwt)
    const id = payload.sub ?? payload.nameid
    if (!id || typeof id !== 'string') return null
    return {
      id, userName: payload.unique_name, email: payload.email,
      name: payload.given_name, surname: payload.family_name,
      roles: Array.isArray(payload.role) ? payload.role : payload.role ? [payload.role] : [],
      permissions: Array.isArray(payload.permission) ? payload.permission : payload.permission ? [payload.permission] : [],
    }
  } catch { return null }
}

function validPair(value: unknown): value is TokenPair {
  if (!value || typeof value !== 'object') return false
  const pair = value as TokenPair
  return typeof pair.token === 'string' && !!decodeUser(pair.token)
    && typeof pair.refreshToken === 'string' && pair.refreshToken.trim().length > 0
}

export const useAuthStore = defineStore('auth', () => {
  function readSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(authStorageKey)
      // Migrate once. A stored null is a logout marker, so legacy keys cannot revive it.
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw)
        return validPair(parsed) && 'id' in parsed && typeof parsed.id === 'string' ? parsed as AuthSession : null
      }
      const legacy = { token: localStorage.getItem('token'), refreshToken: localStorage.getItem('refreshToken') }
      const migrated = validPair(legacy) ? { ...legacy, id: crypto.randomUUID() } : null
      localStorage.setItem(authStorageKey, JSON.stringify(migrated))
      return migrated
    } catch { return null }
  }
  const session = shallowRef<AuthSession | null>(readSession())
  const user = ref<User | null>(session.value ? decodeUser(session.value.token) : null)
  const token = computed(() => session.value?.token ?? null)
  const refreshToken = computed(() => session.value?.refreshToken ?? null)
  const sessionId = computed(() => session.value?.id ?? null)
  const isAuthenticated = computed(() => !!session.value && !!user.value)

  function removeLegacyKeys() {
    for (const key of ['token', 'refreshToken', 'deviceId']) localStorage.removeItem(key)
  }
  removeLegacyKeys()

  function syncFromStorage() {
    const stored = readSession()
    if (JSON.stringify(stored) === JSON.stringify(session.value)) return
    session.value = stored
    user.value = stored ? decodeUser(stored.token) : null
  }
  function getSession() {
    syncFromStorage()
    return session.value
  }
  function publish(next: AuthSession | null) {
    // Publish both credentials atomically before notifying local watchers.
    localStorage.setItem(authStorageKey, JSON.stringify(next))
    user.value = next ? decodeUser(next.token) : null
    session.value = next
    removeLegacyKeys()
  }
  function login(nextToken: string, nextRefreshToken: string) {
    const pair = { token: nextToken, refreshToken: nextRefreshToken }
    if (!validPair(pair)) throw new Error('Invalid authentication response.')
    publish({ ...pair, id: crypto.randomUUID() })
  }
  function refresh(expected: AuthSession, pair: TokenPair): boolean {
    const current = getSession()
    if (!current || current.id !== expected.id || current.refreshToken !== expected.refreshToken) return false
    if (!validPair(pair)) throw new Error('Invalid authentication response.')
    publish({ ...pair, id: current.id })
    return true
  }
  function logout(expected?: AuthSession): boolean {
    const current = getSession()
    if (expected && (!current || current.id !== expected.id || current.refreshToken !== expected.refreshToken)) return false
    publish(null)
    return true
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === authStorageKey || event.key === null) syncFromStorage()
  }
  window.addEventListener('storage', onStorage)
  onScopeDispose(() => window.removeEventListener('storage', onStorage))

  return { token, refreshToken, sessionId, user, isAuthenticated, getSession, login, logout, refresh, syncFromStorage }
})
