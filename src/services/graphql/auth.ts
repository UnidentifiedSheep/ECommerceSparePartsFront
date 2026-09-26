import { refreshAuthSession } from '@/services/api/api.ts'
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

export function goToLogin() {
  useAuthStore().logout()
  void import('@/router').then(({ default: router }) => router.replace({ name: 'auth' }))
}

export async function refreshGraphqlSession(token: string | null) {
  try {
    return await refreshAuthSession(token)
  } catch (cause) {
    if (!useAuthStore().token) goToLogin()
    throw cause
  }
}
