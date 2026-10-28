import { describe, expect, it } from 'vitest'
import { isStructuredSchemaField, parseStructuredSchemaValue, type SchemaField } from './schemaModel'

const field = (overrides: Partial<SchemaField> = {}): SchemaField => ({
  name: 'offerTtl', type: 'Object', control: 'TextField', required: true, accepts: [], nestedSchema: null, ...overrides,
})

describe('schema value serialization', () => {
  it('keeps scalar text wrappers such as TimeSpan as JSON string values, without requiring quotes in the input', () => {
    const ttl = field()
    expect(isStructuredSchemaField(ttl)).toBe(false)
    for (const value of ['1.00:00:00', '00:30:00']) {
      expect(parseStructuredSchemaValue(ttl, value)).toBe(value)
      expect(JSON.parse(JSON.stringify({ offerTtl: parseStructuredSchemaValue(ttl, value) }))).toEqual({ offerTtl: value })
    }
  })

  it('continues to parse and validate objects with a nested schema even when they use a text control', () => {
    const object = field({ nestedSchema: { version: 1, fields: [] } })
    expect(isStructuredSchemaField(object)).toBe(true)
    expect(parseStructuredSchemaValue(object, '{"enabled":true}')).toEqual({ enabled: true })
    expect(() => parseStructuredSchemaValue(object, '1.00:00:00')).toThrow()
  })

  it('keeps strict JSON checks for object editors and arrays without treating them as scalar text', () => {
    expect(parseStructuredSchemaValue(field({ control: null }), '{"count":2}')).toEqual({ count: 2 })
    expect(() => parseStructuredSchemaValue(field({ control: null }), '"text"')).toThrow()
    expect(parseStructuredSchemaValue(field({ type: 'Array' }), '[1,2]')).toEqual([1, 2])
    expect(() => parseStructuredSchemaValue(field({ type: 'Array' }), '{}')).toThrow()
  })
})
