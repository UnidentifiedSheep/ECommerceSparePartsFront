import { clampPageSize } from '@/services/api/api.ts'
import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { MarkupGroupsDocument, MarkupGroupRangesDocument, MarkupGroupUpsertDocument, type MarkupGroupFieldsFragment } from '@/graphql/generated/graphql'

export interface MarkupRangeModel {
  id: number
  rangeStart: number
  rangeEnd: number
  markup: number
}

export interface MarkupGroupModel {
  id: number
  name: string | null
  currencyId: number
  sourceMessageId: string | null
}

export interface UpsertMarkupRangeModel {
  rangeStart: number
  rangeEnd: number
  markup: number
}

export interface UpsertMarkupGroupModel {
  id?: number
  name?: string | null
  currencyId: number
  ranges: UpsertMarkupRangeModel[]
}

export interface GetMarkupGroupsRequest {
  page: number
  size: number
  searchTerm?: string
}

export interface GetMarkupGroupsResponse {
  groups: MarkupGroupModel[]
}

export async function getMarkupGroups(req: GetMarkupGroupsRequest): Promise<GetMarkupGroupsResponse> {
  const { data } = await operationRequest(graphqlClient.query({
    query: MarkupGroupsDocument,
    variables: { input: { pagination: { page: req.page, size: clampPageSize(req.size) }, searchTerm: req.searchTerm?.trim() || null } },
    fetchPolicy: 'no-cache',
  }))
  return { groups: data.markupGroups.search.map(mapGroup) }
}

export async function getMarkupGroupRanges(id: number, page: number, size: number): Promise<MarkupRangeModel[]> {
  const { data } = await operationRequest(graphqlClient.query({
    query: MarkupGroupRangesDocument,
    variables: { id, pagination: { page, size: clampPageSize(size) } },
    fetchPolicy: 'no-cache',
  }))
  if (!data.markupGroups.byId) throw new Error('Markup group not found')
  return data.markupGroups.byId.ranges
}

// Upsert replaces the full collection: never save only the visible page.
export async function getAllMarkupGroupRanges(id: number): Promise<MarkupRangeModel[]> {
  const ranges: MarkupRangeModel[] = []
  for (let page = 0; ; page++) {
    const batch = await getMarkupGroupRanges(id, page, 100)
    ranges.push(...batch)
    if (batch.length < 100) return ranges
  }
}

export async function upsertMarkupGroup(group: UpsertMarkupGroupModel): Promise<MarkupGroupModel> {
  const { data } = await operationRequest(graphqlClient.mutate({
    mutation: MarkupGroupUpsertDocument, variables: { input: group },
  }))
  if (!data?.markupGroups.upsert) throw new Error('Markup group not returned')
  return mapGroup(data.markupGroups.upsert)
}

function mapGroup(group: MarkupGroupFieldsFragment): MarkupGroupModel {
  return { id: group.id, name: group.name ?? null, currencyId: group.currency.id, sourceMessageId: group.sourceMessageId ?? null }
}
