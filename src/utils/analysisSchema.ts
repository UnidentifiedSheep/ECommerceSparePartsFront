import { isStructuredSchemaField, parseStructuredSchemaValue, type ObjectSchema, type SchemaField } from '@/models/schemaModel'
import { t, getCurrentLocale } from '@/i18n'
import { schemaEnumOptions } from '@/utils/schemaInputs'
import { demandPatterns } from '@/models/abcXyz'

export function analysisRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid analysis record')
  return value as Record<string, unknown>
}
export function validateAnalysisRecord(schema: ObjectSchema, value: unknown, depth = 0): Record<string, unknown> {
  const row = analysisRecord(value)
  if (depth > 8) throw new Error('Analysis schema is too deep')
  for (const field of schema.fields) {
    const item = row[field.name]
    if (item == null) { if (field.required) throw new Error(`Missing analysis field: ${field.name}`); continue }
    let valid = true
    switch (field.type) {
      case 'String': valid = typeof item === 'string'; break
      case 'Boolean': valid = typeof item === 'boolean'; break
      case 'Integer': valid = typeof item === 'number' && Number.isSafeInteger(item); break
      case 'Number': valid = typeof item === 'number' && Number.isFinite(item); break
      case 'Enum': valid = typeof item === 'string' || (typeof item === 'number' && Number.isFinite(item)); break
      case 'Array':
        valid = Array.isArray(item)
        if (valid && field.nestedSchema?.fields.length) for (const entry of item as unknown[]) validateAnalysisRecord(field.nestedSchema, entry, depth + 1)
        break
      case 'Object':
        if (field.nestedSchema) validateAnalysisRecord(field.nestedSchema, item, depth + 1)
        else valid = !isStructuredSchemaField(field) ? typeof item === 'string' : typeof item === 'object' && !Array.isArray(item)
        break
    }
    if (!valid) throw new Error(`Invalid analysis field: ${field.name}`)
  }
  return row
}
export function analysisCursor(value: string | null, field?: SchemaField): unknown {
  if (value === null) return undefined
  if (field?.type === 'Integer' || field?.type === 'Number') {
    const number = Number(value)
    if (!value.trim() || !Number.isFinite(number) || (field.type === 'Integer' && !Number.isSafeInteger(number))) throw new Error('Invalid analysis cursor')
    return number
  }
  if (field?.type === 'Object' || field?.type === 'Array') return parseStructuredSchemaValue(field, value)
  return value
}
export function formatAnalysisValue(value: unknown, field?: SchemaField): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return t(value ? 'analysisSchema.yes' : 'analysisSchema.no')
  if (field?.control === 'EnumSelector') {
    const option = schemaEnumOptions(field).find(option => option.value === value)
    if (option) return option.label
  }
  if (typeof value === 'number') return value.toLocaleString(getCurrentLocale(), { maximumFractionDigits: 12 })
  if (field?.control === 'MonthPicker' && typeof value === 'string' && Number.isFinite(Date.parse(value))) return new Intl.DateTimeFormat(getCurrentLocale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))
  if (field?.control === 'DatePicker' && typeof value === 'string' && Number.isFinite(Date.parse(value))) return new Intl.DateTimeFormat(getCurrentLocale(), { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value))
  if (field?.type === 'Enum') return schemaEnumOptions(field).find(option => option.value === value)?.label ?? (demandPatterns.includes(value as typeof demandPatterns[number]) ? t(`schemaInputs.enums.${value}`) : String(value))
  return String(value)
}
