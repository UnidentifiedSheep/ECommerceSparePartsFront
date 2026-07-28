import axios, { AxiosHeaders, type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore.ts'
import { ApiError, type ErrorResponse } from '@/models/errorModel.ts'
import { getCurrentLocale } from '@/i18n'

export interface RefreshRequest {
  refreshToken: string
  deviceId: string
}

export interface RefreshResponse {
  token: string
  refreshToken: string
}

export function clampPageSize(value: number): number {
  return Math.min(Math.max(value, 1), 100)
}

let authStore: ReturnType<typeof useAuthStore> | null = null
let refreshPromise: Promise<RefreshResponse> | null = null
const authRefreshLockName = 'ecom-auth-refresh'
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
export const analyticsApiPrefix = '/analytics'

function initAuthStore(): ReturnType<typeof useAuthStore> {
  if (authStore === null) {
    authStore = useAuthStore()
  }
  return authStore
}

async function refreshAccessToken(req: RefreshRequest): Promise<RefreshResponse> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResponse>(`${api.defaults.baseURL}/main/auth/refresh`, req)
      .then((response) => response.data)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

function isRefreshRequest(config?: InternalAxiosRequestConfig): boolean {
  return Boolean(config?.url?.includes('/auth/refresh'))
}

function markRetried(config: InternalAxiosRequestConfig & { _retry?: boolean }) {
  config._retry = true
}

function setAuthHeader(config: InternalAxiosRequestConfig, token: string) {
  if (!config.headers) {
    config.headers = new AxiosHeaders()
  }

  config.headers.set('Authorization', `Bearer ${token}`)
}

function requestAccessToken(config: InternalAxiosRequestConfig): string | null {
  const authorization = config.headers?.get?.('Authorization')
    ?? config.headers?.get?.('authorization')
    ?? config.headers?.Authorization

  if (typeof authorization !== 'string') return null
  return authorization.replace(/^Bearer\s+/i, '') || null
}

async function refreshAccessTokenAcrossTabs(
  failedAccessToken: string | null,
): Promise<RefreshResponse> {
  const refreshOrReuseSession = async (): Promise<RefreshResponse> => {
    const store = initAuthStore()
    store.syncFromStorage()

    if (
      failedAccessToken
      && store.token
      && store.token !== failedAccessToken
      && store.refreshToken
    ) {
      return {
        token: store.token,
        refreshToken: store.refreshToken,
      }
    }

    if (!store.refreshToken || !store.deviceId) {
      throw new Error('Authentication session is unavailable.')
    }

    return refreshAccessToken({
      refreshToken: store.refreshToken,
      deviceId: store.deviceId,
    })
  }

  if (navigator.locks) {
    return navigator.locks.request(authRefreshLockName, refreshOrReuseSession)
  }

  return refreshOrReuseSession()
}

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const store = initAuthStore()
    config.headers.set?.('Accept-Language', getCurrentLocale())
    if (!config.headers.set) {
      config.headers['Accept-Language'] = getCurrentLocale()
    }
    if (store.isAuthenticated) {
      config.headers.Authorization = `Bearer ${store.token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (
      error.response?.status === 401
      && originalRequest
      && !originalRequest._retry
      && !isRefreshRequest(originalRequest)
    ) {
      const store = initAuthStore()

      markRetried(originalRequest)
      const failedAccessToken = requestAccessToken(originalRequest)

      try {
        const response = await refreshAccessTokenAcrossTabs(failedAccessToken)

        store.refresh(response.token, response.refreshToken)
        api.defaults.headers.common.Authorization = `Bearer ${response.token}`
        setAuthHeader(originalRequest, response.token)

        return api(originalRequest)
      } catch (refreshError) {
        store.syncFromStorage()
        if (
          failedAccessToken
          && store.token
          && store.token !== failedAccessToken
        ) {
          setAuthHeader(originalRequest, store.token)
          return api(originalRequest)
        }

        store.logout()
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.data) {
      throw new ApiError(error.response.data as ErrorResponse)
    }

    throw new Error(error.message || 'Unknown API error')
  },
)

export default api
