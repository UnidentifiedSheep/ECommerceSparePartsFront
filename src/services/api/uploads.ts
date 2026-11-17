import axios from 'axios'
import { clampPageSize } from '@/services/api/api.ts'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { UploadsDocument, CreateUploadRequestDocument, CompleteUploadDocument } from '@/graphql/generated/graphql'
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
  const { data } = await operationRequest(graphqlClient.query({ query: UploadsDocument, variables: { input: { cursor: req.cursor || undefined, size: clampPageSize(req.size ?? 100) } }, fetchPolicy: 'no-cache' }))
  return data.uploads.list
}

export async function uploadFile(file: File): Promise<UploadFileModel> {
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreateUploadRequestDocument, variables: { input: { fileName: file.name, contentType: file.type || 'application/octet-stream' } } }))
  const uploadUrl = data?.uploads.createRequest
  if (!uploadUrl) {
    throw new Error(t('common.messages.uploadUrlMissing'))
  }

  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  })

  await operationRequest(graphqlClient.mutate({ mutation: CompleteUploadDocument, variables: { fileName: file.name } }))

  return {
    key: file.name,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString(),
    fullPath: '',
  }
}
