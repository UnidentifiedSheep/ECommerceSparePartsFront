import api from '@/services/api/api.ts'
import { normalizeObjectSchema, type ObjectSchema } from '@/models/schemaModel.ts'

export interface SettingModel {
  systemName: string
  name: string
  description: string
  inputData: ObjectSchema
  outputData: string
  outputMetadata: ObjectSchema
}

export interface GetSettingsResponse {
  settings: SettingModel[]
}

export interface UpdateSettingRequest {
  json: string
}

export async function getServiceSettings(serviceKey: string): Promise<GetSettingsResponse> {
  const resp = await api.get<GetSettingsResponse>(`/${serviceKey}/settings`)
  return {
    settings: resp.data.settings.map((setting) => ({
      ...setting,
      inputData: normalizeObjectSchema(setting.inputData),
      outputMetadata: normalizeObjectSchema(setting.outputMetadata),
    })),
  }
}

export async function updateServiceSetting(serviceKey: string, settingName: string, req: UpdateSettingRequest): Promise<void> {
  await api.put(`/${serviceKey}/settings/${encodeURIComponent(settingName)}`, req)
}
