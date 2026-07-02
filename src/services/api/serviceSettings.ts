import api from '@/services/api/api.ts'

export interface SettingModel {
  systemName: string
  name: string
  description: string
  inputData: string
  outputData: string
  outputMetadata?: string | null
}

export interface GetSettingsResponse {
  settings: SettingModel[]
}

export interface UpdateSettingRequest {
  json: string
}

export async function getServiceSettings(serviceKey: string): Promise<GetSettingsResponse> {
  const resp = await api.get<GetSettingsResponse>(`/${serviceKey}/settings`)
  return resp.data
}

export async function updateServiceSetting(serviceKey: string, settingName: string, req: UpdateSettingRequest): Promise<void> {
  await api.put(`/${serviceKey}/settings/${encodeURIComponent(settingName)}`, req)
}
