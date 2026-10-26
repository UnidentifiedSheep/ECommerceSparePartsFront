
export const userSearchFields = ['surname', 'name', 'userName', 'email', 'phone'] as const
export type UserSearchField = typeof userSearchFields[number]
export type UserSearchFilters = Record<UserSearchField, string>

export function buildUserSearch(searchTerm: string | undefined, filters: UserSearchFilters) {
  const fields = Object.fromEntries(userSearchFields.flatMap((field) => {
    const value = filters[field].trim()
    return value ? [[field, value]] : []
  })) as Partial<UserSearchFilters>
  const fieldSearch = Object.keys(fields).length > 0
  return {
    fieldSearch,
    request: fieldSearch
      ? { ...fields }
      : { searchTerm: searchTerm?.trim() || undefined },
  }
}
