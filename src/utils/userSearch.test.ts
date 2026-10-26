import { describe, expect, it } from 'vitest'
import { buildUserSearch, type UserSearchFilters, userSearchFields } from './userSearch.ts'

const empty = (): UserSearchFilters => ({ surname: '', name: '', userName: '', email: '', phone: '' })

describe('user search modes', () => {
  it('uses general search with no field filters', () => {
    expect(buildUserSearch(' alice@example.com ', empty())).toEqual({
      fieldSearch: false, request: { searchTerm: 'alice@example.com' },
    })
  })
  it.each(userSearchFields)('excludes general search when %s is filled', (field) => {
    const result = buildUserSearch('ignored@example.com', { ...empty(), [field]: ' value ' })
    expect(result.fieldSearch).toBe(true)
    expect(result.request).toEqual({ [field]: 'value' })
    expect(result.request).not.toHaveProperty('searchTerm')
  })
  it('combines populated fields without sending empty fields or the general query', () => {
    expect(buildUserSearch('ignored', { ...empty(), name: ' Alice ', surname: ' Smith ', email: '  ' }).request).toEqual({ surname: 'Smith', name: 'Alice',
    })
  })
  it('restores the retained general query when the last field is cleared', () => {
    expect(buildUserSearch('retained', { ...empty(), name: '  ' }).request).toEqual({ searchTerm: 'retained' })
  })
})
