import type { PriceOfferSource, PriceOptionModel } from '@/models/priceOfferModel.ts'
import { clampPageSize } from '@/services/api/api.ts'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { gqlSort } from '@/services/graphql/partyMapping'
import { ProductPriceOffersDocument, type PriceOfferSource as GqlSource } from '@/graphql/generated/graphql'

export interface GetPriceOffersForProductRequest {
  productId: number
  currencyId: number
  sources?: PriceOfferSource[]
  storageCode: string
  page: number
  size: number
  sortBy?: string[]
}

export interface GetPriceOffersForProductResponse {
  priceOptions: PriceOptionModel[]
}

export async function getPriceOffersForProduct(
  req: GetPriceOffersForProductRequest,
): Promise<GetPriceOffersForProductResponse> {
  const sources = { OurWarehouse: 'OUR_WAREHOUSE', Armtek: 'ARMTEK', FavoriteParts: 'FAVORITE_PARTS', Tmtr: 'TMTR' } as const satisfies Record<PriceOfferSource, GqlSource>
  const modelSources = { OUR_WAREHOUSE: 'OurWarehouse', ARMTEK: 'Armtek', FAVORITE_PARTS: 'FavoriteParts', TMTR: 'Tmtr' } as const satisfies Record<GqlSource, PriceOfferSource>
  const { data } = await operationRequest(graphqlClient.query({
    query: ProductPriceOffersDocument,
    variables: { id: req.productId, input: {
      currencyId: req.currencyId, storageCode: req.storageCode,
      sources: req.sources?.map(source => sources[source]) ?? [],
      pagination: { page: req.page, size: clampPageSize(req.size) }, sortBy: gqlSort(req.sortBy),
    } },
    fetchPolicy: 'no-cache',
  }))
  if (!data.products.byId) throw new Error('Product not found')
  return { priceOptions: data.products.byId.offers.map(option => ({
    ...option, currencyId: option.currency.id,
    offer: { ...option.offer, productId: option.offer.product.id, currencyId: option.offer.currency.id,
      source: modelSources[option.offer.source], deliveryDate: option.offer.deliveryDate ?? null,
      guaranteedDeliveryDate: option.offer.guaranteedDeliveryDate ?? null, orderTill: option.offer.orderTill ?? null },
  })) }
}
