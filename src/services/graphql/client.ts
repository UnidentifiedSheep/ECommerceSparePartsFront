import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { apiBaseUrl } from '@/services/api/api.ts'
import { requireSameSession } from '@/services/auth/session'
import type { AuthSession } from '@/services/auth/types'
import { useAuthStore } from '@/stores/authStore.ts'
import { getAcceptLanguage } from '@/i18n'
import { isGraphqlAuthError, goToLogin, refreshGraphqlSession } from './auth.ts'

export const graphqlUrl = (import.meta.env.VITE_GRAPHQL_API_URL || `${apiBaseUrl}/graphql`).replace(/\/$/, '')

const httpLink = new HttpLink({ uri: graphqlUrl })

const authLink = setContext((_, { headers, authSession }) => {
  if (authSession) requireSameSession(authSession)
  const session = useAuthStore().getSession()
  return {
    authSession: session,
    headers: {
      ...headers,
      'Accept-Language': getAcceptLanguage(),
      Authorization: session ? `Bearer ${session.token}` : undefined,
    },
  }
})

// Drop responses from a signed-out or replaced session before Apollo can cache them.
const sessionResponseLink = new ApolloLink((operation, forward) => new Observable((observer) => {
  const session = operation.getContext().authSession as AuthSession | null
  return forward(operation).subscribe({
    next: (result) => {
      try { if (session) requireSameSession(session); observer.next(result) }
      catch (error) { observer.error(error) }
    },
    error: (error) => {
      try { if (session) requireSameSession(session); observer.error(error) }
      catch (changed) { observer.error(changed) }
    },
    complete: () => observer.complete(),
  })
}))

const authErrorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const unauthorized = isGraphqlAuthError(graphQLErrors)
    || (networkError && 'statusCode' in networkError && networkError.statusCode === 401)
  const failedSession = operation.getContext().authSession as AuthSession | null
  if (!unauthorized || !failedSession || operation.getContext().authRetried) return

  operation.setContext({ authRetried: true })

  return new Observable((observer) => {
    let active = true
    let retrySubscription: { unsubscribe(): void } | undefined

    void refreshGraphqlSession(failedSession)
      .then((session) => {
        if (!active) return
        operation.setContext({ authSession: session })
        retrySubscription = forward(operation).subscribe({
          next: (result) => {
            if (isGraphqlAuthError(result.errors)) goToLogin(operation.getContext().authSession as AuthSession)
            observer.next(result)
          },
          error: (error) => {
            if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
              goToLogin(operation.getContext().authSession as AuthSession)
            }
            observer.error(error)
          },
          complete: () => observer.complete(),
        })
      })
      .catch((error: unknown) => {
        if (!active) return
        observer.error(error)
      })

    return () => {
      active = false
      retrySubscription?.unsubscribe()
    }
  })
})

export const graphqlClient = new ApolloClient({
  link: ApolloLink.from([authErrorLink, authLink, sessionResponseLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Product: { keyFields: ['id'] },
      Producer: { keyFields: ['id'] },
      Storage: { keyFields: ['code'] },
      StorageContent: { keyFields: ['id'] },
    },
  }),
  devtools: { enabled: import.meta.env.DEV },
})
