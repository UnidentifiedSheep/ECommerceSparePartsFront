import { GeneralSearchStrategy } from '@/enums/generalSearchStrategy.ts'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { mapUserModel, type UserModel } from '@/models/userModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

export interface GetUsersRequest {
  searchTerm?: string
  id?: string
  name?: string
  surname?: string
  email?: string
  phone?: string
  userName?: string
  roles?: string[]
  description?: string
  similarityLevel?: number
  page: number
  limit: number
  searchMethod: GeneralSearchStrategy
}

export interface GetUsersResponse {
  users: UserModel[]
}

export interface CreateUserInfoRequest {
  name: string
  surname: string
  description?: string | null
}

export interface CreateUserEmailRequest {
  email: string
  isConfirmed: boolean
  isPrimary: boolean
  type: string
}

export interface CreateUserRequest {
  userName: string
  password: string
  userInfo: CreateUserInfoRequest
  emails: CreateUserEmailRequest[]
  phones: string[]
  roles: string[]
}

export interface CreateUserResponse {
  user: UserModel
}

export interface UserEmailOptionsModel {
  minEmailCount: number
  maxEmailCount: number
}

export interface GetEmailOptionsResponse {
  emailOptions: UserEmailOptionsModel
}

export interface UserEmailModel {
  email: string
  confirmed: boolean
  emailType: string
  isPrimary: boolean
  confirmedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface GetUserFullInfoResponse {
  user: UserModel
  emails: UserEmailModel[]
  roles: string[]
  permissions: string[]
}

export interface GetUserStoragesResponse {
  storages: StorageModel[]
}

export interface GetUserDiscountResponse {
  discount: number
}

export interface UserFinancialProfileModel {
  balance: number
}

export interface UserBalanceModel {
  currency: CurrencyModel
  balance: number
}

export interface GetUserFinancialInfoResponse {
  financialProfile: UserFinancialProfileModel | null
  baseCurrency: CurrencyModel
  balances: UserBalanceModel[]
}

export interface AddStorageToUserRequest {
  userId: string
  storageName: string
}

export interface RemoveStorageFromUserRequest {
  userId: string
  storageName: string
}

export interface ChangeUserDiscountRequest {
  userId: string
  newDiscountRate: number
}

export async function getUsers(req: GetUsersRequest): Promise<GetUsersResponse> {
  const params = new URLSearchParams()
  const appendParam = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return
    params.append(key, String(value))
  }

  appendParam('searchTerm', req.searchTerm)
  appendParam('id', req.id)
  appendParam('name', req.name)
  appendParam('surname', req.surname)
  appendParam('email', req.email)
  appendParam('phone', req.phone)
  appendParam('userName', req.userName)
  req.roles?.forEach((role) => appendParam('roles', role))
  appendParam('description', req.description)
  appendParam('similarityLevel', req.similarityLevel)
  appendParam('page', req.page)
  appendParam('limit', clampPageSize(req.limit))
  appendParam('searchMethod', req.searchMethod)

  const resp = await api.get<{ users: UserModel[] }>('/main/users', {
    params,
  })
  return {
    users: resp.data.users.map(mapUserModel),
  }
}

export async function createUser(req: CreateUserRequest): Promise<CreateUserResponse> {
  const resp = await api.post<{ user: UserModel }>('/main/users', req)

  return {
    user: mapUserModel(resp.data.user),
  }
}

export async function getEmailOptions(): Promise<GetEmailOptionsResponse> {
  const resp = await api.get<GetEmailOptionsResponse>('/main/options/emails')
  return resp.data
}

export async function getUserFullInfo(userId: string): Promise<GetUserFullInfoResponse> {
  const resp = await api.get<{
    user: UserModel
    emails: UserEmailModel[]
    roles: string[]
    permissions: string[]
  }>(`/main/users/${userId}/info`)

  return {
    user: mapUserModel(resp.data.user),
    emails: resp.data.emails,
    roles: resp.data.roles,
    permissions: resp.data.permissions,
  }
}

export async function getUserStorages(userId: string, page = 0, limit = 100): Promise<GetUserStoragesResponse> {
  const resp = await api.get<GetUserStoragesResponse>(`/main/users/${userId}/storages`, {
    params: { page, limit: clampPageSize(limit) },
  })
  return resp.data
}

export async function getUserDiscount(userId: string): Promise<GetUserDiscountResponse> {
  const resp = await api.get<GetUserDiscountResponse>(`/main/users/${userId}/discount`)
  return resp.data
}

export async function getUserFinancialInfo(userId: string): Promise<GetUserFinancialInfoResponse> {
  const resp = await api.get<GetUserFinancialInfoResponse>(`/main/users/${userId}/finances`)
  return {
    financialProfile: resp.data.financialProfile,
    baseCurrency: resp.data.baseCurrency,
    balances: resp.data.balances ?? [],
  }
}

export async function changeUserDiscount(req: ChangeUserDiscountRequest) {
  await api.patch(`/main/users/${req.userId}/discount`, {
    newDiscountRate: req.newDiscountRate,
  })
}

export async function addStorageToUser(req: AddStorageToUserRequest) {
  await api.post(`/main/users/${req.userId}/storages/${req.storageName}`)
}

export async function removeStorageFromUser(req: RemoveStorageFromUserRequest) {
  await api.delete(`/main/users/${req.userId}/storages/${req.storageName}`)
}
