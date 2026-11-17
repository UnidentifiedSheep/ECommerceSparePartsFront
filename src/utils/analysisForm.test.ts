import { describe, expect, it, vi } from 'vitest'
import { analysisFormDefaults, serializeAnalysisForm } from './analysisForm'
import type { SchemaField } from '@/models/schemaModel'
vi.mock('@/i18n', () => ({ getCurrentLocale: () => 'ru', t: (key: string) => key }))
const field = (name: string, control: SchemaField['control'], type: SchemaField['type'] = 'String', required = true, entity?: string): SchemaField => ({ name, control, type, required, accepts: [], dependency: entity ? { entityName: entity } : null })
describe('analysis creation parameters', () => {
  it('defaults to the previous 12 complete UTC months even near local month boundaries', () => {
    const values = analysisFormDefaults('AbcXyz', [field('from', 'MonthPicker'), field('to', 'MonthPicker')], new Date('2026-11-01T01:00:00Z'))
    expect(values).toEqual({ from: '2025-11-01T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' })
  })
  it('serializes fractions, months and parties without mixing organization IDs with buyer IDs', () => {
    const fields = [field('from', 'MonthPicker'), field('aShare', 'TextField', 'Number'), field('months', 'EnumSelector', 'Array', false, 'Month'), field('organizationId', 'EntitySelector'), field('buyerId', 'EntitySelector'), field('unused', 'EntitySelector', 'String', false)]
    const result = JSON.parse(serializeAnalysisForm(fields, { from: '2026-01', aShare: '0,8', months: '[1,12]', organizationId: 'org-1', buyerId: 'user-2', unused: null }))
    expect(result).toEqual({ from: '2026-01-01T00:00:00.000Z', aShare: 0.8, months: [1, 12], organizationId: 'org-1', buyerId: 'user-2' })
    expect(() => serializeAnalysisForm(fields, { from: '' })).toThrow()
  })
})
