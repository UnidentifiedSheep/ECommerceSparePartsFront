import api, { clampPageSize } from '@/services/api/api.ts'
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
  sortBy?: string
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
  const resp = await api.get<GetRolesResponse>('/main/roles', {
    params: {
      ...req,
      size: clampPageSize(req.size),
    },
  })

  return resp.data
}

export async function getRole(roleSystemName: string): Promise<GetRoleResponse> {
  const resp = await api.get<GetRoleResponse>(`/main/roles/${encodeURIComponent(roleSystemName)}`)
  return {
    role: resp.data.role,
    permissions: resp.data.permissions ?? [],
  }
}

export async function upsertRole(req: UpsertRoleRequest): Promise<void> {
  await api.post('/main/roles', req)
}

export async function addPermissionToRole(roleSystemName: string, permissionSystemName: string): Promise<void> {
  await api.post(`/main/roles/${encodeURIComponent(roleSystemName)}/permissions/`, {
    permissionName: permissionSystemName,
  } satisfies AddPermissionToRoleRequest)
}
