import schemaText from '@/graphql/schema.graphql?raw'
import { buildSchema, isEnumType, isInputObjectType, getNamedType, getVariableValues, parse, Kind } from 'graphql'
import { describe, expect, it } from 'vitest'
import { gqlSort, sortFields } from './sorting'

const schema = buildSchema(schemaText)

describe('typed GraphQL sorting', () => {
  it('keeps every registered entity whitelist in sync with its schema enum and input', () => {
    for (const [entity, fields] of Object.entries(sortFields)) {
      const enumeration = schema.getType(`${entity}SortField`)
      const input = schema.getType(`${entity}SortBy`)
      expect(isEnumType(enumeration)).toBe(true)
      expect(isInputObjectType(input)).toBe(true)
      if (!isEnumType(enumeration) || !isInputObjectType(input)) throw new Error(entity)
      expect([...fields].sort()).toEqual(enumeration.getValues().map(value => value.name).sort())
      expect(getNamedType(input.getFields().field!.type)).toBe(enumeration)
    }
  })
  it('preserves multi-sort order, direction and camelCase fields in both supported UI formats', () => {
    expect(gqlSort('Organization', ['Name_desc', '+systemName', '-approximateBalance', 'id_asc'])).toEqual([
      { field: 'NAME', isDescending: true }, { field: 'SYSTEM_NAME', isDescending: false },
      { field: 'APPROXIMATE_BALANCE', isDescending: true }, { field: 'ID', isDescending: false },
    ])
    expect(gqlSort('Sale', ['-totalSum', 'dateTime_asc'])).toEqual([{ field: 'TOTAL_SUM', isDescending: true }, { field: 'DATE_TIME', isDescending: false }])
    expect(gqlSort('Sale', undefined)).toBeUndefined()
  })
  it('maps old cross count preferences to STOCK but retains COUNT for storage positions', () => {
    expect(gqlSort('Product', ['-count', 'sku'], ' Main_Warehouse ')).toEqual([{ field: 'STOCK', isDescending: true, argument: 'Main_Warehouse' }, { field: 'SKU', isDescending: false }])
    expect(gqlSort('StorageContent', ['-count', 'purchaseDatetime'])).toEqual([{ field: 'COUNT', isDescending: true }, { field: 'PURCHASE_DATETIME', isDescending: false }])
    expect(gqlSort('SearchProduct', ['-stock'], '   ')).toEqual([{ field: 'STOCK', isDescending: true }])
    expect(gqlSort('SearchProduct', ['-stock'], 'Main_Warehouse')).toEqual([{ field: 'STOCK', isDescending: true, argument: 'Main_Warehouse' }])
  })
  it('rejects fields from other entities or old unsupported preferences without losing valid sort keys', () => {
    expect(gqlSort('SearchProduct', ['name', 'producerName', '-sku'])).toEqual([{ field: 'SKU', isDescending: true }])
    expect(gqlSort('Product', ['producerId', 'name'])).toEqual([{ field: 'NAME', isDescending: false }])
    expect(gqlSort('ProductPriceOption', ['sellPrice_asc', '-score'])).toEqual([{ field: 'SCORE', isDescending: true }])
  })
  it('passes runtime GraphQL variable validation, including the organization-match argument', () => {
    const definitions = parse('query Check($sort: [SaleContentSortBy!]) { __typename }').definitions[0]
    if (definitions?.kind !== Kind.OPERATION_DEFINITION) throw new Error('Missing operation')
    const sort = gqlSort('SaleContent', [{ field: 'organizationMatch', argument: 'org-id', isDescending: true }, 'discountedPrice_asc'])
    expect(getVariableValues(schema, definitions.variableDefinitions!, { sort })).not.toHaveProperty('errors')
    expect(sort?.[0]).toEqual({ field: 'ORGANIZATION_MATCH', argument: 'org-id', isDescending: true })
    expect(getVariableValues(schema, definitions.variableDefinitions!, { sort: [{ field: 'discountedPrice', isDescending: true }] })).toHaveProperty('errors')
  })
})
