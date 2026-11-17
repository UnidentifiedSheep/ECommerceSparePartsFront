import type { SchemaField } from '@/models/schemaModel'
import { isStructuredSchemaField } from '@/models/schemaModel'
import { parseSchemaInputValue } from '@/utils/schemaInputs'
import type { FieldValue } from '@/components/schema/DynamicSchemaForm.vue'

export function analysisFormDefaults(type: string, fields: SchemaField[], now = new Date()): Record<string, FieldValue> {
  const month = (offset: number) => {
    const value = new Date(now)
    value.setUTCDate(1); value.setUTCHours(0, 0, 0, 0); value.setUTCMonth(value.getUTCMonth() + offset)
    return value.toISOString()
  }
  const defaults: Record<string, FieldValue> = type === 'AbcXyz' ? {
    from: month(-12), to: month(-1), abcMetric: 'Revenue', xyzMetric: 'Revenue', aShare: 0.8, bShare: 0.15, xCoefficient: 0.1, yCoefficient: 0.25, minPeriods: 3,
  } : {}
  return Object.fromEntries(fields.map(field => [field.name, defaults[field.name] ?? (field.type === 'Boolean' ? false : isStructuredSchemaField(field) || field.control === 'TextField' || field.control === 'MonthPicker' ? '' : null)]))
}
export function isEmptyAnalysisValue(value: unknown) { return value === '' || value == null }
export function serializeAnalysisForm(fields: SchemaField[], values: Record<string, FieldValue>) {
  return JSON.stringify(Object.fromEntries(fields.flatMap((field): [string, unknown][] => {
    const value = values[field.name]
    if (isEmptyAnalysisValue(value)) {
      if (field.required) throw new Error(field.label || field.name)
      return []
    }
    return [[field.name, parseSchemaInputValue(field, value)]]
  })))
}
