import type { SchemaField } from '@/models/schemaModel'
import { parseStructuredSchemaValue } from '@/models/schemaModel'
import { getCurrentLocale, t } from '@/i18n'
import { demandPatterns } from '@/models/abcXyz'

export function schemaEntity(field: SchemaField) { return field.dependency?.entityName }

const enumValues: Record<string, string[]> = {
  AnalysisMetric: ['Revenue', 'Quantity'],
  AbcClass: ['A', 'B', 'C'],
  XyzClass: ['X', 'Y', 'Z'],
  AbcXyzRunItemsXyzFilter: ['X', 'Y', 'Z', 'Unclassified'],
  AbcXyzRunItemsPatternFilter: [...demandPatterns, 'Unclassified'],
  DemandPattern: [...demandPatterns],
  AnalysisPeriodGranularity: ['Month', 'Quarter'],
  SaleState: ['Draft', 'Completed', 'Deleted'],
  DeliveryMode: ['Pickup', 'Delivery'],
}

export function hasSchemaEnumOptions(field: SchemaField) {
  return field.control === 'EnumSelector' && (schemaEntity(field) === 'Month' || Boolean(enumValues[schemaEntity(field) ?? '']))
}

export function schemaEnumOptions(field: SchemaField): Array<{ value: string | number; label: string }> {
  if (schemaEntity(field) === 'Month') {
    const format = new Intl.DateTimeFormat(getCurrentLocale(), { month: 'long', timeZone: 'UTC' })
    return Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: format.format(new Date(Date.UTC(2024, index, 1))) }))
  }
  return (enumValues[schemaEntity(field) ?? ''] ?? []).map(value => ({
    value,
    label: schemaEntity(field) === 'SaleState' ? t(`sales.states.${value}`) : schemaEntity(field) === 'DeliveryMode' ? t(`schemaInputs.deliveryModes.${value}`) : ['Revenue', 'Quantity', 'Unclassified', 'Month', 'Quarter', ...demandPatterns].includes(value) ? t(`schemaInputs.enums.${value}`) : value,
  }))
}

// Month boundaries are UTC calendar values, not local-midnight timestamps.
export function schemaMonthToUtc(value: unknown): string {
  if (typeof value !== 'string' || !/^(?!0000)\d{4}-(0[1-9]|1[0-2])(?:$|-01T00:00:00(?:\.000)?Z$)/.test(value)) throw new Error('Invalid month')
  return `${value.slice(0, 7)}-01T00:00:00.000Z`
}

export function parseSchemaInputValue(field: SchemaField, value: unknown): unknown {
  if (field.control === 'MonthPicker') return schemaMonthToUtc(value)
  const parsed = parseStructuredSchemaValue(field, value)
  if (field.type === 'Array' && hasSchemaEnumOptions(field)) {
    const allowed = schemaEnumOptions(field).map(option => option.value)
    if (!Array.isArray(parsed) || parsed.some(item => !allowed.includes(item))) throw new Error('Invalid enum selection')
    return [...new Set(parsed)]
  }
  if (field.type === 'Integer' || field.type === 'Number') {
    if (typeof value !== 'number' && typeof value !== 'string') throw new Error('Invalid number')
    const number = typeof value === 'string' ? Number(value.trim().replace(',', '.')) : value
    if (!Number.isFinite(number) || (typeof value === 'string' && !value.trim()) || (field.type === 'Integer' && !Number.isInteger(number))) throw new Error('Invalid number')
    return number
  }
  return parsed
}
