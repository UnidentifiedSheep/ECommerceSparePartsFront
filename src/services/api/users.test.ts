import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from './api.ts'
import { getUsers } from './users.ts'
import { GeneralSearchStrategy } from '@/enums/generalSearchStrategy.ts'

vi.mock('./api.ts', () => ({ default: { get: vi.fn() }, clampPageSize: (size: number) => Math.min(100, Math.max(1, size)) }))
const users = Array.from({ length: 45 }, (_, id) => ({ id: String(id), userName: `user-${id}` }))
beforeEach(() => vi.mocked(api.get).mockReset())

describe('users search pagination contract', () => {
  it('sends size and preserves paginated General results', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { users: users.slice(0, 20) } })
    const result = await getUsers({ page: 1, limit: 20, searchMethod: GeneralSearchStrategy.General, searchTerm: 'mail@example.com' })
    const params = vi.mocked(api.get).mock.calls[0]![1]!.params as URLSearchParams
    expect(params.get('size')).toBe('20')
    expect(params.has('limit')).toBe(false)
    expect(params.get('searchTerm')).toBe('mail@example.com')
    expect(result.users).toHaveLength(20)
    expect(result.hasNext).toBe(true)
  })
  it.each([[0, 20, '0', true], [1, 20, '20', true], [2, 5, '40', false]])('paginates the complete Similarity response on page %i', async (page, count, firstId, hasNext) => {
    vi.mocked(api.get).mockResolvedValue({ data: { users } })
    const result = await getUsers({ page, limit: 20, searchMethod: GeneralSearchStrategy.Similarity, surname: 'Smith', name: 'Alice' })
    expect(result.users).toHaveLength(count)
    expect(result.users[0]?.id).toBe(firstId)
    expect(result.hasNext).toBe(hasNext)
    const params = vi.mocked(api.get).mock.calls[0]![1]!.params as URLSearchParams
    expect(params.has('searchTerm')).toBe(false)
    expect(params.get('surname')).toBe('Smith')
    expect(params.get('name')).toBe('Alice')
  })
})
