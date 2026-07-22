import type { CurrencyModel } from '@/models/currencyModel.ts'
import {
  mapOrganizationModel,
  type OrganizationDto,
  type OrganizationMemberModel,
  type OrganizationModel,
  type OrganizationType,
} from '@/models/organizationModel.ts'
import { mapUserModel, type UserDto } from '@/models/userModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

interface OrganizationMemberDto extends Omit<OrganizationMemberModel, 'user'> {
  user: UserDto
}

export interface GetOrganizationsRequest {
  searchTerm?: string
  ids?: string[]
  types?: OrganizationType[]
  page: number
  limit: number
  sortBy?: string
}

export interface GetOrganizationsResponse {
  organizations: OrganizationModel[]
}

export interface GetOrganizationMembersRequest {
  organizationId: string
  page: number
  limit: number
}

export interface GetOrganizationMembersResponse {
  members: OrganizationMemberModel[]
}

export interface CreateOrganizationRequest {
  ownerUserId: string
  name: string
  systemName: string
}

export interface CreateOrganizationResponse {
  organization: OrganizationModel
}

export interface AddOrganizationMemberRequest {
  organizationId: string
  userId: string
  role: OrganizationMemberModel['role']
}

export interface OrganizationFinancialProfileModel {
  netPositionInBaseCurrency: number
  minimalAllowedBalance: number
}

export interface OrganizationBalanceModel {
  currency: CurrencyModel
  balance: number
}

export interface GetOrganizationFinancialInfoResponse {
  financialProfile: OrganizationFinancialProfileModel | null
  baseCurrency: CurrencyModel
  balances: OrganizationBalanceModel[]
}

export interface UpdateOrganizationFinancialInfoResponse {
  financialProfile: OrganizationFinancialProfileModel
}

export async function getOrganizations(req: GetOrganizationsRequest): Promise<GetOrganizationsResponse> {
  const params = new URLSearchParams()
  if (req.searchTerm?.trim()) params.append('searchTerm', req.searchTerm.trim())
  req.ids?.forEach((id) => params.append('ids', id))
  req.types?.forEach((type) => params.append('types', type))
  params.append('page', String(req.page))
  params.append('limit', String(clampPageSize(req.limit)))
  if (req.sortBy) params.append('sortBy', req.sortBy)

  const response = await api.get<{ organizations: OrganizationDto[] }>('/main/organizations', { params })
  return {
    organizations: response.data.organizations.map(mapOrganizationModel),
  }
}

export async function getOrganizationMembers(
  req: GetOrganizationMembersRequest,
): Promise<GetOrganizationMembersResponse> {
  const response = await api.get<{ members: OrganizationMemberDto[] }>(
    `/main/organizations/${req.organizationId}/members`,
    { params: { page: req.page, limit: clampPageSize(req.limit) } },
  )

  return {
    members: response.data.members.map((member) => ({
      ...member,
      user: mapUserModel(member.user),
    })),
  }
}

export async function createOrganization(req: CreateOrganizationRequest): Promise<CreateOrganizationResponse> {
  const response = await api.post<{ organization: OrganizationDto }>(`/main/users/${req.ownerUserId}/organizations`, {
    name: req.name,
    systemName: req.systemName,
  })
  return {
    organization: mapOrganizationModel(response.data.organization),
  }
}

export async function addOrganizationMember(req: AddOrganizationMemberRequest): Promise<void> {
  await api.post(`/main/organizations/${req.organizationId}/members`, {
    userId: req.userId,
    role: req.role,
  })
}

export async function changeOrganizationMemberRole(
  organizationId: string,
  userId: string,
  role: OrganizationMemberModel['role'],
): Promise<void> {
  await api.patch(`/main/organizations/${organizationId}/members/${userId}/role`, { role })
}

export async function removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
  await api.delete(`/main/organizations/${organizationId}/members/${userId}`)
}

export async function getOrganizationFinancialInfo(
  organizationId: string,
): Promise<GetOrganizationFinancialInfoResponse> {
  const response = await api.get<GetOrganizationFinancialInfoResponse>(
    `/main/organizations/${organizationId}/finances`,
  )
  return {
    ...response.data,
    balances: response.data.balances ?? [],
  }
}

export async function updateOrganizationFinancialInfo(
  organizationId: string,
  minimalAllowedBalance: number,
): Promise<UpdateOrganizationFinancialInfoResponse> {
  const response = await api.patch<UpdateOrganizationFinancialInfoResponse>(
    `/main/organizations/${organizationId}/finances`,
    {
      financialProfile: {
        minimalAllowedBalance: {
          isSet: true,
          value: minimalAllowedBalance,
        },
      },
    },
  )
  return response.data
}
