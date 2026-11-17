import { PhoneType } from '@/enums/phoneType'
import type { OrganizationModel, OrganizationType } from '@/models/organizationModel'
import type { UserInfoModel, UserModel } from '@/models/userModel'
import type { PermissionModel } from '@/models/permissionModel'
import { clampPageSize } from './api'
import { EmailOptionsDocument } from '@/graphql/generated/graphql'
import { graphqlClient } from '@/services/graphql/client'
import { mapGqlUser, mapGqlOrganization } from '@/services/graphql/partyMapping'
import { organizationsInput } from './organizations'
import { useAuthStore } from '@/stores/authStore'
import {
  UserPreviewDocument, ListOrganizationsDocument, ListUsersDocument, SearchUsersDocument, UserDetailsDocument,
  CreateUserDocument, EditUserInfoDocument, AddUserEmailDocument, RemoveUserEmailDocument,
  RequestUserEmailVerificationDocument, RequestMyEmailVerificationDocument,
  MakeUserEmailPrimaryDocument, MakeMyEmailPrimaryDocument,
  AddUserRolesDocument, RemoveUserRolesDocument, AddUserPermissionsDocument, RemoveUserPermissionsDocument,
  type GetUsersInput, type EmailType as GqlEmailType, type PhoneType as GqlPhoneType,
} from '@/graphql/generated/graphql'

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
  page: number
  limit: number
}

export interface GetUsersResponse {
  users: UserModel[]
  hasNext: boolean
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

export interface CreateUserPhoneRequest {
  number: string
  type: PhoneType
  isConfirmed: boolean
  isPrimary: boolean
}

export interface CreateUserRequest {
  userName: string
  password: string
  userInfo: CreateUserInfoRequest
  emails: CreateUserEmailRequest[]
  phones: CreateUserPhoneRequest[]
  roles: string[]
}

export interface CreateUserResponse {
  user: UserModel
}

export interface EditUserInfoRequest {
  userId: string
  userInfo: CreateUserInfoRequest
}

export interface EditUserInfoResponse {
  userInfo: UserInfoModel
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

export interface UserPhoneModel {
  number: string
  type: PhoneType
  isConfirmed: boolean
  isPrimary: boolean
}

export interface GetUserFullInfoResponse {
  user: UserModel
  emails: UserEmailModel[]
  phones: UserPhoneModel[]
  roles: string[]
  permissions: string[]
  permissionDetails: PermissionModel[]
}

export interface GetUserOrganizationsRequest {
  searchTerm?: string
  ids?: string[]
  types?: OrganizationType[]
  page: number
  limit: number
  sortBy?: string[]
}

export interface GetUserOrganizationsResponse {
  organizations: OrganizationModel[]
}

export interface AddPermissionToUserRequest {
  userId: string
  permission: string
}

export interface AddRoleToUserRequest {
  userId: string
  roleName: string
}

export interface RemoveEmailFromUserRequest {
  userId: string
  email: string
}

export type EmailType = 'Personal' | 'Work' | 'Unknown'

export interface AddEmailToUserRequest {
  userId: string
  email: string
  emailType: EmailType
}

export interface RequestUserEmailVerificationRequest {
  userId: string
  email: string
}

export async function getUsers(req: GetUsersRequest): Promise<GetUsersResponse> {
  const pagination = { page: req.page, size: clampPageSize(req.limit) }
  const { searchTerm, id, name, surname, userName, email, phone, description, roles } = req
  const fields = { id, name, surname, userName, email, phone, description, roles }
  // Column filters take precedence over the retained general search.
  const filtered = [fields.id, fields.name, fields.surname, fields.userName, fields.email, fields.phone, fields.description].some(value => value?.trim())
  const term = searchTerm?.trim()
  const users = term && !filtered
    ? (await graphqlClient.query({ query: SearchUsersDocument, variables: { input: { searchTerm: term, roles: req.roles, pagination } }, fetchPolicy: 'no-cache' })).data.users.search
    : (await graphqlClient.query({ query: ListUsersDocument, variables: { input: { ...fields, pagination } satisfies GetUsersInput }, fetchPolicy: 'no-cache' })).data.users.list
  return { users: users.map(mapGqlUser), hasNext: users.length === pagination.size }
}
export async function createUser(req: CreateUserRequest): Promise<CreateUserResponse> {
  const { data } = await graphqlClient.mutate({ mutation: CreateUserDocument, variables: { input: {
    ...req,
    emails: req.emails.map(email => ({ ...email, type: email.type.toUpperCase() as GqlEmailType })),
    phones: req.phones.map(phone => ({ ...phone, type: phone.type.toUpperCase() as GqlPhoneType })),
  } } })
  if (!data) throw new Error('User creation returned no data')
  return { user: mapGqlUser(data.users.create) }
}
export async function editUserInfo(req: EditUserInfoRequest): Promise<EditUserInfoResponse> {
  const { data } = await graphqlClient.mutate({ mutation: EditUserInfoDocument, variables: { input: req } })
  if (!data?.users.editInfo.info) throw new Error('User update returned no profile')
  return { userInfo: { ...data.users.editInfo.info, description: data.users.editInfo.info.description ?? undefined } }
}
export async function getEmailOptions(): Promise<GetEmailOptionsResponse> {
  const { data } = await graphqlClient.query({ query: EmailOptionsDocument, fetchPolicy: 'no-cache' })
  return { emailOptions: data.options.emails }
}
export async function getUserFullInfo(userId: string): Promise<GetUserFullInfoResponse> {
  const permissions = useAuthStore().user?.permissions ?? []
  const includeInfo = permissions.some(permission => permission.trim().replace(/[._]/g, '').toUpperCase() === 'USERSINFOGET')
  const { data } = await graphqlClient.query({ query: UserDetailsDocument, variables: { id: userId, includeInfo }, fetchPolicy: 'no-cache' })
  const user = data.users.byId
  if (!user) throw new Error('User not found')
  const phoneTypes = { MOBILE: PhoneType.Mobile, WORK: PhoneType.Work, HOME: PhoneType.Home, UNKNOWN: PhoneType.Unknown }
  const emailTypes = { PERSONAL: 'Personal', WORK: 'Work', UNKNOWN: 'Unknown' }
  return {
    user: mapGqlUser(user),
    emails: user.emails?.map(email => ({ ...email, emailType: emailTypes[email.emailType] })) ?? [],
    phones: user.phones?.map(phone => ({ ...phone, type: phoneTypes[phone.type] })) ?? [],
    roles: user.roles?.map(role => role.systemName) ?? [],
    permissions: user.permissions?.map(permission => permission.systemName) ?? [],
    permissionDetails: user.permissions ?? [],
  }
}
export async function getUserOrganizations(userId: string, req: GetUserOrganizationsRequest): Promise<GetUserOrganizationsResponse> {
  const input = organizationsInput(req)
  // The root list supports the same user filter and avoids requiring USERS_GET.
  const { data } = await graphqlClient.query({ query: ListOrganizationsDocument, variables: { input: { ...input, userId } }, fetchPolicy: 'no-cache' })
  return { organizations: data.organizations.list.map(mapGqlOrganization) }
}
export async function addPermissionsToUser(req: { userId: string; permissions: string[] }): Promise<void> {
  await graphqlClient.mutate({ mutation: AddUserPermissionsDocument, variables: { input: { userId: req.userId, permissions: req.permissions } } })
}
export async function removePermissionFromUser(req: AddPermissionToUserRequest): Promise<void> {
  await graphqlClient.mutate({ mutation: RemoveUserPermissionsDocument, variables: { input: { userId: req.userId, permissions: [req.permission] } } })
}
export async function addRolesToUser(req: { userId: string; roles: string[] }): Promise<void> {
  await graphqlClient.mutate({ mutation: AddUserRolesDocument, variables: { input: { userId: req.userId, roles: req.roles } } })
}
export async function removeRoleFromUser(req: AddRoleToUserRequest): Promise<void> {
  await graphqlClient.mutate({ mutation: RemoveUserRolesDocument, variables: { input: { userId: req.userId, roles: [req.roleName] } } })
}
export async function removeEmailFromUser(req: RemoveEmailFromUserRequest): Promise<void> {
  await graphqlClient.mutate({ mutation: RemoveUserEmailDocument, variables: { input: req } })
}
export async function requestUserEmailVerification(req: RequestUserEmailVerificationRequest): Promise<void> {
  await graphqlClient.mutate({ mutation: RequestUserEmailVerificationDocument, variables: { input: req } })
}
export async function makeUserEmailPrimary(req: RequestUserEmailVerificationRequest): Promise<void> {
  await graphqlClient.mutate({ mutation: MakeUserEmailPrimaryDocument, variables: { input: req } })
}
export async function addEmailToUser(req: AddEmailToUserRequest): Promise<void> {
  await graphqlClient.mutate({ mutation: AddUserEmailDocument, variables: { input: { userId: req.userId, email: req.email, type: req.emailType.toUpperCase() as GqlEmailType } } })
}
export async function requestMyEmailVerification(email: string): Promise<void> {
  await graphqlClient.mutate({ mutation: RequestMyEmailVerificationDocument, variables: { email } })
}
export async function makeMyEmailPrimary(email: string): Promise<void> {
  await graphqlClient.mutate({ mutation: MakeMyEmailPrimaryDocument, variables: { email } })
}

export async function getUserPreview(userId: string) {
  const includeRoles = (useAuthStore().user?.permissions ?? []).some(permission => permission.trim().replace(/[._]/g, '').toUpperCase() === 'USERSINFOGET')
  const { data } = await graphqlClient.query({ query: UserPreviewDocument, variables: { id: userId, includeRoles }, fetchPolicy: 'no-cache' })
  const user = data.users.byId
  if (!user) throw new Error('User not found')
  return {
    user: mapGqlUser(user),
    roles: user.roles?.map(role => role.systemName) ?? [],
    roleLabels: Object.fromEntries(user.roles?.map(role => [role.systemName, role.localizedName || role.systemName]) ?? []),
  }
}
