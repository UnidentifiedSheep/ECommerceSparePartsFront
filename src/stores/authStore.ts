import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'

interface User {
  id: string
  userName?: string
  email?: string
  name?: string
  surname?: string
  roles?: string[]
  permissions?: string[]
}

interface JwtPayload {
  sub?: string
  unique_name?: string
  email?: string
  given_name?: string
  family_name?: string
  role?: string | string[]
  permission?: string | string[]
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const deviceId = ref<string | null>(localStorage.getItem('deviceId'))
  const user = ref<User | null>(token.value ? decodeUser(token.value) : null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  const login = (nToken: string, nRefreshToken: string, nDeviceId: string) => {
    if (loading.value) return
    loading.value = true
    try {
      user.value = decodeUser(nToken)
      token.value = nToken
      refreshToken.value = nRefreshToken
      deviceId.value = nDeviceId

      localStorage.setItem('token', nToken)
      localStorage.setItem('refreshToken', nRefreshToken)
      localStorage.setItem('deviceId', nDeviceId)
    } finally {
      loading.value = false
    }
  }

  const refresh = (nToken: string, nRefreshToken: string) => {
    if (loading.value) return
    if (!isAuthenticated.value) throw Error(`to refresh token, firstly login.`)
    loading.value = true
    try {
      token.value = nToken
      refreshToken.value = nRefreshToken
      user.value = decodeUser(token.value)

      localStorage.setItem('token', token.value)
      localStorage.setItem('refreshToken', refreshToken.value)
    } finally {
      loading.value = false
    }
  }

  function decodeUser(jwt: string): User | null {
    try {
      const payload = jwtDecode<JwtPayload>(jwt)
      const roles = Array.isArray(payload.role)
        ? payload.role
        : payload.role ? [payload.role] : []
      const permissions = Array.isArray(payload.permission)
        ? payload.permission
        : payload.permission ? [payload.permission] : []

      return {
        id: payload.sub ?? '',
        userName: payload.unique_name,
        email: payload.email,
        name: payload.given_name,
        surname: payload.family_name,
        roles,
        permissions,
      }
    } catch {
      return null
    }
  }

  const logout = () => {
    token.value = null
    refreshToken.value = null
    deviceId.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('deviceId')
  }

  return {
    token,
    refreshToken,
    deviceId,
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refresh
  }
})
