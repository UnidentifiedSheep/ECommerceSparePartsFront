import { ref } from 'vue'

export function sortField(value: string) {
  return value.replace(/^-/, '').replace(/_desc$/, '')
}

export type SortDescendingStyle = 'prefix' | 'suffix'

export function nextSortValues(
  values: string[],
  field: string,
  additive = false,
  descendingStyle: SortDescendingStyle = 'prefix',
) {
  const current = values.find((item) => sortField(item) === field)
  const remaining = values.filter((item) => sortField(item) !== field)
  const isDescending = current?.startsWith('-') || current?.endsWith('_desc')
  const descending = descendingStyle === 'prefix' ? `-${field}` : `${field}_desc`
  const next = !current ? field : isDescending ? undefined : descending

  return additive
    ? next ? [...remaining, next] : remaining
    : next ? [next] : []
}

export function toSortExpressions(values: string[], explicitAscending = false) {
  return values.map((value) => {
    const field = sortField(value)
    if (value.startsWith('-')) return `${field}_desc`
    return explicitAscending ? `${field}_asc` : field
  })
}

export function useMultiSort(initial: string[] = []) {
  const sortBy = ref<string[]>([...initial])

  function toggleSort(field: string, event?: MouseEvent) {
    sortBy.value = nextSortValues(sortBy.value, field, event?.shiftKey)
    return sortBy.value
  }

  function orderOf(field: string) {
    const index = sortBy.value.findIndex((item) => sortField(item) === field)
    return index >= 0 && sortBy.value.length > 1 ? index + 1 : ''
  }

  function directionOf(field: string) {
    const current = sortBy.value.find((item) => sortField(item) === field)
    if (!current) return undefined
    return current.startsWith('-') ? 'descending' : 'ascending'
  }

  return { sortBy, toggleSort, orderOf, directionOf }
}
