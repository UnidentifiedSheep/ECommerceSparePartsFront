export const queryText = (value: unknown) => typeof value === 'string' ? value.slice(0, 500) : ''
export const queryStrings = (value: unknown): string[] => Array.isArray(value)
  ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0 && item.length <= 200))].slice(0, 100) : []
export const queryIds = (value: unknown): number[] => Array.isArray(value)
  ? [...new Set(value.filter((item): item is number => Number.isSafeInteger(item) && item > 0))].slice(0, 100) : []
export const queryPage = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 100000 ? value : 0
export const querySize = (value: unknown) => typeof value === 'number' && [10, 20, 30, 40, 50, 100].includes(value) ? value : 20
export const queryBoolean = (value: unknown) => value === true
export function queryDates(value: unknown): [string, string] | null {
  if (!Array.isArray(value) || value.length !== 2) return null
  const [start, end] = value
  return typeof start === 'string' && typeof end === 'string'
    && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}\.\d{3})?$/.test(start) && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}\.\d{3})?$/.test(end)
    && Number.isFinite(Date.parse(start)) && Number.isFinite(Date.parse(end)) && start <= end ? [start, end] : null
}
export const querySort = (fields: string[]) => (value: unknown) => queryStrings(value).filter((item) => fields.includes(item.replace(/^-/, '')))
