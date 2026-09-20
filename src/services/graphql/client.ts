import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { apiBaseUrl, refreshAuthSession } from '@/services/api/api.ts'
import { useAuthStore } from '@/stores/authStore.ts'

const graphqlUrl = (import.meta.env.VITE_GRAPHQL_API_URL || `${apiBaseUrl}/graphql`).replace(/\/$/, '')

const httpLink = new HttpLink({ uri: graphqlUrl })

const authLink = setContext((_, { headers }) => {
  const auth = useAuthStore()
  return {
    authAccessToken: auth.token,
    headers: {
      ...headers,
      ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
  }
})

function isAuthError(errors: readonly { extensions?: { code?: unknown } }[] | undefined): boolean {
  return errors?.some((error) => error.extensions?.code === 'AUTH_NOT_AUTHENTICATED') ?? false
}

function goToLogin() {
  useAuthStore().logout()
  void import('@/router').then(({ default: router }) => router.replace({ name: 'auth' }))
}

const authErrorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const unauthorized = isAuthError(graphQLErrors)
    || (networkError && 'statusCode' in networkError && networkError.statusCode === 401)
  if (!unauthorized || operation.getContext().authRetried) return

  operation.setContext({ authRetried: true })
  const failedToken = operation.getContext().authAccessToken as string | null

  return new Observable((observer) => {
    let active = true
    let retrySubscription: { unsubscribe(): void } | undefined

    void refreshAuthSession(failedToken)
      .then(() => {
        if (!active) return
        retrySubscription = forward(operation).subscribe({
          next: (result) => {
            if (isAuthError(result.errors)) goToLogin()
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
