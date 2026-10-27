import { getGraphqlErrors } from '@/services/graphql/auth'

export type DataLoadErrorKind = 'forbidden' | 'failed'

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined
}

export function classifyDataLoadError(error: unknown): DataLoadErrorKind {
  const cause = record(error)
  const statuses = [cause?.status, cause?.statusCode, record(cause?.response)?.status,
    record(cause?.networkError)?.statusCode]
  const denied = getGraphqlErrors(error).some(({ extensions }) => (
    Number(extensions?.status) === 403
    || ['AUTH_NOT_AUTHORIZED', 'FORBIDDEN'].includes(String(extensions?.code))
  ))
  return denied || statuses.some(status => Number(status) === 403) ? 'forbidden' : 'failed'
}
