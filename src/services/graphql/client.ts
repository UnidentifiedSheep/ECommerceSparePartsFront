import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { apiBaseUrl } from '@/services/api/api.ts'
import { useAuthStore } from '@/stores/authStore.ts'

const graphqlUrl = (import.meta.env.VITE_GRAPHQL_API_URL || `${apiBaseUrl}/graphql`).replace(/\/$/, '')

const httpLink = new HttpLink({ uri: graphqlUrl })

const authLink = setContext((_, { headers }) => {
  const auth = useAuthStore()
  return {
    headers: {
      ...headers,
      ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
  }
})

export const graphqlClient = new ApolloClient({
  link: authLink.concat(httpLink),
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

