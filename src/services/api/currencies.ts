import type { CurrencyModel } from '@/models/currencyModel.ts'
import { clampPageSize } from '@/services/api/api.ts'
import { graphqlClient } from '@/services/graphql/client'
import { CurrencyHistoryDocument } from '@/graphql/generated/graphql'
import { AllCurrenciesDocument, BaseCurrencyDocument, CreateCurrencyDocument, UpdateCurrencyRatesDocument } from '@/graphql/generated/graphql'
import { operationRequest } from '@/services/graphql/operationErrors'

export interface GetCurrenciesResponse {
  currencies: CurrencyModel[]
}

export interface GetBaseCurrencyResponse {
  currency: CurrencyModel
}

export interface CurrencyRateHistoryModel {
  id: number
  fromCurrency: CurrencyModel
  toCurrency: CurrencyModel
  rate: number
  createdAt: string
}

export interface GetCurrencyHistoryRequest {
  currencyId: number
  page: number
  size: number
}

export interface GetCurrencyHistoryResponse {
  history: CurrencyRateHistoryModel[]
}

export interface CreateCurrencyRequest {
  shortName: string
  name: string
  currencySign: string
  code: string
}

export interface CreateCurrencyResponse {
  id: number
}

export async function getCurrencies(): Promise<GetCurrenciesResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: AllCurrenciesDocument, fetchPolicy: 'no-cache' }))
  return { currencies: data.currencies.list }
}

export async function getBaseCurrency(): Promise<GetBaseCurrencyResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: BaseCurrencyDocument, fetchPolicy: 'no-cache' }))
  return { currency: data.currencies.base }
}

export async function getCurrencyHistory(req: GetCurrencyHistoryRequest): Promise<GetCurrencyHistoryResponse> {
  const { data } = await operationRequest(graphqlClient.query({
    query: CurrencyHistoryDocument,
    variables: { id: req.currencyId, pagination: { page: req.page, size: clampPageSize(req.size) } },
    fetchPolicy: 'no-cache',
  }))
  if (!data.currencies.byId) throw new Error('Currency not found')
  return { history: data.currencies.byId.history }
}

export async function createCurrency(req: CreateCurrencyRequest): Promise<CreateCurrencyResponse> {
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreateCurrencyDocument, variables: { input: req } }))
  if (!data) throw new Error('Currency creation returned no data')
  return { id: data.currencies.create.id }
}

export async function updateCurrencyRates(): Promise<void> {
  await operationRequest(graphqlClient.mutate({ mutation: UpdateCurrencyRatesDocument }))
}
