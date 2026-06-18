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
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
export const analyticsApiPrefix = '/analytics'

function initAuthStore() {
  if (authStore === null) {
    authStore = useAuthStore()
  }
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

const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    initAuthStore()
    config.headers.set?.('Accept-Language', getCurrentLocale())
    if (!config.headers.set) {
      config.headers['Accept-Language'] = getCurrentLocale()
    }
    if (authStore?.isAuthenticated) {
      config.headers.Authorization = `Bearer ${authStore.token}`
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
      initAuthStore()

      if (!authStore?.refreshToken || !authStore.deviceId) {
        return Promise.reject(error)
      }

      markRetried(originalRequest)

      const req: RefreshRequest = {
        refreshToken: authStore.refreshToken,
        deviceId: authStore.deviceId,
      }

      try {
        const response = await refreshAccessToken(req)

        authStore.refresh(response.token, response.refreshToken)
        api.defaults.headers.common.Authorization = `Bearer ${response.token}`
        setAuthHeader(originalRequest, response.token)

        return api(originalRequest)
      } catch (refreshError) {
        authStore.logout()
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
