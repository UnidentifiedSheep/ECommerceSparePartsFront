import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { ProductRecommendedPriceDocument } from '@/graphql/generated/graphql'

export interface PriceRecommendationRequest {
  productId: number
  currencyId: number
  storageCode: string
  quantity: number
}

export interface PriceRecommendationModel {
  currencyId: number
  quantity: number
  missingQuantity: number
  unitPrice: number | null
  totalPrice: number | null
}

export interface AppliedPriceRecommendation extends PriceRecommendationRequest {
  unitPrice: number
  selectionKey?: number
}

export async function getProductRecommendedPrice(req: PriceRecommendationRequest): Promise<PriceRecommendationModel> {
  const { productId, ...input } = req
  const { data } = await operationRequest(graphqlClient.query({
    query: ProductRecommendedPriceDocument,
    variables: { id: productId, input: { ...input, sources: [] } },
    fetchPolicy: 'no-cache',
  }))
  if (!data.products.byId) throw new Error('Product not found')
  const recommendation = data.products.byId.recommendedPrice
  return { ...recommendation, currencyId: recommendation.currency.id }
}
