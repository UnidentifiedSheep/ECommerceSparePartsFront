export interface ProductModel {
  id: number
  sku: string
  name: string
  description?: string | null
  producerId: number
  producerName: string
  indicator?: string | null
  images: string[]
  stock: number
}

export interface ProductSizeModel {
  productId: number
  length: number
  width: number
  height: number
  unit: string | number
  volumeM3: number
}

export interface ProductWeightModel {
  productId: number
  weight: number
  unit: string
}
