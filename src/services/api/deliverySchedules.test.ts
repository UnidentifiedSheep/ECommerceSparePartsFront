import { beforeEach, describe, expect, it, vi } from 'vitest'
import { graphqlClient } from '@/services/graphql/client'
import { getDeliverySchedules, saveDeliverySchedule, deleteDeliverySchedule, changeDeliveryException } from './deliverySchedules'
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
vi.mock('./api', () => ({ clampPageSize: (x: number) => Math.min(100, Math.max(1, x)) }))
vi.mock('@/i18n', () => ({ t: (key: string) => key }))
beforeEach(() => vi.resetAllMocks())
const row = { supplier: 'ARMTEK' as const, storageCode: 'SUPPLIER', days: ['MONDAY' as const], exceptions: ['2026-12-01'] }
describe('delivery schedule GraphQL contracts', () => {
  it('filters by supplier and code with zero-based paging', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { deliverySchedules: { search: [row] } } } as never)
    expect(await getDeliverySchedules({ suppliers: ['ARMTEK'], storageCode: ' SUPPLIER ', page: 1, size: 500 })).toEqual([row])
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toEqual({ input: { suppliers: ['ARMTEK'], storageCode: 'SUPPLIER', pagination: { page: 1, size: 100 } } })
  })
  it('creates, updates and removes a schedule by supplier and code', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { deliverySchedules: { create: row } } } as never)
    expect(await saveDeliverySchedule({ ...row, storageCode: ' SUPPLIER ' }, false)).toEqual(row)
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { deliverySchedules: { update: row } } } as never)
    await saveDeliverySchedule({ supplier: row.supplier, storageCode: row.storageCode, days: ['FRIDAY'] }, true)
    expect(vi.mocked(graphqlClient.mutate).mock.calls[1]![0].variables).toEqual({ input: { supplier: 'ARMTEK', storageCode: 'SUPPLIER', days: ['FRIDAY'] } })
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { deliverySchedules: { delete: true } } } as never)
    await deleteDeliverySchedule(row.supplier, row.storageCode)
    expect(vi.mocked(graphqlClient.mutate).mock.calls[2]![0].variables).toEqual({ supplier: 'ARMTEK', storageCode: 'SUPPLIER' })
  })
  it('keeps exception dates as calendar dates without converting them to UTC instants', async () => {
    const input = { supplier: row.supplier, storageCode: 'SUPPLIER', date: '2026-12-01' }
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { deliverySchedules: { addException: row } } } as never)
    await changeDeliveryException(input, true)
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables).toEqual({ input })
    vi.mocked(graphqlClient.mutate).mockResolvedValueOnce({ data: { deliverySchedules: { removeException: row } } } as never)
    await changeDeliveryException(input, false)
    expect(vi.mocked(graphqlClient.mutate).mock.calls[1]![0].variables).toEqual({ input })
  })
})
