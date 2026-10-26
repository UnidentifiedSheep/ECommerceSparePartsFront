import type { CurrencyModel } from '@/models/currencyModel'
import type { OrganizationMemberModel, OrganizationModel, OrganizationType } from '@/models/organizationModel'
import { clampPageSize } from './api'
import { graphqlClient } from '@/services/graphql/client'
import { mapGqlOrganization, mapGqlUser, gqlSort } from '@/services/graphql/partyMapping'
import {
  ListOrganizationsDocument, OrganizationByIdDocument, OrganizationMembersDocument,
  OrganizationFinancesDocument, OrganizationSystemNameAvailableDocument,
  CreateOrganizationDocument, UpdateOrganizationDocument, AddOrganizationMemberDocument,
  ChangeOrganizationMemberRoleDocument, RemoveOrganizationMemberDocument, UpdateOrganizationFinancialProfileDocument,
  type GetOrganizationsInput, type OrganizationRole as GqlOrganizationRole,
} from '@/graphql/generated/graphql'

export interface GetOrganizationsRequest {
  searchTerm?: string
  ids?: string[]
  types?: OrganizationType[]
  page: number
  limit: number
  sortBy?: string[]
  showHidden?: boolean
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

export interface IsOrganizationSystemNameAvailableResponse {
  isAvailable: boolean
}

export interface UpdateOrganizationRequest {
  name?: string
  isHidden?: boolean
}

export interface UpdateOrganizationResponse {
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
  balances: OrganizationBalanceModel[]
}

const organizationTypes = { Individual: 'INDIVIDUAL', Business: 'BUSINESS', System: 'SYSTEM' } as const
export function organizationsInput(req: GetOrganizationsRequest): GetOrganizationsInput {
  return {
    pagination: { page: req.page, size: clampPageSize(req.limit) },
    searchTerm: req.searchTerm?.trim() || undefined,
    ids: req.ids, types: req.types?.map(type => organizationTypes[type]),
    sortBy: gqlSort(req.sortBy), showHidden: req.showHidden,
  }
}
export async function getOrganizations(req: GetOrganizationsRequest): Promise<GetOrganizationsResponse> {
  const { data } = await graphqlClient.query({ query: ListOrganizationsDocument, variables: { input: organizationsInput(req) }, fetchPolicy: 'no-cache' })
  return { organizations: data.organizations.list.map(mapGqlOrganization) }
}
export async function getOrganizationById(id: string): Promise<OrganizationModel | undefined> {
  const { data } = await graphqlClient.query({ query: OrganizationByIdDocument, variables: { id }, fetchPolicy: 'no-cache' })
  return data.organizations.byId ? mapGqlOrganization(data.organizations.byId) : undefined
}
export async function updateOrganization(organizationId: string, req: UpdateOrganizationRequest): Promise<UpdateOrganizationResponse> {
  const { data } = await graphqlClient.mutate({ mutation: UpdateOrganizationDocument, variables: { input: {
    organizationId,
    ...(req.name !== undefined ? { name: { isSet: true, value: req.name } } : {}),
    ...(req.isHidden !== undefined ? { isHidden: { isSet: true, value: req.isHidden } } : {}),
  } } })
  if (!data) throw new Error('Organization update returned no data')
  return { organization: mapGqlOrganization(data.organizations.update) }
}
export async function getOrganizationMembers(req: GetOrganizationMembersRequest): Promise<GetOrganizationMembersResponse> {
  const { data } = await graphqlClient.query({ query: OrganizationMembersDocument, variables: { id: req.organizationId, input: { pagination: { page: req.page, size: clampPageSize(req.limit) } } }, fetchPolicy: 'no-cache' })
  if (!data.organizations.byId) throw new Error('Organization not found')
  const roles = { OWNER: 'Owner', ADMIN: 'Admin', MANAGER: 'Manager', MEMBER: 'Member' } as const
  return { members: data.organizations.byId.members.map(member => ({ organizationId: req.organizationId, role: roles[member.role], user: mapGqlUser(member.user) })) }
}
export async function createOrganization(req: CreateOrganizationRequest): Promise<CreateOrganizationResponse> {
  const { data } = await graphqlClient.mutate({ mutation: CreateOrganizationDocument, variables: { input: { ownerId: req.ownerUserId, name: req.name, systemName: req.systemName } } })
  if (!data) throw new Error('Organization creation returned no data')
  return { organization: mapGqlOrganization(data.organizations.create) }
}
export async function isOrganizationSystemNameAvailable(systemName: string): Promise<IsOrganizationSystemNameAvailableResponse> {
  const { data } = await graphqlClient.query({ query: OrganizationSystemNameAvailableDocument, variables: { systemName }, fetchPolicy: 'no-cache' })
  return { isAvailable: data.organizations.isSystemNameAvailable }
}
export async function addOrganizationMember(req: AddOrganizationMemberRequest): Promise<void> {
  await graphqlClient.mutate({ mutation: AddOrganizationMemberDocument, variables: { input: { ...req, role: req.role.toUpperCase() as GqlOrganizationRole } } })
}
export async function changeOrganizationMemberRole(organizationId: string, userId: string, role: OrganizationMemberModel['role']): Promise<void> {
  await graphqlClient.mutate({ mutation: ChangeOrganizationMemberRoleDocument, variables: { input: { organizationId, userId, role: role.toUpperCase() as GqlOrganizationRole } } })
}
export async function removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
  await graphqlClient.mutate({ mutation: RemoveOrganizationMemberDocument, variables: { input: { organizationId, userId } } })
}
export async function getOrganizationFinancialInfo(organizationId: string): Promise<GetOrganizationFinancialInfoResponse> {
  const { data } = await graphqlClient.query({ query: OrganizationFinancesDocument, variables: { id: organizationId }, fetchPolicy: 'no-cache' })
  if (!data.organizations.byId) throw new Error('Organization not found')
  return data.organizations.byId.finances
}
export async function updateOrganizationFinancialInfo(organizationId: string, minimalAllowedBalance: number): Promise<void> {
  await graphqlClient.mutate({ mutation: UpdateOrganizationFinancialProfileDocument, variables: { input: { organizationId, minimalAllowedBalance: { isSet: true, value: minimalAllowedBalance } } } })
}
