import { describe, expect, it } from 'vitest'
import { parseAbcXyzPoint, parseAbcXyzSummary } from './abcXyz'
const point = { productId: 1, rank: 1, value: 100, share: 0.2, cumulativeShare: 0.2, abc: 'A', quantity: 2, revenue: 100, periodsCount: 1 }
describe('ABC/XYZ JSON contract', () => {
  it('preserves omitted or null XYZ and coefficients as unclassified, rather than class Z', () => {
    expect(parseAbcXyzPoint(point)).toMatchObject({ xyz: null, coefficientOfVariation: null, share: 0.2 })
    expect(parseAbcXyzPoint({ ...point, xyz: 'Z', coefficientOfVariation: 0.5 })).toMatchObject({ xyz: 'Z', coefficientOfVariation: 0.5 })
    expect(parseAbcXyzSummary({ productsCount: 1, periodsCount: 1, totalValue: 100, cells: [{ abc: 'A', productsCount: 1, value: 100 }] }).cells[0]?.xyz).toBeNull()
  })
  it('rejects broken JSON scalar values before displaying misleading financial data', () => {
    for (const data of [{ ...point, revenue: '100' }, { ...point, share: NaN }, { ...point, abc: 'D' }, { ...point, xyz: 'Unclassified' }, { ...point, rank: 1.5 }]) expect(() => parseAbcXyzPoint(data)).toThrow()
    expect(() => parseAbcXyzSummary({ productsCount: 1, periodsCount: 1, totalValue: '100', cells: [] })).toThrow()
  })
  it('reads v2 demand patterns and preserves zero CV² and missing classifications', () => {
    expect(parseAbcXyzPoint({ ...point, demandPattern: 'Intermittent', adi: 4, cv2: 0 })).toMatchObject({ demandPattern: 'Intermittent', adi: 4, cv2: 0 })
    expect(parseAbcXyzPoint(point)).toMatchObject({ demandPattern: null, adi: null, cv2: null })
    const summary = { productsCount: 2, periodsCount: 4, totalValue: 100, cells: [], patternCells: [{ abc: 'A', pattern: 'Smooth', productsCount: 1, value: 80 }, { abc: 'C', pattern: null, productsCount: 1, value: 20 }] }
    expect(parseAbcXyzSummary(summary).patternCells).toEqual(summary.patternCells)
    expect(() => parseAbcXyzPoint({ ...point, demandPattern: 'Unclassified' })).toThrow()
    expect(() => parseAbcXyzPoint({ ...point, cv2: '0.49' })).toThrow()
    expect(() => parseAbcXyzSummary({ ...summary, patternCells: {} })).toThrow()
  })
})
