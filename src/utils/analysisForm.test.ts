import { describe, expect, it, vi } from 'vitest'
import { analysisFormDefaults, serializeAnalysisForm, abcXyzWindow } from './analysisForm'
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
  it('counts inclusive UTC months and seasonal selections across year boundaries', () => {
    expect(abcXyzWindow({ from: '2025-11', to: '2026-10', minPeriods: 3 })).toEqual({ periods: 12, error: null })
    expect(abcXyzWindow({ from: '2025-11', to: '2026-02', months: '[11,12,1,2]', minPeriods: 4 })).toEqual({ periods: 4, error: null })
    expect(abcXyzWindow({ from: '2025-01', to: '2026-12', months: '[1,1,12]', minPeriods: 4 })).toEqual({ periods: 4, error: null })
    expect(abcXyzWindow({ from: '2026-01', to: '2026-12', months: '[]', minPeriods: 12 })).toEqual({ periods: 12, error: null })
  })
  it('rejects minimum periods exceeding the effective seasonal window, not just the range length', () => {
    expect(abcXyzWindow({ from: '2026-01', to: '2026-12', months: '[1,12]', minPeriods: 3 })).toEqual({ periods: 2, error: 'minPeriodsExceedWindow' })
    expect(abcXyzWindow({ from: '2026-01', to: '2026-01', minPeriods: 2 }).error).toBe('minPeriodsExceedWindow')
    expect(abcXyzWindow({ from: '2026-03', to: '2026-04', months: '[12]', minPeriods: 2 }).periods).toBe(0)
    for (const minPeriods of [null, '', 1, 2.5]) expect(abcXyzWindow({ from: '2026-01', to: '2026-12', minPeriods }).error).toBe('minPeriodsInvalid')
    expect(abcXyzWindow({ from: '2026-02', to: '2026-01', minPeriods: 2 }).error).toBe('invalidWindow')
    expect(abcXyzWindow({ from: '', to: '2026-01', minPeriods: 2 }).error).toBe('invalidWindow')
    expect(abcXyzWindow({ from: '2026-01', to: '2026-12', months: '[13]', minPeriods: 2 }).error).toBe('invalidWindow')
  })
  it('counts complete quarters and enforces quarter boundaries and no season selection', () => {
    const values = { from: '2025-10', to: '2026-09', granularity: 'Quarter', minPeriods: 2 }
    expect(abcXyzWindow(values)).toEqual({ periods: 4, error: null })
    expect(abcXyzWindow({ ...values, minPeriods: 5 })).toEqual({ periods: 4, error: 'minPeriodsExceedWindow' })
    expect(abcXyzWindow({ ...values, from: '2025-11' }).error).toBe('quarterBoundsInvalid')
    expect(abcXyzWindow({ ...values, to: '2026-10' }).error).toBe('quarterBoundsInvalid')
    expect(abcXyzWindow({ ...values, months: '[1]' }).error).toBe('quarterMonthsInvalid')
    expect(abcXyzWindow({ ...values, months: '[]' }).error).toBeNull()
    expect(abcXyzWindow({ ...values, granularity: 'Year' }).error).toBe('granularityInvalid')
  })
  it('defaults new fields and validates positive ADI and CV² thresholds including decimal commas', () => {
    const fields = [field('granularity', 'EnumSelector', 'Enum', false, 'AnalysisPeriodGranularity'), field('adiCutoff', 'TextField', 'Number', false), field('cv2Cutoff', 'TextField', 'Number', false)]
    expect(analysisFormDefaults('AbcXyz', fields)).toEqual({ granularity: 'Month', adiCutoff: 1.32, cv2Cutoff: 0.49 })
    const values = { from: '2026-01', to: '2026-12', minPeriods: 3 }
    expect(abcXyzWindow({ ...values, adiCutoff: '1,32', cv2Cutoff: '0,49' }).error).toBeNull()
    expect(abcXyzWindow({ ...values, adiCutoff: 0 }).error).toBe('adiCutoffInvalid')
    expect(abcXyzWindow({ ...values, cv2Cutoff: '-0,1' }).error).toBe('cv2CutoffInvalid')
    expect(abcXyzWindow({ ...values, cv2Cutoff: '' }).error).toBeNull()
    expect(JSON.parse(serializeAnalysisForm(fields, { granularity: 'Quarter', adiCutoff: '1,32', cv2Cutoff: '0,49' }))).toEqual({ granularity: 'Quarter', adiCutoff: 1.32, cv2Cutoff: 0.49 })
  })
})
