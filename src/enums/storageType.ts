export enum StorageType {
  Warehouse = 'Warehouse',
  SupplierStorage = 'SupplierStorage',
}

export function toText(type: StorageType): string {
  switch (type) {
    case StorageType.Warehouse:
      return 'Наш склад'
    case StorageType.SupplierStorage:
      return 'Склад поставщика'
  }
}
