import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { apiBaseUrl } from '@/services/api/api.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import { getCurrentLocale } from '@/i18n'
import { isGraphqlAuthError, goToLogin, refreshGraphqlSession } from './auth.ts'

export const graphqlUrl = (import.meta.env.VITE_GRAPHQL_API_URL || `${apiBaseUrl}/graphql`).replace(/\/$/, '')

const httpLink = new HttpLink({ uri: graphqlUrl })

const authLink = setContext((_, { headers }) => {
  const auth = useAuthStore()
  return {
    authAccessToken: auth.token,
    headers: {
      ...headers,
      'Accept-Language': getCurrentLocale(),
      ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
  }
})

const authErrorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const unauthorized = isGraphqlAuthError(graphQLErrors)
    || (networkError && 'statusCode' in networkError && networkError.statusCode === 401)
  if (!unauthorized || operation.getContext().authRetried) return

  operation.setContext({ authRetried: true })
  const failedToken = operation.getContext().authAccessToken as string | null

  return new Observable((observer) => {
    let active = true
    let retrySubscription: { unsubscribe(): void } | undefined

    void refreshGraphqlSession(failedToken)
      .then(() => {
        if (!active) return
        retrySubscription = forward(operation).subscribe({
          next: (result) => {
            if (isGraphqlAuthError(result.errors)) goToLogin()
            observer.next(result)
          },
          error: (error) => {
            if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 401) {
              goToLogin()
            }
            observer.error(error)
          },
          complete: () => observer.complete(),
        })
      })
      .catch((error: unknown) => {
        if (!active) return
        goToLogin()
        observer.error(error)
      })

    return () => {
      active = false
      retrySubscription?.unsubscribe()
    }
  })
})

export const graphqlClient = new ApolloClient({
  link: ApolloLink.from([authErrorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Product: { keyFields: ['id'] },
      Producer: { keyFields: ['id'] },
      Storage: { keyFields: ['code'] },
      StorageContent: { keyFields: ['id'] },
    },
  }),
  connectToDevTools: import.meta.env.DEV,
})
