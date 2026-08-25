import type { StorageType } from '@/enums/storageType.ts'

export interface StorageModel {
  code: string
  description?: string
  location?: string
  type: StorageType
}
