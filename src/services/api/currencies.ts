import type { CurrencyModel } from '@/models/currencyModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

export interface GetCurrenciesRequest {
  page: number
  size: number
}

export interface GetCurrenciesResponse {
  currencies: CurrencyModel[]
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

export async function getCurrencies(req: GetCurrenciesRequest): Promise<GetCurrenciesResponse> {
  const resp = await api.get<GetCurrenciesResponse>('/main/currencies', {
    params: {
      ...req,
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
