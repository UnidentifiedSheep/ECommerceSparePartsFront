import api from '@/services/api/api.ts'

export interface LoginRequest {
  login: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  deviceId: string
}

export interface IsUserNameAvailableResponse {
  isAvailable: boolean
}

export interface PasswordRecoveryRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  previousPassword: string
  newPassword: string
}

export interface VerifyEmailRequest {
  token: string
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const resp = await api.post<LoginResponse>('/main/auth/login', req)
  return resp.data
}

export async function isUserNameAvailable(userName: string): Promise<IsUserNameAvailableResponse> {
  const resp = await api.get<IsUserNameAvailableResponse>(
    `/main/auth/usernames/${encodeURIComponent(userName)}/availability`,
  )
  return resp.data
}

export async function sendPasswordRecoveryEmail(req: PasswordRecoveryRequest): Promise<void> {
  await api.post('/main/auth/password/recovery', req)
}

export async function resetPassword(req: ResetPasswordRequest): Promise<void> {
  await api.post('/main/auth/password/reset', req)
}

export async function changePassword(req: ChangePasswordRequest): Promise<void> {
  await api.post('/main/auth/password/', req)
}

export async function verifyEmail(req: VerifyEmailRequest): Promise<void> {
  await api.post('/main/users/emails/verification/verify', req)
}
