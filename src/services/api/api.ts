import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore.ts'
import { ApiError, type ErrorResponse } from '@/models/errorModel.ts'
import { getAcceptLanguage } from '@/i18n'
import { refreshAuthSession, requireSameSession } from '@/services/auth/session'
import { SessionChangedError, type AuthSession } from '@/services/auth/types'
import { apiBaseUrl } from './config'

export { apiBaseUrl } from './config'
export const analyticsApiPrefix = '/analytics'
export function clampPageSize(value: number) { return Math.min(Math.max(value, 1), 100) }

type AuthRequest = InternalAxiosRequestConfig & { authSession?: AuthSession | null; authRetried?: boolean }
function publicAuthRequest(config: InternalAxiosRequestConfig) {
  const path = new URL(config.url ?? '', apiBaseUrl).pathname.replace(/\/$/, '')
  return /^\/main\/auth\/(login|refresh|register|password\/(recovery|reset)|usernames\/.*\/availability)$/.test(path)
}
function assertResponseSession(config?: AuthRequest) {
  if (config?.authSession) requireSameSession(config.authSession)
}

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl, timeout: 10000,
  paramsSerializer: { indexes: null },
  headers: { 'Content-Type': 'application/json' },
})
api.interceptors.request.use((config: AuthRequest) => {
  const store = useAuthStore()
  // Do not replay a queued/retried operation under a different user's credentials.
  if (config.authSession) requireSameSession(config.authSession)
  config.authSession = publicAuthRequest(config) ? null : store.getSession()
  config.headers.set('Accept-Language', getAcceptLanguage())
  config.headers.delete('Authorization')
  if (config.authSession) config.headers.set('Authorization', `Bearer ${config.authSession.token}`)
  return config
})
api.interceptors.response.use((response) => {
  assertResponseSession(response.config)
  return response
}, async (error: AxiosError) => {
  const original = error.config as AuthRequest | undefined
  assertResponseSession(original)
  if (error.response?.status === 401 && original?.authSession) {
    if (original.authRetried) {
      // Ignore a late rejection of credentials already replaced by another refresh.
      useAuthStore().logout(original.authSession)
    } else {
      original.authRetried = true
      await refreshAuthSession(original.authSession)
      return api(original)
    }
  }
  if (error instanceof SessionChangedError) throw error
  if (error.response?.data) throw new ApiError(error.response.data as ErrorResponse)
  throw new Error(error.message || 'Unknown API error')
})
export default api
