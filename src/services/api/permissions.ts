import type { PermissionModel } from '@/models/permissionModel.ts'
import api from '@/services/api/api.ts'

export interface GetPermissionsResponse {
  permissions: PermissionModel[]
}

export async function getPermissions(): Promise<GetPermissionsResponse> {
  const resp = await api.get<GetPermissionsResponse>('/main/permissions')
  return resp.data
}
