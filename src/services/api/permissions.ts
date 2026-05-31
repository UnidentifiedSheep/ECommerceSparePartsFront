import type { PermissionModel } from '@/models/permissionModel.ts'
import api, { clampPageSize } from '@/services/api/api.ts'

export interface GetPermissionsRequest {
  page: number
  size: number
}

export interface GetPermissionsResponse {
  permissions: PermissionModel[]
}

export async function getPermissions(req: GetPermissionsRequest): Promise<GetPermissionsResponse> {
  const resp = await api.get<GetPermissionsResponse>('/main/permissions', {
    params: {
      ...req,
      size: clampPageSize(req.size),
    },
  })
  return resp.data
}
