import { beforeEach, describe, expect, it, vi } from 'vitest'
import { graphqlClient } from '@/services/graphql/client'
import { getUsers, getUserPreview, getUserFullInfo, createUser, addRoleToUser, removePermissionFromUser, getUserOrganizations, addEmailToUser } from './users'
import { ListUsersDocument, SearchUsersDocument, AddUserRolesDocument, RemoveUserPermissionsDocument, AddUserEmailDocument } from '@/graphql/generated/graphql'

const { permissions } = vi.hoisted(() => ({ permissions: { value: [] as string[] } }))
vi.mock('@/i18n', () => ({ t: (key: string) => key }))
vi.mock('@/services/graphql/client', () => ({ graphqlClient: { query: vi.fn(), mutate: vi.fn() } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ user: { permissions: permissions.value } }) }))
vi.mock('./api', () => ({ default: { get: vi.fn() }, clampPageSize: (size: number) => Math.min(100, Math.max(1, size)) }))
const user = { id: 'user-1', userName: 'alice', lastLoginAt: '2026-10-25T12:00:00Z', info: { name: 'Alice', surname: 'Smith', description: null } }
beforeEach(() => { vi.mocked(graphqlClient.query).mockReset(); vi.mocked(graphqlClient.mutate).mockReset(); permissions.value = [] })

describe('GraphQL users', () => {
  it('uses server pagination for general search and preserves role filters', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { users: { search: [user] } } } as never)
    const response = await getUsers({ page: 2, limit: 20, searchTerm: ' alice@example.com ', roles: ['MANAGER'] })
    expect(graphqlClient.query).toHaveBeenCalledWith({ query: SearchUsersDocument, variables: { input: { searchTerm: 'alice@example.com', roles: ['MANAGER'], pagination: { page: 2, size: 20 } } }, fetchPolicy: 'no-cache' })
    expect(response.users[0]).toMatchObject({ name: 'Alice', surname: 'Smith', lastLoginAt: user.lastLoginAt })
    expect(response.hasNext).toBe(false)
  })
  it('routes column filters to list, suppresses general search and never slices a server page', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { users: { list: Array(20).fill(user) } } } as never)
    const result = await getUsers({ page: 3, limit: 20, searchTerm: 'ignored', name: 'Alice', email: 'alice@example.com', roles: ['ADMIN'] })
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0]).toMatchObject({ query: ListUsersDocument, variables: { input: { pagination: { page: 3, size: 20 }, name: 'Alice', email: 'alice@example.com', roles: ['ADMIN'] } } })
    const input = vi.mocked(graphqlClient.query).mock.calls[0]![0].variables!.input
    expect(input).not.toHaveProperty('searchTerm')
    expect(input).not.toHaveProperty('searchMethod')
    expect(result.users).toHaveLength(20)
    expect(result.hasNext).toBe(true)
  })
  it('uses list for empty search and clamps page sizes', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { users: { list: [{ ...user, info: null }] } } } as never)
    const result = await getUsers({ page: 0, limit: 500, searchTerm: '   ' })
    expect(graphqlClient.query).toHaveBeenCalledWith(expect.objectContaining({ query: ListUsersDocument, variables: expect.objectContaining({ input: expect.objectContaining({ pagination: { page: 0, size: 100 } }) }) }))
    expect(result.users[0]?.name).toBe('alice')
  })
  it('loads only fields allowed by permissions and maps enums/objects for existing UI', async () => {
    permissions.value = ['users.info.get', 'USERS_STORAGES_GET']
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { users: { byId: { ...user, roles: [{ systemName: 'ADMIN' }], permissions: [{ systemName: 'users.get' }], emails: [{ email: 'a@b.com', emailType: 'WORK', confirmed: false, isPrimary: true }], phones: [{ number: '+123', type: 'MOBILE', isConfirmed: false, isPrimary: true }], storages: [{ code: 'A', type: 'SUPPLIER_STORAGE', location: null, description: null }] } } } } as never)
    const result = await getUserFullInfo(user.id, true)
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toEqual({ id: user.id, includeInfo: true, includeStorages: true })
    expect(result).toMatchObject({ roles: ['ADMIN'], permissions: ['users.get'], phones: [{ type: 'Mobile' }], emails: [{ emailType: 'Work' }], storages: [{ code: 'A', type: 'SupplierStorage' }] })
  })
  it('skips protected details without permission and handles a missing user', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValueOnce({ data: { users: { byId: user } } } as never).mockResolvedValueOnce({ data: { users: { byId: null } } } as never)
    const result = await getUserFullInfo(user.id, true)
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toEqual({ id: user.id, includeInfo: false, includeStorages: false })
    expect(result.roles).toEqual([])
    expect(result.storages).toEqual([])
    await expect(getUserFullInfo('missing')).rejects.toThrow('User not found')
  })
  it('creates with GraphQL enums and maps the returned user', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: { users: { create: user } } } as never)
    const result = await createUser({ userName: 'alice', password: 'secret', userInfo: { name: 'Alice', surname: 'Smith' }, emails: [{ email: 'a@b.com', type: 'Work', isConfirmed: false, isPrimary: true }], phones: [], roles: ['ADMIN'] })
    expect(vi.mocked(graphqlClient.mutate).mock.calls[0]![0].variables!.input.emails[0].type).toBe('WORK')
    expect(result.user.name).toBe('Alice')
  })
  it('uses array mutations for roles/permissions and type for an added email', async () => {
    vi.mocked(graphqlClient.mutate).mockResolvedValue({ data: {} } as never)
    await addRoleToUser({ userId: user.id, roleName: 'ADMIN' })
    await removePermissionFromUser({ userId: user.id, permission: 'users.get' })
    await addEmailToUser({ userId: user.id, email: 'a@b.com', emailType: 'Personal' })
    expect(graphqlClient.mutate).toHaveBeenCalledWith({ mutation: AddUserRolesDocument, variables: { input: { userId: user.id, roles: ['ADMIN'] } } })
    expect(graphqlClient.mutate).toHaveBeenCalledWith({ mutation: RemoveUserPermissionsDocument, variables: { input: { userId: user.id, permissions: ['users.get'] } } })
    expect(graphqlClient.mutate).toHaveBeenCalledWith({ mutation: AddUserEmailDocument, variables: { input: { userId: user.id, email: 'a@b.com', type: 'PERSONAL' } } })
  })
  it('loads lightweight hover details with localized roles and no contact request', async () => {
    permissions.value = ['USERS_INFO_GET']
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { users: { byId: { ...user, roles: [{ systemName: 'ADMIN', localizedName: 'Administrator' }] } } } } as never)
    const result = await getUserPreview(user.id)
    expect(result.roleLabels).toEqual({ ADMIN: 'Administrator' })
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables).toEqual({ id: user.id, includeRoles: true })
  })
  it('filters organizations by user on the server', async () => {
    vi.mocked(graphqlClient.query).mockResolvedValue({ data: { organizations: { list: [] } } } as never)
    await getUserOrganizations(user.id, { page: 1, limit: 10, sortBy: ['Name_desc'] })
    expect(vi.mocked(graphqlClient.query).mock.calls[0]![0].variables!.input).toMatchObject({ userId: user.id, pagination: { page: 1, size: 10 }, sortBy: [{ field: 'Name', isDescending: true }] })
  })
})
