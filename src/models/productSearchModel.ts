export interface ProductDimensionsModel {
  length: number
  width: number
  height: number
  unit: string
  volumeM3: number
}

export interface ProductWeightModel {
  value: number
  unit: string
  weightKg: number
}

export interface ProductSearchModel {
  id: number
  sku: string
  name: string
  producerId: number
  dimensions?: ProductDimensionsModel | null
  weight?: ProductWeightModel | null
}
