export enum RouteType {
  IntraCity = 'IntraCity',
  InterCity = 'InterCity',
  International = 'International',
}

export function routeTypeToText(type: RouteType): string {
  switch (type) {
    case RouteType.IntraCity:
      return 'Внутригородской'
    case RouteType.InterCity:
      return 'Междугородний'
    case RouteType.International:
      return 'Международный'
  }
}
