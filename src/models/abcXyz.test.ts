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
})
