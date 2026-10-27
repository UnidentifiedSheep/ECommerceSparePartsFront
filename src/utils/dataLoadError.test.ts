import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/models/errorModel'
import { classifyDataLoadError } from './dataLoadError'

vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))

describe('classifyDataLoadError', () => {
  it('recognizes forbidden REST, HTTP and GraphQL responses without relying on message text', () => {
    const forbidden = [
      new ApiError({ status: 403, type: '', title: 'Technical details', instance: '', traceId: '' }),
      { response: { status: 403 } },
      { networkError: { statusCode: 403 } },
      { graphQLErrors: [{ message: 'Technical details', extensions: { code: 'AUTH_NOT_AUTHORIZED' } }] },
      { graphQLErrors: [{ message: 'Technical details', extensions: { code: 'FORBIDDEN' } }] },
      { errors: [{ message: 'Technical details', extensions: { status: 403 } }] },
    ]
    forbidden.forEach(error => expect(classifyDataLoadError(error)).toBe('forbidden'))
  })

  it('keeps network and server failures retryable without confusing authentication with missing permissions', () => {
    const failures = [
      new Error('Failed to fetch'), { status: 500 }, null,
      { graphQLErrors: [{ message: 'Execution failed', extensions: { status: 500 } }] },
      { graphQLErrors: [{ message: 'Unauthorized', extensions: { code: 'AUTH_NOT_AUTHENTICATED' } }] },
    ]
    failures.forEach(error => expect(classifyDataLoadError(error)).toBe('failed'))
  })
})
