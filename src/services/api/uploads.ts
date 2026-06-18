import axios from 'axios'
import api from '@/services/api/api.ts'
import { t } from '@/i18n'

export interface UploadFileModel {
  key: string
  size: number
  lastModified: string | null
  fullPath: string
}

export interface GetUploadsRequest {
  cursor?: string | null
  size?: number
}

export interface GetUploadsResponse {
  files: UploadFileModel[]
  nextCursor: string | null
  hasMore: boolean
}

export interface CreateUploadRequest {
  fileName: string
  contentType: string
}

export interface CreateUploadResponse {
  uploadUrl?: string
  UploadUrl?: string
}

export async function getUploads(req: GetUploadsRequest = {}): Promise<GetUploadsResponse> {
  const resp = await api.get<GetUploadsResponse>('/main/uploads', {
    params: {
      cursor: req.cursor || undefined,
      size: req.size ?? 100,
    },
  })

  return resp.data
}

export async function uploadFile(file: File): Promise<UploadFileModel> {
  const createResp = await api.post<CreateUploadResponse>('/main/uploads/create', {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
  } satisfies CreateUploadRequest)

  const uploadUrl = createResp.data.uploadUrl ?? createResp.data.UploadUrl
  if (!uploadUrl) {
    throw new Error(t('common.messages.uploadUrlMissing'))
  }

  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })

  await api.post('/main/uploads/complete', {
    fileName: file.name,
  })

  return {
    key: file.name,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
    fullPath: '',
  }
}
