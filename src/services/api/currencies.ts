import type { CurrencyModel } from '@/models/currencyModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

export interface GetCurrenciesResponse {
  currencies: CurrencyModel[]
}

export interface CurrencyRateHistoryModel {
  id: number
  fromCurrencyId: number
  toCurrencyId: number
  prevRate: number
  newRate: number
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

export async function getCurrencyHistory(req: GetCurrencyHistoryRequest): Promise<GetCurrencyHistoryResponse> {
  const resp = await api.get<GetCurrencyHistoryResponse>(`/main/currencies/${req.currencyId}/history`, {
    params: {
      page: req.page,
      size: clampPageSize(req.size),
    },
  })
  return resp.data
}

export async function createCurrency(req: CreateCurrencyRequest): Promise<CreateCurrencyResponse> {
  const resp = await api.post<CreateCurrencyResponse>('/main/currencies', req)
  return resp.data
}

export async function updateCurrencyRates(): Promise<void> {
  await api.post('/main/currencies/update')
}
