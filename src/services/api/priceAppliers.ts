import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { PriceAppliersDocument, PriceApplierUpsertDocument, PriceApplierDeleteDocument, type PriceApplierFieldsFragment, type PriceOfferSourceType as GqlUsage } from '@/graphql/generated/graphql'

export const PriceOfferSourceType = {
  Supplier: 'Supplier',
  OurWarehouse: 'OurWarehouse',
} as const

export type PriceOfferSourceType = (typeof PriceOfferSourceType)[keyof typeof PriceOfferSourceType]

export interface PriceApplierStateModel {
  priceApplierSystemName: string
  usage: PriceOfferSourceType
  order: number
  enabled: boolean
}

export interface PriceApplierModel {
  systemName: string
  name: string
  isDynamic: boolean
  dslLogic: string | null
  states: PriceApplierStateModel[]
}

export interface UpsertPriceApplierStateModel {
  usage: PriceOfferSourceType
  order: number | null
  enabled: boolean
}

export interface UpsertPriceApplierRequest {
  systemName: string
  name: string | null
  dslLogic: string | null
  states: UpsertPriceApplierStateModel[]
}

export async function getPriceAppliers(usage: PriceOfferSourceType): Promise<PriceApplierModel[]> {
  const { data } = await operationRequest(graphqlClient.query({
    query: PriceAppliersDocument, variables: { usage: gqlUsage(usage) }, fetchPolicy: 'no-cache',
  }))
  return data.priceAppliers.list.map(mapApplier)
}

export async function upsertPriceApplier(
  request: UpsertPriceApplierRequest,
): Promise<PriceApplierModel> {
  const { data } = await operationRequest(graphqlClient.mutate({
    mutation: PriceApplierUpsertDocument,
    variables: { input: { ...request, states: request.states.map(state => ({ ...state, usage: gqlUsage(state.usage) })) } },
  }))
  if (!data?.priceAppliers.upsert) throw new Error('Price applier not returned')
  return mapApplier(data.priceAppliers.upsert)
}

export async function deletePriceApplier(systemName: string): Promise<void> {
  await operationRequest(graphqlClient.mutate({ mutation: PriceApplierDeleteDocument, variables: { systemName } }))
}

function gqlUsage(usage: PriceOfferSourceType): GqlUsage {
  return usage === PriceOfferSourceType.Supplier ? 'SUPPLIER' : 'OUR_WAREHOUSE'
}

function mapApplier(applier: PriceApplierFieldsFragment): PriceApplierModel {
  return { ...applier, dslLogic: applier.dslLogic ?? null, states: applier.states.map(state => ({ ...state, usage: state.usage === 'SUPPLIER' ? PriceOfferSourceType.Supplier : PriceOfferSourceType.OurWarehouse })) }
}
