import { describe, expect, it, vi } from 'vitest'
import { validateAnalysisRecord, analysisCursor, formatAnalysisValue } from './analysisSchema'
import type { ObjectSchema, SchemaField } from '@/models/schemaModel'
vi.mock('@/i18n', () => ({ getCurrentLocale: () => 'en', t: (key: string) => key }))
const field = (name: string, type: SchemaField['type'], required = true): SchemaField => ({ name, type, required, accepts: [] })
describe('schema based analysis results', () => {
  it('validates a new analysis without knowledge of its type or field names', () => {
    const schema: ObjectSchema = { version: 1, fields: [field('region', 'String'), field('margin', 'Number'), field('category', 'Enum'), field('optional', 'Number', false)] }
    const row = { region: 'North', margin: 12.5, category: 'High' }
    expect(validateAnalysisRecord(schema, row)).toEqual(row)
    expect(() => validateAnalysisRecord(schema, { ...row, margin: '12.5' })).toThrow()
    expect(() => validateAnalysisRecord(schema, { margin: 12.5, category: 'High' })).toThrow()
  })
  it('validates nested summaries, arrays and legitimate zero/false values', () => {
    const schema: ObjectSchema = { version: 1, fields: [field('count', 'Integer'), field('ready', 'Boolean'), { ...field('groups', 'Array'), nestedSchema: { version: 1, fields: [field('total', 'Number')] } }] }
    expect(validateAnalysisRecord(schema, { count: 0, ready: false, groups: [{ total: 0 }] }).count).toBe(0)
    expect(() => validateAnalysisRecord(schema, { count: 0, ready: false, groups: [{ total: null }] })).toThrow()
  })
  it('preserves string cursors and parses numeric cursors according to the query schema', () => {
    expect(analysisCursor('token-002', field('cursor', 'String'))).toBe('token-002')
    expect(analysisCursor('40', field('cursor', 'Integer'))).toBe(40)
    expect(analysisCursor('0', field('cursor', 'Integer'))).toBe(0)
    expect(analysisCursor(null, field('cursor', 'Integer'))).toBeUndefined()
    expect(() => analysisCursor('9007199254740993', field('cursor', 'Integer'))).toThrow()
    expect(() => analysisCursor('abc', field('cursor', 'Integer'))).toThrow()
  })
  it('does not erase false or zero', () => {
    expect(formatAnalysisValue(0)).toBe('0')
    expect(formatAnalysisValue(false)).toBe('analysisSchema.no')
    expect(formatAnalysisValue(null)).toBe('—')
    expect(formatAnalysisValue('Lumpy', field('demandPattern', 'Enum'))).toBe('schemaInputs.enums.Lumpy')
  })
})
