import { t } from '@/i18n'

export enum LogisticPricingType {
  None = 'None',
  PerOrder = 'PerOrder',
  PerArea = 'PerArea',
  PerWeight = 'PerWeight',
  PerAreaAndWeight = 'PerAreaAndWeight',
  PerAreaOrWeight = 'PerAreaOrWeight',
}

export function pricingTypeToText(type: LogisticPricingType): string {
  switch (type) {
    case LogisticPricingType.None:
      return t('purchases.pricingTypes.None')
    case LogisticPricingType.PerOrder:
      return t('purchases.pricingTypes.PerOrder')
    case LogisticPricingType.PerArea:
      return t('purchases.pricingTypes.PerArea')
    case LogisticPricingType.PerWeight:
      return t('purchases.pricingTypes.PerWeight')
    case LogisticPricingType.PerAreaAndWeight:
      return t('purchases.pricingTypes.PerAreaAndWeight')
    case LogisticPricingType.PerAreaOrWeight:
      return t('purchases.pricingTypes.PerAreaOrWeight')
  }
}
