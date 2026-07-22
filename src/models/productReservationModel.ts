import type { OrganizationModel } from '@/models/organizationModel.ts'

export type ProductReservationStatus =
  | 'Active'
  | 'Locked'
  | 'Done'
  | 'Canceled'

export interface ProductReservationModel {
  id: number
  organization: OrganizationModel
  reservedCount: number
  currentCount: number
  proposedPrice?: number | null
  proposedCurrencyId?: number | null
  status: ProductReservationStatus
  comment?: string | null
  updatedAt: string
  whoUpdated?: string | null
}

export interface NewProductReservationModel {
  organizationId: string
  productId: number
  reservedCount: number
  currentCount: number
  proposedPrice?: number | null
  givenCurrencyId?: number | null
  comment?: string | null
}

export interface EditProductReservationModel {
  proposedPrice?: number | null
  givenCurrencyId?: number | null
  comment?: string | null
}

export interface ProductReservationHistoryModel {
  comment?: string | null
  proposePrice?: number | null
  proposedCurrencyId?: number | null
  updatedBy?: string | null
  updatedAt: string
}
