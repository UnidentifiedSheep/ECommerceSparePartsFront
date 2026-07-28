export const PriceOfferSource = {
  OurWarehouse: 'OurWarehouse',
  Armtek: 'Armtek',
  FavoriteParts: 'FavoriteParts',
  Tmtr: 'Tmtr',
} as const

export type PriceOfferSource = (typeof PriceOfferSource)[keyof typeof PriceOfferSource]

export interface PriceOfferModel {
  id: string
  productId: number
  currencyId: number
  offerForStorage: string
  purchasePrice: number
  source: PriceOfferSource
  availableQuantity: number
  minimumPurchaseQuantity: number
  quantityCoefficient: number
  daysToRefund: number
  deliveryDate: string | null
  guaranteedDeliveryDate: string | null
  deliveryProbability: number
  orderTill: string | null
  expiresAt: string
}

export interface PriceOptionModel {
  priceOfferId: string
  score: number
  currencyId: number
  sellPrice: number
  markup: number
  forStorage: string
  deliveryTime: string
  guaranteedDeliveryTime: string
  deliveryProbability: number
  offer: PriceOfferModel
}
