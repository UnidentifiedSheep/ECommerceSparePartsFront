import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './api.ts'
import { getOrganizationMembers, getOrganizations } from './organizations.ts'

vi.mock('./api.ts', () => ({
  default: { get: vi.fn() },
  clampPageSize: (value: number) => Math.min(Math.max(value, 1), 100),
}))

beforeEach(() => vi.mocked(api.get).mockReset())

describe('organization pagination API contract', () => {
  it.each([10, 20, 30, 40, 50, 100])('requests %i organizations through the size parameter', async (limit) => {
    vi.mocked(api.get).mockResolvedValue({ data: { organizations: [] } })
    await getOrganizations({ page: 2, limit, searchTerm: ' ACME ', types: ['Business'], showHidden: true, sortBy: ['name'] })
    const [url, config] = vi.mocked(api.get).mock.calls[0]!
    expect(url).toBe('/main/organizations')
    const params = config!.params as URLSearchParams
    expect(params.get('size')).toBe(String(limit))
    expect(params.has('limit')).toBe(false)
    expect(params.get('page')).toBe('2')
    expect(params.get('searchTerm')).toBe('ACME')
    expect(params.getAll('types')).toEqual(['Business'])
    expect(params.get('showHidden')).toBe('true')
    expect(params.getAll('sortBy')).toEqual(['name'])
  })

  it('uses size for organization members as required by the same backend pagination model', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { members: [] } })
    await getOrganizationMembers({ organizationId: 'organization-1', page: 1, limit: 50 })
    expect(api.get).toHaveBeenCalledWith('/main/organizations/organization-1/members', { params: { page: 1, size: 50 } })
  })

  it.each([[0, 1], [101, 100]])('clamps a requested size of %i to %i', async (limit, expected) => {
    vi.mocked(api.get).mockResolvedValue({ data: { organizations: [] } })
    await getOrganizations({ page: 0, limit })
    const params = vi.mocked(api.get).mock.calls[0]![1]!.params as URLSearchParams
    expect(params.get('size')).toBe(String(expected))
  })
})
