import type { ProductModel } from '@/models/productModel.ts'
import type { ProducerModel, Supplier } from '@/models/producerModel.ts'

export interface SupplierProductNameModel {
  id: number
  supplierProductId: number
  name: string
}

export interface SupplierProductModel {
  id: number
  candidateId: string | null
  sku: string
  producer: string
  supplier: Supplier
  names: SupplierProductNameModel[]
}

export interface CatalogueCandidateCrossesModel {
  mapped: CatalogueCandidateReviewModel[]
  notMapped: SupplierProductModel[]
}

export interface CatalogueCandidateReviewModel {
  id: string
  producer: ProducerModel
  product: ProductModel | null
  sku: string
  supplierProducts: SupplierProductModel[]
  crosses?: CatalogueCandidateCrossesModel
}
