import { t } from '@/i18n'

export enum StorageType {
  Warehouse = 'Warehouse',
  SupplierStorage = 'SupplierStorage',
}

export function toText(type: StorageType): string {
  switch (type) {
    case StorageType.Warehouse:
      return t('storages.types.Warehouse')
    case StorageType.SupplierStorage:
      return t('storages.types.SupplierStorage')
  }
}
