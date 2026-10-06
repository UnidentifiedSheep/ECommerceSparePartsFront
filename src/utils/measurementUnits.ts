import type { DimensionUnit, WeightUnit } from '@/services/api/products.ts'
import { getCurrentLocale, t } from '@/i18n'

export type DimensionUnitLike = string | number | null | undefined
export type WeightUnitLike = string | number | null | undefined

export const dimensionSearchUnitOptions = [
  { value: 'Meter', get label() { return t('products.units.meters') } },
  { value: 'Centimeter', get label() { return t('products.units.centimeters') } },
  { value: 'Millimeter', get label() { return t('products.units.millimeters') } },
] as const

export const dimensionSetUnitOptions: { value: DimensionUnit; label: string }[] = [
  { value: 'Millimeter', get label() { return t('products.units.millimeters') } },
  { value: 'Centimeter', get label() { return t('products.units.centimeters') } },
  { value: 'Meter', get label() { return t('products.units.meters') } },
]

export const weightSetUnitOptions: { value: WeightUnit; label: string }[] = [
  { value: 'Gram', get label() { return t('products.units.grams') } },
  { value: 'Kilogram', get label() { return t('products.units.kilograms') } },
  { value: 'Tonne', get label() { return t('products.units.tonnes') } },
]

export function dimensionUnitLabel(unit: DimensionUnitLike) {
  switch (unit) {
    case 0:
    case 'Millimeter':
      return t('products.units.millimeters')
    case 1:
    case 'Centimeter':
      return t('products.units.centimeters')
    case 2:
    case 'Meter':
      return t('products.units.meters')
    default:
      return '-'
  }
}

export function dimensionMeasureUnitLabel(unit: DimensionUnitLike) {
  switch (unit) {
    case 0:
    case 'Millimeter':
      return t('products.units.millimeterShort')
    case 1:
    case 'Centimeter':
      return t('products.units.centimeterShort')
    case 2:
    case 'Meter':
      return t('products.units.meterShort')
    default:
      return '-'
  }
}

export function weightUnitLabel(unit: WeightUnitLike) {
  switch (unit) {
    case 0:
    case 'Gram':
      return t('products.units.grams')
    case 1:
    case 'Kilogram':
      return t('products.units.kilograms')
    case 2:
    case 'Tonne':
      return t('products.units.tonnes')
    default:
      return '-'
  }
}

export function weightMeasureUnitLabel(unit: WeightUnitLike, value: number) {
  const form = new Intl.PluralRules(getCurrentLocale()).select(value)

  switch (unit) {
    case 0:
    case 'Gram':
      return measureUnitForm(form, 'products.units.gramOne', 'products.units.gramFew', 'products.units.gramMany')
    case 1:
    case 'Kilogram':
      return measureUnitForm(form, 'products.units.kilogramOne', 'products.units.kilogramFew', 'products.units.kilogramMany')
    case 2:
    case 'Tonne':
      return measureUnitForm(form, 'products.units.tonneOne', 'products.units.tonneFew', 'products.units.tonneMany')
    default:
      return '-'
  }
}

function measureUnitForm(form: Intl.LDMLPluralRule, one: string, few: string, many: string) {
  if (form === 'one') return t(one)
  if (form === 'few') return t(few)
  return t(many)
}

export function toDimensionUnit(unit: DimensionUnitLike): DimensionUnit {
  switch (unit) {
    case 0:
    case 'Millimeter':
      return 'Millimeter'
    case 1:
    case 'Centimeter':
      return 'Centimeter'
    default:
      return 'Meter'
  }
}

export function toWeightUnit(unit: WeightUnitLike): WeightUnit {
  switch (unit) {
    case 0:
    case 'Gram':
      return 'Gram'
    case 2:
    case 'Tonne':
      return 'Tonne'
    default:
      return 'Kilogram'
  }
}
