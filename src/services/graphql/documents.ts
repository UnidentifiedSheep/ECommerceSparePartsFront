import { graphqlClient } from './client.ts'
import {
  AvailableDocumentsDocument,
  CreateDocumentGenerationRequestDocument,
  DocumentByIdDocument,
  DocumentsByIdsDocument,
  SearchDocumentsDocument,
  type AvailableDocumentsQuery,
  type DocumentType,
  type DocumentGenerationRequestFieldsFragment,
  type SearchDocumentsInput,
} from '@/graphql/generated/graphql.ts'
import { getAcceptLanguage, t } from '@/i18n'

export type DocumentDefinition = AvailableDocumentsQuery['documents']['available'][number]
export type DocumentRequest = DocumentGenerationRequestFieldsFragment
const singleSaleDocumentSystemName = 'SingleSale'
const documentRequestTypes: Record<DocumentType, string> = {
  PDF: 'Pdf',
  EXCEL: 'Excel',
  HTML: 'Html',
  DOCX: 'Docx',
}

export async function getAvailableDocuments(): Promise<DocumentDefinition[]> {
  const result = await graphqlClient.query({ query: AvailableDocumentsDocument, fetchPolicy: 'no-cache' })
  return result.data.documents.available
}

export async function createDocumentGenerationRequest(systemName: string, request: Record<string, unknown>): Promise<DocumentRequest> {
  const result = await graphqlClient.mutate({
    mutation: CreateDocumentGenerationRequestDocument,
    variables: { input: { documentSystemName: systemName, documentRequest: JSON.stringify(request) } },
  })
  const created = result.data?.documents.createGenerationRequest
  if (!created) throw new Error(t('documents.generateError'))
  return created
}

export async function getSingleSaleDocumentTypes(): Promise<DocumentType[]> {
  const available = await getAvailableDocuments()
  return available.find((definition) => definition.systemName === singleSaleDocumentSystemName)?.supportedDocumentTypes ?? []
}

export function createSingleSaleDocumentRequest(saleId: string, documentType: DocumentType): Promise<DocumentRequest> {
  return createDocumentGenerationRequest(singleSaleDocumentSystemName, {
    documentType: documentRequestTypes[documentType],
    culture: getAcceptLanguage(),
    saleId,
  })
}

export async function getDocumentById(requestId: string): Promise<DocumentRequest | null> {
  const result = await graphqlClient.query({
    query: DocumentByIdDocument,
    variables: { requestId },
    fetchPolicy: 'no-cache',
  })
  return result.data.documents.byId
}

export async function getDocumentsByIds(requestIds: string[]): Promise<DocumentRequest[]> {
  const result = await graphqlClient.query({
    query: DocumentsByIdsDocument,
    variables: { requestIds },
    fetchPolicy: 'no-cache',
  })
  return result.data.documents.byIds
}

export async function searchDocuments(input: SearchDocumentsInput): Promise<DocumentRequest[]> {
  const result = await graphqlClient.query({
    query: SearchDocumentsDocument,
    variables: { input },
    fetchPolicy: 'no-cache',
  })
  return result.data.documents.search
}
