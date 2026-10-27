import { ApiError } from '@/models/errorModel'
import { getGraphqlErrors } from './auth'

// GraphQL business errors keep the same status and confirmation data as REST.
// This preserves the existing reservation/debt confirmation flows in sale forms.
export async function operationRequest<T>(request: Promise<T>): Promise<T> {
  try { return await request } catch (error) {
    const errors = getGraphqlErrors(error)
    const business = errors.find(item => typeof item.extensions?.status === 'number')
    if (!business) throw error
    const extension = business.extensions!
    throw new ApiError({
      type: String(extension.code ?? ''), title: String(extension.title ?? business.message),
      detail: business.message, status: Number(extension.status),
      instance: '', traceId: String(extension.traceId ?? ''),
      errorRelatedData: extension.errorRelatedData,
      validationErrors: Array.isArray(extension.validationErrors) ? extension.validationErrors
        .filter((value): value is Record<string, unknown> => value !== null && typeof value === 'object')
        .map(value => ({ propertyName: String(value.propertyName ?? ''), errorMessage: String(value.errorMessage ?? ''), attemptedValue: String(value.attemptedValue ?? '') })) : undefined,
    })
  }
}
