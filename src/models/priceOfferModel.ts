export interface PriceOfferModel {
  id: string
  productId: number
  currencyId: number
  offerForStorage: string
  purchasePrice: number
  source: string
  availableQuantity: number
  minimumPurchaseQuantity: number
  quantityCoefficient: number
  daysToRefund: number
  deliveryDate: string
  guaranteedDeliveryDate: string
  deliveryProbability: number
  orderTill: string
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
