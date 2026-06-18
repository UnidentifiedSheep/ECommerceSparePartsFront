import { t } from '@/i18n'

export enum RouteType {
  IntraCity = 'IntraCity',
  InterCity = 'InterCity',
  International = 'International',
}

export function routeTypeToText(type: RouteType): string {
  switch (type) {
    case RouteType.IntraCity:
      return t('purchases.routeTypes.IntraCity')
    case RouteType.InterCity:
      return t('purchases.routeTypes.InterCity')
    case RouteType.International:
      return t('purchases.routeTypes.International')
  }
}
