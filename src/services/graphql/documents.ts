import { graphqlClient } from './client.ts'
import {
  AvailableDocumentsDocument,
  CreateDocumentGenerationRequestDocument,
  DocumentLinkDocument,
  type AvailableDocumentsQuery,
} from '@/graphql/generated/graphql.ts'

export type DocumentDefinition = AvailableDocumentsQuery['documents']['available'][number]

export async function getAvailableDocuments(): Promise<DocumentDefinition[]> {
  const result = await graphqlClient.query({ query: AvailableDocumentsDocument, fetchPolicy: 'no-cache' })
  return result.data.documents.available
}

export async function createDocumentGenerationRequest(systemName: string, request: Record<string, unknown>): Promise<string> {
  const result = await graphqlClient.mutate({
    mutation: CreateDocumentGenerationRequestDocument,
    variables: { input: { documentSystemName: systemName, documentRequest: JSON.stringify(request) } },
  })
  const id = result.data?.documents.createGenerationRequest
  if (!id) throw new Error('Document generation request did not return an ID')
  return id
}

export async function getDocumentLink(requestId: string): Promise<string> {
  const result = await graphqlClient.query({
    query: DocumentLinkDocument,
    variables: { requestId },
    fetchPolicy: 'no-cache',
  })
  return result.data.documents.link.url
}
