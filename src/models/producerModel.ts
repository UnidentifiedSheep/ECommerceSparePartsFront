export interface ProducerModel {
  id: number
  name: string
  description?: string | null
}

export interface ProducerAliasModel {
  producerId: number
  alias: string
}

export type Supplier = 'Armtek' | 'FavoritParts'

export interface ProducerSupplierMappingModel {
  id: number
  producerId: number
  supplier: Supplier
  supplierProducerName: string
}
