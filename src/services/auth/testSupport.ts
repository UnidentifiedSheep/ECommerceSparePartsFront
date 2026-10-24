// Browser primitives for auth unit tests; no credentials or external API calls.
import { vi } from 'vitest'
import { createPinia, setActivePinia, disposePinia } from 'pinia'
import type { Pinia } from 'pinia'

export function jwt(user = 'user-1', expires = Date.now() + 900000) {
  const encode = (value: unknown) => btoa(JSON.stringify(value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${encode({ alg: 'HS256' })}.${encode({ sub: user, unique_name: user, role: ['MEMBER'], permission: ['USERS_GET'], exp: Math.floor(expires / 1000) })}.signature`
}
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}
export async function flush() { for (let i = 0; i < 15; i++) await Promise.resolve() }
let pinia: Pinia | undefined
export function setupBrowser() {
  const entries = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key), clear: () => entries.clear(),
  })
  vi.stubGlobal('window', new EventTarget())
  vi.stubGlobal('navigator', { locks: { request: vi.fn(async (_: string, callback: () => Promise<unknown>) => await callback()) } })
  pinia = createPinia(); setActivePinia(pinia)
}
export function cleanupBrowser() { if (pinia) disposePinia(pinia); vi.unstubAllGlobals(); vi.restoreAllMocks() }
