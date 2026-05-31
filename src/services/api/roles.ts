import api, { clampPageSize } from '@/services/api/api.ts'

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

export async function getRoles(req: GetRolesRequest): Promise<GetRolesResponse> {
  const resp = await api.get<GetRolesResponse>('/main/roles', {
    params: {
      ...req,
      size: clampPageSize(req.size),
    },
  })

  return resp.data
}
