import type { DimensionUnit, WeightUnit } from '@/services/api/products.ts'

export type DimensionUnitLike = string | number | null | undefined
export type WeightUnitLike = string | number | null | undefined

export const dimensionSearchUnitOptions = [
  { value: 'Meter', label: 'Метры' },
  { value: 'Centimeter', label: 'Сантиметры' },
  { value: 'Millimeter', label: 'Миллиметры' },
] as const

export const dimensionSetUnitOptions: { value: DimensionUnit; label: string }[] = [
  { value: 0, label: 'Миллиметры' },
  { value: 1, label: 'Сантиметры' },
  { value: 2, label: 'Метры' },
]

export const weightSetUnitOptions: { value: WeightUnit; label: string }[] = [
  { value: 0, label: 'Граммы' },
  { value: 1, label: 'Килограммы' },
  { value: 2, label: 'Тонны' },
]

export function dimensionUnitLabel(unit: DimensionUnitLike) {
  switch (unit) {
    case 0:
    case 'Millimeter':
      return 'миллиметры'
    case 1:
    case 'Centimeter':
      return 'сантиметры'
    case 2:
    case 'Meter':
      return 'метры'
    default:
      return '-'
  }
}

export function dimensionMeasureUnitLabel(unit: DimensionUnitLike) {
  switch (unit) {
    case 0:
    case 'Millimeter':
      return 'миллиметров'
    case 1:
    case 'Centimeter':
      return 'сантиметров'
    case 2:
    case 'Meter':
      return 'метров'
    default:
      return '-'
  }
}

export function weightUnitLabel(unit: WeightUnitLike) {
  switch (unit) {
    case 0:
    case 'Gram':
      return 'граммы'
    case 1:
    case 'Kilogram':
      return 'килограммы'
    case 2:
    case 'Tonne':
      return 'тонны'
    default:
      return '-'
  }
}

export function weightMeasureUnitLabel(unit: WeightUnitLike, value: number) {
  const form = new Intl.PluralRules('ru-RU').select(value)

  switch (unit) {
    case 0:
    case 'Gram':
      return russianMeasureUnitForm(form, 'грамм', 'грамма', 'граммов')
    case 1:
    case 'Kilogram':
      return russianMeasureUnitForm(form, 'килограмм', 'килограмма', 'килограммов')
    case 2:
    case 'Tonne':
      return russianMeasureUnitForm(form, 'тонна', 'тонны', 'тонн')
    default:
      return '-'
  }
}

function russianMeasureUnitForm(form: Intl.LDMLPluralRule, one: string, few: string, many: string) {
  if (form === 'one') return one
  if (form === 'few') return few
  return many
}

export function toDimensionUnit(unit: DimensionUnitLike): DimensionUnit {
  switch (unit) {
    case 0:
    case 'Millimeter':
      return 0
    case 1:
    case 'Centimeter':
      return 1
    default:
      return 2
  }
}

export function toWeightUnit(unit: WeightUnitLike): WeightUnit {
  switch (unit) {
    case 0:
    case 'Gram':
      return 0
    case 2:
    case 'Tonne':
      return 2
    default:
      return 1
  }
}
