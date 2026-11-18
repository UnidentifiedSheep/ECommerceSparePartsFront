import { describe, expect, it, vi } from 'vitest'
import { normalizeObjectSchema, type SchemaField } from '@/models/schemaModel'
import { parseSchemaInputValue, schemaMonthToUtc, schemaEnumOptions } from './schemaInputs'

vi.mock('@/i18n', () => ({ getCurrentLocale: () => 'ru', t: (key: string) => key }))
const field = (values: Partial<SchemaField>): SchemaField => ({ name: 'field', type: 'String', required: true, accepts: [], ...values })

describe('analytics schema input compatibility', () => {
  it('normalizes REST and GraphQL MonthPicker controls without breaking existing numeric controls', () => {
    for (const control of [6, 'MonthPicker', 'MONTH_PICKER']) {
      expect(normalizeObjectSchema({ version: 1, fields: [field({ control: null }), { ...field({}), control } as never] }).fields[1]?.control).toBe('MonthPicker')
    }
    expect(normalizeObjectSchema({ version: 1, fields: [{ ...field({}), control: 5 } as never] }).fields[0]?.control).toBe('NamedObjectSelector')
  })

  it('serializes month boundaries directly as UTC and preserves months restored from saved schedules', () => {
    const month = field({ control: 'MonthPicker' })
    expect(parseSchemaInputValue(month, '2026-01')).toBe('2026-01-01T00:00:00.000Z')
    expect(parseSchemaInputValue(month, '2026-11-01T00:00:00Z')).toBe('2026-11-01T00:00:00.000Z')
    expect(parseSchemaInputValue(month, '2026-11-01T00:00:00.000Z')).toBe('2026-11-01T00:00:00.000Z')
    for (const invalid of ['0000-01', '2026-00', '2026-13', '2026-01-31T21:00:00Z', '2026-01-01T00:00:00+03:00', '']) {
      expect(() => schemaMonthToUtc(invalid)).toThrow()
    }
  })

  it('uses numeric months 1–12 on the wire and restores/validates multiple selections', () => {
    const months = field({ type: 'Array', control: 'EnumSelector', dependency: { entityName: 'Month' } })
    expect(schemaEnumOptions(months).map(option => option.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(parseSchemaInputValue(months, '[1,6,12,1]')).toEqual([1, 6, 12])
    expect(parseSchemaInputValue(months, [1, 12])).toEqual([1, 12])
    for (const invalid of ['[0]', '[13]', '["January"]', '{}']) expect(() => parseSchemaInputValue(months, invalid)).toThrow()
  })

  it('keeps metric names and party IDs distinct and serializes decimal text fields as numbers', () => {
    expect(schemaEnumOptions(field({ control: 'EnumSelector', dependency: { entityName: 'AnalysisMetric' } })).map(option => option.value)).toEqual(['Revenue', 'Quantity'])
    expect(parseSchemaInputValue(field({ control: 'EntitySelector', dependency: { entityName: 'Organization' } }), 'organization-1')).toBe('organization-1')
    expect(parseSchemaInputValue(field({ control: 'EntitySelector', dependency: { entityName: 'User' } }), 'user-2')).toBe('user-2')
    expect(parseSchemaInputValue(field({ type: 'Number', control: 'TextField' }), '0,8')).toBe(0.8)
    expect(parseSchemaInputValue(field({ type: 'Integer', control: 'TextField' }), '3')).toBe(3)
    expect(() => parseSchemaInputValue(field({ type: 'Integer' }), '3.5')).toThrow()
    expect(() => parseSchemaInputValue(field({ type: 'Number' }), 'abc')).toThrow()
    expect(parseSchemaInputValue(field({ type: 'Object', control: 'TextField' }), '00:30:00')).toBe('00:30:00')
  })
  it('provides localized period and demand pattern choices while preserving contract values', () => {
    expect(schemaEnumOptions(field({ control: 'EnumSelector', dependency: { entityName: 'AnalysisPeriodGranularity' } }))).toEqual([{ value: 'Month', label: 'schemaInputs.enums.Month' }, { value: 'Quarter', label: 'schemaInputs.enums.Quarter' }])
    expect(schemaEnumOptions(field({ control: 'EnumSelector', dependency: { entityName: 'AbcXyzRunItemsPatternFilter' } })).map(option => option.value)).toEqual(['Smooth', 'Erratic', 'Intermittent', 'Lumpy', 'Unclassified'])
  })
})
