import api from '@/services/api/api.ts'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  deviceId: string
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const resp = await api.post<LoginResponse>('/main/auth/login', req)
  return resp.data
}
