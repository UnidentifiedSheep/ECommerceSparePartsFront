import { describe, expect, it } from 'vitest'
import {
  countProductCriteria,
  emptyCharacteristicCriteria,
  emptyProductCriteria,
  parseProductCriteriaDraft,
  toProductCriteriaInput,
  validateProductCriteria,
} from './productCriteriaModel.ts'

describe('product criteria', () => {
  it('starts with no active filters', () => {
    const draft = emptyProductCriteria()
    expect(countProductCriteria(draft)).toBe(0)
    expect(validateProductCriteria(draft)).toBeNull()
    expect(toProductCriteriaInput(draft)).toBeNull()
  })

  it('counts active ranges and converts them to GraphQL input', () => {
    const draft = emptyProductCriteria()
    draft.weight.max = 5
    draft.dimensions.length.min = 10
    draft.characteristics.push({ ...emptyCharacteristicCriteria(), characteristicId: 7, values: 'red, blue, ' })

    expect(countProductCriteria(draft)).toBe(3)
    expect(validateProductCriteria(draft)).toBeNull()
    expect(toProductCriteriaInput(draft)).toEqual({
      weight: { range: { gte: null, lte: 5 }, unit: 'KILOGRAM' },
      dimensions: {
        unit: 'CENTIMETER',
        length: { gte: 10, lte: null },
        width: null,
        height: null,
        volume: null,
      },
      characteristics: [{ characteristicId: 7, values: ['red', 'blue'], numericRange: null, exists: null }],
    })
  })

  it('rejects reversed ranges and duplicate characteristics', () => {
    const draft = emptyProductCriteria()
    draft.weight.min = 10
    draft.weight.max = 5
    expect(validateProductCriteria(draft)).toBe('invalidRange')

    draft.weight.max = 12
    draft.characteristics = [
      { ...emptyCharacteristicCriteria(), characteristicId: 3, values: 'first' },
      { ...emptyCharacteristicCriteria(), characteristicId: 3, values: 'second' },
    ]
    expect(validateProductCriteria(draft)).toBe('duplicateCharacteristic')
  })

  it('rejects incomplete characteristic filters', () => {
    const draft = emptyProductCriteria()
    const row = { ...emptyCharacteristicCriteria(), characteristicId: 4 }
    draft.characteristics.push(row)
    expect(validateProductCriteria(draft)).toBe('incompleteCharacteristic')

    row.operation = 'range'
    expect(validateProductCriteria(draft)).toBe('incompleteCharacteristic')
    row.min = 1
    expect(validateProductCriteria(draft)).toBeNull()
  })

  it('sanitizes persisted filter state and falls back on invalid JSON', () => {
    expect(parseProductCriteriaDraft('{')).toEqual(emptyProductCriteria())
    const draft = parseProductCriteriaDraft(JSON.stringify({
      stock: { min: 3, max: 'invalid' },
      weight: { min: 1, unit: 'UNKNOWN' },
      dimensions: { unit: 'METER', length: { min: 2 }, width: { max: Infinity } },
      characteristics: [{ characteristicId: 8, operation: 'exists', exists: false }],
    }))
    expect(draft).not.toHaveProperty('stock')
    expect(toProductCriteriaInput(draft)).not.toHaveProperty('stock')
    expect(draft.weight.unit).toBe('KILOGRAM')
    expect(draft.dimensions.unit).toBe('METER')
    expect(draft.dimensions.width.max).toBeNull()
    expect(toProductCriteriaInput(draft)?.characteristics).toEqual([
      { characteristicId: 8, values: null, numericRange: null, exists: false },
    ])
  })

  it('discards a legacy stock-only filter instead of sending an unsupported GraphQL field', () => {
    const draft = parseProductCriteriaDraft(JSON.stringify({ stock: { min: 3, max: 10 } }))
    expect(countProductCriteria(draft)).toBe(0)
    expect(toProductCriteriaInput(draft)).toBeNull()
  })
})
