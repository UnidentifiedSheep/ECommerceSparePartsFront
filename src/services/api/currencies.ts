import type { CurrencyModel } from '@/models/currencyModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'
import { graphqlClient } from '@/services/graphql/client'
import { CurrencyHistoryDocument } from '@/graphql/generated/graphql'
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
  const resp = await api.get<GetCurrenciesResponse>('/main/currencies')
  return resp.data
}

export async function getBaseCurrency(): Promise<GetBaseCurrencyResponse> {
  const resp = await api.get<GetBaseCurrencyResponse>('/main/currencies/base')
  return resp.data
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
  const resp = await api.post<CreateCurrencyResponse>('/main/currencies', req)
  return resp.data
}

export async function updateCurrencyRates(): Promise<void> {
  await api.post('/main/currencies/update')
}
