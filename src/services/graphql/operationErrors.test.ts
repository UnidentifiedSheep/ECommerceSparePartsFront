import { describe, expect, it, vi } from 'vitest'
import { operationRequest } from './operationErrors'
import { ApiError } from '@/models/errorModel'

vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))

describe('GraphQL operation errors', () => {
  it('preserves reservation confirmation data for the existing sale retry flow', async () => {
    const related = { confirmationCode: 'confirmation-test', reserved: { 'ABC-1': 2 } }
    const rejection = { graphQLErrors: [{ message: 'Confirm reserved items', extensions: { status: 428, code: 'SaleSoftConfirmationNeededException', errorRelatedData: related } }] }
    try { await operationRequest(Promise.reject(rejection)); expect.unreachable() } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ status: 428, errorRelatedData: related, message: 'Confirm reserved items' })
    }
  })
  it('preserves optimistic concurrency failures instead of treating them as successful updates', async () => {
    const rejection = { graphQLErrors: [{ message: 'The document has changed', extensions: { status: 409 } }] }
    await expect(operationRequest(Promise.reject(rejection))).rejects.toMatchObject({ status: 409 })
  })
  it('preserves field validation messages returned in GraphQL extensions', async () => {
    const rejection = { graphQLErrors: [{ message: 'Validation failed', extensions: { status: 400, validationErrors: [{ propertyName: 'Contents[0].Price', errorMessage: 'Price must be positive', attemptedValue: 0 }] } }] }
    await expect(operationRequest(Promise.reject(rejection))).rejects.toMatchObject({ status: 400, message: 'Price must be positive', validationErrors: [{ propertyName: 'Contents[0].Price', errorMessage: 'Price must be positive', attemptedValue: '0' }] })
  })
  it('leaves network/session/authentication errors intact', async () => {
    const failure = new Error('Network offline')
    await expect(operationRequest(Promise.reject(failure))).rejects.toBe(failure)
    const unauthorized = { graphQLErrors: [{ message: 'Unauthorized', extensions: { code: 'AUTH_NOT_AUTHENTICATED' } }] }
    await expect(operationRequest(Promise.reject(unauthorized))).rejects.toBe(unauthorized)
  })
})
