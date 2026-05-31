import type { StorageType } from '@/enums/storageType.ts'

export interface StorageModel {
  name: string
  description?: string
  location?: string
  type: StorageType
}
