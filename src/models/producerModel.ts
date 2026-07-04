export interface ProducerModel {
  id: number
  name: string
  description?: string | null
}

export interface ProducerAliasModel {
  producerId: number
  alias: string
}
