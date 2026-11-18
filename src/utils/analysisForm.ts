import type { SchemaField } from '@/models/schemaModel'
import { isStructuredSchemaField } from '@/models/schemaModel'
import { parseSchemaInputValue, schemaMonthToUtc } from '@/utils/schemaInputs'
import type { FieldValue } from '@/components/schema/DynamicSchemaForm.vue'

export function analysisFormDefaults(type: string, fields: SchemaField[], now = new Date()): Record<string, FieldValue> {
  const month = (offset: number) => {
    const value = new Date(now)
    value.setUTCDate(1); value.setUTCHours(0, 0, 0, 0); value.setUTCMonth(value.getUTCMonth() + offset)
    return value.toISOString()
  }
  const defaults: Record<string, FieldValue> = type === 'AbcXyz' ? {
    from: month(-12), to: month(-1), abcMetric: 'Revenue', xyzMetric: 'Revenue', aShare: 0.8, bShare: 0.15, xCoefficient: 0.1, yCoefficient: 0.25, minPeriods: 3, granularity: 'Month', adiCutoff: 1.32, cv2Cutoff: 0.49,
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

export function abcXyzWindow(values: Record<string, FieldValue>): { periods: number | null; error: 'invalidWindow' | 'minPeriodsInvalid' | 'minPeriodsExceedWindow' | 'quarterBoundsInvalid' | 'quarterMonthsInvalid' | 'granularityInvalid' | 'adiCutoffInvalid' | 'cv2CutoffInvalid' | null } {
  let from: string, to: string
  let months: unknown
  try {
    from = schemaMonthToUtc(values.from); to = schemaMonthToUtc(values.to)
    months = isEmptyAnalysisValue(values.months) ? [] : typeof values.months === 'string' ? JSON.parse(values.months) : values.months
  } catch { return { periods: null, error: 'invalidWindow' } }
  if (!Array.isArray(months) || months.some(month => !Number.isInteger(month) || month < 1 || month > 12)) return { periods: null, error: 'invalidWindow' }
  const index = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1
  const start = index(from), end = index(to)
  if (end < start) return { periods: null, error: 'invalidWindow' }
  const granularity = isEmptyAnalysisValue(values.granularity) ? 'Month' : values.granularity
  if (granularity !== 'Month' && granularity !== 'Quarter') return { periods: null, error: 'granularityInvalid' }
  if (granularity === 'Quarter') {
    if (start % 3 !== 0 || end % 3 !== 2) return { periods: null, error: 'quarterBoundsInvalid' }
    if (months.length) return { periods: null, error: 'quarterMonthsInvalid' }
  }
  const selected: number[] = months.length ? [...new Set(months)] : Array.from({ length: 12 }, (_, i) => i + 1)
  const periods = granularity === 'Quarter' ? (end - start + 1) / 3 : selected.reduce((count, month) => count + Math.max(0, Math.floor((end - month + 1) / 12) - Math.ceil((start - month + 1) / 12) + 1), 0)
  for (const field of ['adiCutoff', 'cv2Cutoff'] as const) {
    const value = values[field]
    if (isEmptyAnalysisValue(value)) continue // Omitted optional thresholds use backend defaults.
    const number = typeof value === 'number' || typeof value === 'string' ? Number(String(value).trim().replace(',', '.')) : NaN
    if (!Number.isFinite(number) || number <= 0) return { periods, error: field === 'adiCutoff' ? 'adiCutoffInvalid' : 'cv2CutoffInvalid' }
  }
  const minimum = typeof values.minPeriods === 'number' || typeof values.minPeriods === 'string' ? Number(values.minPeriods) : NaN
  if (!Number.isSafeInteger(minimum) || minimum < 2) return { periods, error: 'minPeriodsInvalid' }
  return { periods, error: minimum > periods ? 'minPeriodsExceedWindow' : null }
}
