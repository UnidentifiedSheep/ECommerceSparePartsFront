import type { DimensionUnit, ProductSearchCriteriaInput, WeightUnit } from '@/graphql/generated/graphql.ts'

export interface CriteriaRangeDraft {
  min: number | null
  max: number | null
}

export interface CharacteristicCriteriaDraft {
  characteristicId: number | undefined
  operation: 'values' | 'range' | 'exists'
  values: string
  min: number | null
  max: number | null
  exists: boolean
}

export interface ProductCriteriaDraft {
  stock: CriteriaRangeDraft
  weight: CriteriaRangeDraft & { unit: WeightUnit }
  dimensions: {
    unit: DimensionUnit
    length: CriteriaRangeDraft
    width: CriteriaRangeDraft
    height: CriteriaRangeDraft
    volume: CriteriaRangeDraft
  }
  characteristics: CharacteristicCriteriaDraft[]
}

export function emptyCriteriaRange(): CriteriaRangeDraft {
  return { min: null, max: null }
}

export function emptyProductCriteria(): ProductCriteriaDraft {
  return {
    stock: emptyCriteriaRange(),
    weight: { ...emptyCriteriaRange(), unit: 'KILOGRAM' },
    dimensions: {
      unit: 'CENTIMETER',
      length: emptyCriteriaRange(),
      width: emptyCriteriaRange(),
      height: emptyCriteriaRange(),
      volume: emptyCriteriaRange(),
    },
    characteristics: [],
  }
}

export function emptyCharacteristicCriteria(): CharacteristicCriteriaDraft {
  return { characteristicId: undefined, operation: 'values', values: '', min: null, max: null, exists: true }
}

function hasRange(range: CriteriaRangeDraft): boolean {
  return range.min != null || range.max != null
}

function toRange(range: CriteriaRangeDraft) {
  return { gte: range.min, lte: range.max }
}

export function countProductCriteria(draft: ProductCriteriaDraft): number {
  return Number(hasRange(draft.stock)) + Number(hasRange(draft.weight))
    + (['length', 'width', 'height', 'volume'] as const).filter((field) => hasRange(draft.dimensions[field])).length
    + draft.characteristics.length
}

export type ProductCriteriaError = 'invalidRange' | 'invalidStock' | 'incompleteCharacteristic' | 'duplicateCharacteristic' | null

export function validateProductCriteria(draft: ProductCriteriaDraft): ProductCriteriaError {
  const ranges = [draft.stock, draft.weight, draft.dimensions.length, draft.dimensions.width, draft.dimensions.height, draft.dimensions.volume,
    ...draft.characteristics.filter((row) => row.operation === 'range')]
  if (ranges.some((range) => (range.min != null && !Number.isFinite(range.min))
    || (range.max != null && !Number.isFinite(range.max))
    || (range.min != null && range.max != null && range.min > range.max))) return 'invalidRange'
  if ([draft.stock.min, draft.stock.max].some((value) => value != null && !Number.isInteger(value))) return 'invalidStock'

  const ids = new Set<number>()
  for (const row of draft.characteristics) {
    if (!row.characteristicId || row.characteristicId <= 0) return 'incompleteCharacteristic'
    if (ids.has(row.characteristicId)) return 'duplicateCharacteristic'
    ids.add(row.characteristicId)
    if (row.operation === 'values' && (
      row.values.split(',').filter((value) => value.trim()).length === 0
      || row.values.split(',').filter((value) => value.trim()).length > 100
      || row.values.split(',').some((value) => value.trim().length > 1024)
    )) return 'incompleteCharacteristic'
    if (row.operation === 'range' && !hasRange(row)) return 'incompleteCharacteristic'
  }
  return null
}

export function toProductCriteriaInput(draft: ProductCriteriaDraft): ProductSearchCriteriaInput | null {
  if (countProductCriteria(draft) === 0) return null
  const dimensions = draft.dimensions
  return {
    stock: hasRange(draft.stock) ? toRange(draft.stock) : null,
    weight: hasRange(draft.weight) ? { range: toRange(draft.weight), unit: draft.weight.unit } : null,
    dimensions: (['length', 'width', 'height', 'volume'] as const).some((field) => hasRange(dimensions[field]))
      ? {
          unit: dimensions.unit,
          length: hasRange(dimensions.length) ? toRange(dimensions.length) : null,
          width: hasRange(dimensions.width) ? toRange(dimensions.width) : null,
          height: hasRange(dimensions.height) ? toRange(dimensions.height) : null,
          volume: hasRange(dimensions.volume) ? toRange(dimensions.volume) : null,
        }
      : null,
    characteristics: draft.characteristics.map((row) => ({
      characteristicId: row.characteristicId!,
      values: row.operation === 'values' ? row.values.split(',').map((value) => value.trim()).filter(Boolean) : null,
      numericRange: row.operation === 'range' ? toRange(row) : null,
      exists: row.operation === 'exists' ? row.exists : null,
    })),
  }
}

export function parseProductCriteriaDraft(raw: string | null): ProductCriteriaDraft {
  const fallback = emptyProductCriteria()
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback
    const value = parsed as Partial<ProductCriteriaDraft>
    const numeric = (input: unknown): number | null => typeof input === 'number' && Number.isFinite(input) ? input : null
    const range = (input: unknown): CriteriaRangeDraft => {
      const item = input && typeof input === 'object' ? input as Partial<CriteriaRangeDraft> : {}
      return { min: numeric(item.min), max: numeric(item.max) }
    }
    const dimensions = value.dimensions && typeof value.dimensions === 'object' ? value.dimensions : fallback.dimensions
    const weightUnit = value.weight && typeof value.weight === 'object' ? value.weight.unit : undefined
    return {
      stock: range(value.stock),
      weight: { ...range(value.weight), unit: weightUnit && ['GRAM', 'KILOGRAM', 'TONNE'].includes(weightUnit) ? weightUnit : fallback.weight.unit },
      dimensions: {
        unit: ['MILLIMETER', 'CENTIMETER', 'METER'].includes(dimensions.unit) ? dimensions.unit : fallback.dimensions.unit,
        length: range(dimensions.length), width: range(dimensions.width), height: range(dimensions.height), volume: range(dimensions.volume),
      },
      characteristics: Array.isArray(value.characteristics) ? value.characteristics.slice(0, 100).map((item) => {
        const row = item && typeof item === 'object' ? item as CharacteristicCriteriaDraft : emptyCharacteristicCriteria()
        return {
          characteristicId: Number.isInteger(row.characteristicId) ? row.characteristicId : undefined,
          operation: ['values', 'range', 'exists'].includes(row.operation) ? row.operation : 'values',
          values: typeof row.values === 'string' ? row.values : '',
          min: numeric(row.min), max: numeric(row.max), exists: typeof row.exists === 'boolean' ? row.exists : true,
        }
      }) : [],
    }
  } catch {
    return fallback
  }
}
