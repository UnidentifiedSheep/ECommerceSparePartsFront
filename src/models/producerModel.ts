export interface ProducerModel {
  id: number
  name: string
  description?: string | null
}

export interface ProducerOtherNameModel {
  producerId: number
  otherName: string
  whereUsed: string
}