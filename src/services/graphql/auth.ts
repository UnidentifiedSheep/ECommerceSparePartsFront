import { refreshAuthSession } from '@/services/auth/session'
import type { AuthSession } from '@/services/auth/types'
import { useAuthStore } from '@/stores/authStore.ts'

export interface GraphqlError {
  message: string
  extensions?: Record<string, unknown>
}

export function getGraphqlErrors(cause: unknown): GraphqlError[] {
  if (Array.isArray(cause)) {
    return cause.filter((error): error is GraphqlError => (
      Boolean(error) && typeof error === 'object' && typeof error.message === 'string'
    ))
  }
  if (cause && typeof cause === 'object') {
    if ('graphQLErrors' in cause) return getGraphqlErrors(cause.graphQLErrors)
    if ('errors' in cause) return getGraphqlErrors(cause.errors)
  }
  return []
}

export function isGraphqlAuthError(errors: readonly GraphqlError[] | undefined): boolean {
  return errors?.some((error) => (
    error.extensions?.code === 'AUTH_NOT_AUTHENTICATED'
    || error.extensions?.code === 'UNAUTHENTICATED'
  )) ?? false
}

export function goToLogin(expected: AuthSession) {
  useAuthStore().logout(expected)
}

export const refreshGraphqlSession = refreshAuthSession
