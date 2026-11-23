import { graphqlClient } from '@/services/graphql/client'
import { operationRequest } from '@/services/graphql/operationErrors'
import { clampPageSize } from './api'
import { t } from '@/i18n'
import { SearchDeliverySchedulesDocument, CreateDeliveryScheduleDocument, UpdateDeliveryScheduleDocument, DeleteDeliveryScheduleDocument, AddDeliveryScheduleExceptionDocument, RemoveDeliveryScheduleExceptionDocument, type DeliveryScheduleFieldsFragment, type CreateDeliveryScheduleInput, type DeliveryScheduleExceptionInput, type Supplier } from '@/graphql/generated/graphql'
export type DeliverySchedule = DeliveryScheduleFieldsFragment
export type DeliveryScheduleInput = CreateDeliveryScheduleInput
export async function getDeliverySchedules(input: { suppliers?: Supplier[]; storageCode?: string; page: number; size: number }, signal?: AbortSignal) {
  const { data } = await operationRequest(graphqlClient.query({ query: SearchDeliverySchedulesDocument, variables: { input: { suppliers: input.suppliers ?? [], storageCode: input.storageCode?.trim() || undefined, pagination: { page: input.page, size: clampPageSize(input.size) } } }, fetchPolicy: 'no-cache', context: { fetchOptions: { signal } } }))
  return data.deliverySchedules.search
}
export async function saveDeliverySchedule(input: DeliveryScheduleInput, existing: boolean): Promise<DeliverySchedule> {
  input = { supplier: input.supplier, storageCode: input.storageCode.trim(), days: [...new Set(input.days)] }
  if (existing) {
    const { data } = await operationRequest(graphqlClient.mutate({ mutation: UpdateDeliveryScheduleDocument, variables: { input } }))
    if (!data) throw new Error(t('deliverySchedules.saveError'))
    return data.deliverySchedules.update
  }
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: CreateDeliveryScheduleDocument, variables: { input } }))
  if (!data) throw new Error(t('deliverySchedules.saveError'))
  return data.deliverySchedules.create
}
export async function deleteDeliverySchedule(supplier: Supplier, storageCode: string) {
  await operationRequest(graphqlClient.mutate({ mutation: DeleteDeliveryScheduleDocument, variables: { supplier, storageCode: storageCode.trim() } }))
}
export async function changeDeliveryException(input: DeliveryScheduleExceptionInput, add: boolean): Promise<DeliverySchedule> {
  input = { ...input, storageCode: input.storageCode.trim() }
  if (add) {
    const { data } = await operationRequest(graphqlClient.mutate({ mutation: AddDeliveryScheduleExceptionDocument, variables: { input } }))
    if (!data) throw new Error(t('deliverySchedules.saveError'))
    return data.deliverySchedules.addException
  }
  const { data } = await operationRequest(graphqlClient.mutate({ mutation: RemoveDeliveryScheduleExceptionDocument, variables: { input } }))
  if (!data) throw new Error(t('deliverySchedules.saveError'))
  return data.deliverySchedules.removeException
}
