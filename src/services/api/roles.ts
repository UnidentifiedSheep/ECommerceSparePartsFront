import { clampPageSize } from '@/services/api/api.ts'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { ManagedRolesDocument, ManagedRoleDocument, UpsertRoleDocument, AddPermissionToRoleDocument } from '@/graphql/generated/graphql'
import type { PermissionModel } from '@/models/permissionModel.ts'

export interface RoleModel {
  systemName: string
  localizedName?: string | null
  description?: string | null
  createdAt?: string
  updatedAt?: string
  whoCreated?: string | null
  whoUpdated?: string | null
}

export interface GetRolesRequest {
  searchTerm?: string
  page: number
  size: number
  sortBy?: string[]
}

export interface GetRolesResponse {
  roles: RoleModel[]
}

export interface GetRoleResponse {
  role: RoleModel
  permissions: PermissionModel[]
}

export interface UpsertRoleRequest {
  name: string
  description?: string | null
}

export interface AddPermissionToRoleRequest {
  permissionName: string
}

export async function getRoles(req: GetRolesRequest): Promise<GetRolesResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: ManagedRolesDocument, variables: { input: { searchTerm: req.searchTerm, pagination: { page: req.page, size: clampPageSize(req.size) } } }, fetchPolicy: 'no-cache' }))
  return { roles: data.roles.list }
}

export async function getRole(roleSystemName: string): Promise<GetRoleResponse> {
  const { data } = await operationRequest(graphqlClient.query({ query: ManagedRoleDocument, variables: { name: roleSystemName }, fetchPolicy: 'no-cache' }))
  if (!data.roles.byName) throw new Error('Role not found')
  return { role: data.roles.byName, permissions: data.roles.byName.permissions }
}

export async function upsertRole(req: UpsertRoleRequest): Promise<void> {
  await operationRequest(graphqlClient.mutate({ mutation: UpsertRoleDocument, variables: { input: req } }))
}

export async function addPermissionToRole(roleSystemName: string, permissionSystemName: string): Promise<void> {
  await operationRequest(graphqlClient.mutate({ mutation: AddPermissionToRoleDocument, variables: { input: { roleName: roleSystemName, permissionName: permissionSystemName } } }))
}
