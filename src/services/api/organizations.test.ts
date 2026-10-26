import { beforeEach, describe, expect, it, vi } from 'vitest'
import { graphqlClient } from '@/services/graphql/client'
import { getOrganizationMembers, getOrganizations, updateOrganization, createOrganization, getOrganizationFinancialInfo, updateOrganizationFinancialInfo, getOrganizationById } from './organizations'

vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
vi.mock('./api', () => ({ clampPageSize: (value: number) => Math.min(Math.max(value, 1), 100) }))
const org = { id: 'org-1', type: 'BUSINESS', name: 'ACME', systemName: 'acme', isHidden: false, approximateBalanceInBaseCurrency: 10, owner: { id: 'user-1', userName: 'owner', info: { name: 'Alice', surname: 'Smith' } } }
beforeEach(() => { vi.mocked(graphqlClient.query).mockReset(); vi.mocked(graphqlClient.mutate).mockReset() })

describe('GraphQL organizations', () => {
  it.each([10, 20, 30, 40, 50, 100])('sends server pagination with size %i, enums, search and sorting', async limit => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { organizations: { list: [org] } } } as never)
    const result = await getOrganizations({ page: 2, limit, searchTerm: ' ACME ', types: ['Business'], showHidden: true, sortBy: ['name_desc', '-systemName', 'id_asc'] })
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0]).toMatchObject({ fetchPolicy: 'no-cache', variables: { input: { pagination: { page: 2, size: limit }, searchTerm: 'ACME', types: ['BUSINESS'], showHidden: true, sortBy: [{ field: 'name', isDescending: true }, { field: 'systemName', isDescending: true }, { field: 'id', isDescending: false }] } } })
    expect(result.organizations[0]).toMatchObject({ type: 'Business', owner: { organizationId: org.id, role: 'Owner', user: { id: 'user-1', name: 'Alice' } } })
  })
  it('paginates members and restores membership shape', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { organizations: { byId: { members: [{ role: 'MANAGER', user: org.owner }] } } } } as never)
    const result = await getOrganizationMembers({ organizationId: org.id, page: 1, limit: 50 })
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toEqual({ id: org.id, input: { pagination: { page: 1, size: 50 } } })
    expect(result.members[0]).toMatchObject({ organizationId: org.id, role: 'Manager', user: { name: 'Alice' } })
  })
  it('preserves omitted patch fields and explicit false values', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { organizations: { update: org } } } as never)
    await updateOrganization(org.id, { isHidden: false })
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables!.input).toEqual({ organizationId: org.id, isHidden: { isSet: true, value: false } })
  })
  it('uses ownerId on creation', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { organizations: { create: org } } } as never)
    await createOrganization({ ownerUserId: 'user-1', name: 'ACME', systemName: 'acme' })
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables!.input).toEqual({ ownerId: 'user-1', name: 'ACME', systemName: 'acme' })
  })
  it('reads finances and updates a zero minimum balance', async () => {
    const finances = { financialProfile: { minimalAllowedBalance: 0, netPositionInBaseCurrency: 10 }, balances: [] }
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { organizations: { byId: { finances } } } } as never)
    expect(await getOrganizationFinancialInfo(org.id)).toEqual(finances)
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: {} } as never)
    await updateOrganizationFinancialInfo(org.id, 0)
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables!.input).toEqual({ organizationId: org.id, minimalAllowedBalance: { isSet: true, value: 0 } })
  })
  it('returns no selection for a missing organization instead of crashing the mapper', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { organizations: { byId: null } } } as never)
    expect(await getOrganizationById('missing')).toBeUndefined()
  })
})
