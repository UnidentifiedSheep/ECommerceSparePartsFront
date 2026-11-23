import { beforeEach, describe, expect, it, vi } from 'vitest'
import { print } from 'graphql'
import { graphqlClient } from './client'
import { salesListDocumentRequest, createSalesListDocumentRequest, getDocumentById } from './documents'
vi.mock('./client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
vi.mock('@/i18n', () => ({ t: (key: string) => key, getAcceptLanguage: () => 'ru' }))
beforeEach(() => vi.resetAllMocks())
describe('sales list document', () => {
  it('passes the same sales filters in UTC without any paging or sorting fields', () => {
    const filters = { page: 4, limit: 20, sortBy: ['-dateTime'], rangeStartDate: '2026-11-23T13:00:00+03:00', organizationIds: ['organization'], currencyIds: [1, 2], productIds: [3], states: ['Completed' as const], searchTerm: ' filter ' }
    const payload = salesListDocumentRequest(filters)
    expect(payload).toMatchObject({ documentType: 'Excel', culture: 'ru', rangeStartDate: '2026-11-23T10:00:00.000Z', organizationIds: ['organization'], currencyIds: [1, 2], productIds: [3], states: ['Completed'], searchTerm: 'filter' })
    expect(payload).not.toHaveProperty('page'); expect(payload).not.toHaveProperty('limit'); expect(payload).not.toHaveProperty('sortBy')
    filters.organizationIds.push('later')
    expect(payload.organizationIds).toEqual(['organization'])
  })
  it('creates the supported Excel template and keeps the nested job relation nullable', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { documents: { available: [{ systemName: 'SalesList', supportedDocumentTypes: ['EXCEL'] }] } } } as never)
    const request = { requestId: 'doc', job: null, status: 'PENDING' }
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { documents: { createGenerationRequest: request } } } as never)
    expect(await createSalesListDocumentRequest({ searchTerm: 'part' })).toEqual(request)
    const call = vi.mocked(graphqlClient.mutate).mock.calls[0]![0]
    expect(call.variables?.input.documentSystemName).toBe('SalesList')
    expect(JSON.parse(call.variables!.input.documentRequest)).toMatchObject({ documentType: 'Excel', searchTerm: 'part' })
    expect(print(call.mutation)).toContain('job {')
    expect(print(call.mutation)).not.toMatch(/\bjobId\b/)
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { documents: { byId: request } } } as never)
    expect((await getDocumentById('doc'))?.job).toBeNull()
  })
  it('does not create a task when the template is not available', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { documents: { available: [] } } } as never)
    await expect(createSalesListDocumentRequest({})).rejects.toThrow('documents.salesListUnavailable')
    expect(graphqlClient.mutate).not.toHaveBeenCalled()
  })
})
