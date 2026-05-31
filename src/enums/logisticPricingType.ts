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
      return 'Без тарифа'
    case LogisticPricingType.PerOrder:
      return 'За заказ'
    case LogisticPricingType.PerArea:
      return 'За объём'
    case LogisticPricingType.PerWeight:
      return 'За вес'
    case LogisticPricingType.PerAreaAndWeight:
      return 'Объём и вес'
    case LogisticPricingType.PerAreaOrWeight:
      return 'Объём или вес'
  }
}
