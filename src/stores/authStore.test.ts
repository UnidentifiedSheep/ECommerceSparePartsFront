import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore, authStorageKey } from './authStore'
import { jwt, setupBrowser, cleanupBrowser } from '@/services/auth/testSupport'

beforeEach(setupBrowser)
afterEach(cleanupBrowser)
describe('session storage', () => {
  it('migrates existing credentials without requiring deviceId', () => {
    localStorage.setItem('token', jwt()); localStorage.setItem('refreshToken', 'legacy-refresh'); localStorage.setItem('deviceId', 'legacy-device')
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.refreshToken).toBe('legacy-refresh')
    expect(auth.user?.permissions).toEqual(['USERS_GET'])
    expect(JSON.parse(localStorage.getItem(authStorageKey)!)).toMatchObject({ token: jwt(), refreshToken: 'legacy-refresh' })
    for (const key of ['token', 'refreshToken', 'deviceId']) expect(localStorage.getItem(key)).toBeNull()
  })
  it('publishes credentials atomically and preserves session identity during rotation', () => {
    const auth = useAuthStore(); auth.login(jwt(), 'first')
    const before = auth.getSession()!
    expect(auth.refresh(before, { token: jwt(), refreshToken: 'second' })).toBe(true)
    expect(auth.sessionId).toBe(before.id)
    expect(JSON.parse(localStorage.getItem(authStorageKey)!)).toEqual(auth.getSession())
  })
  it('does not let a late update or logout change a new login', () => {
    const auth = useAuthStore(); auth.login(jwt(), 'first'); const before = auth.getSession()!
    auth.logout(); auth.login(jwt('user-2'), 'second')
    expect(auth.refresh(before, { token: jwt(), refreshToken: 'late' })).toBe(false)
    expect(auth.logout(before)).toBe(false)
    expect(auth.user?.id).toBe('user-2')
  })
  it('does not revive a logged-out session from old storage keys', () => {
    const auth = useAuthStore(); auth.login(jwt(), 'first'); auth.logout()
    localStorage.setItem('token', jwt()); localStorage.setItem('refreshToken', 'stale')
    auth.syncFromStorage()
    expect(auth.getSession()).toBeNull()
  })
})
