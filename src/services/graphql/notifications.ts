import { graphqlClient } from './client.ts'
import { subscribeGraphql } from './subscriptions.ts'
import { t } from '@/i18n'
import {
  NotificationsListDocument,
  MyNotificationPreferencesDocument,
  SeeNotificationsDocument,
  UpsertNotificationPreferencesDocument,
  NotificationCreatedDocument,
  type NotificationFieldsFragment,
  type MyNotificationPreferencesQuery,
  type UpsertNotificationPreferenceInput,
} from '@/graphql/generated/graphql.ts'

export type AppNotification = NotificationFieldsFragment
export type NotificationPreference = MyNotificationPreferencesQuery['notifications']['myPreferences'][number]

export async function listNotifications(value: string | null, size = 20) {
  const result = await graphqlClient.query({
    query: NotificationsListDocument,
    variables: { input: { cursor: { value, size } } },
    fetchPolicy: 'no-cache',
  })
  return result.data.notifications.list
}

export async function seeNotifications(ids: number[]) {
  const result = await graphqlClient.mutate({ mutation: SeeNotificationsDocument, variables: { ids } })
  if (!result.data?.notifications.see) throw new Error(t('notifications.seeError'))
}

export async function getNotificationPreferences() {
  const result = await graphqlClient.query({ query: MyNotificationPreferencesDocument, fetchPolicy: 'no-cache' })
  return result.data.notifications.myPreferences
}

export async function saveNotificationPreferences(preferences: UpsertNotificationPreferenceInput[]) {
  const result = await graphqlClient.mutate({
    mutation: UpsertNotificationPreferencesDocument,
    variables: { input: { preferences } },
  })
  if (!result.data?.notifications.upsertPreferences) throw new Error(t('notifications.preferencesSaveError'))
}

export function subscribeNotifications(callbacks: {
  created(notification: AppNotification): void
  connected(): void
  disconnected(): void
  error(error: Error): void
}) {
  return subscribeGraphql(NotificationCreatedDocument, {}, {
    next: (data) => callbacks.created(data.onNotificationCreated.notification),
    connected: callbacks.connected,
    disconnected: callbacks.disconnected,
    error: callbacks.error,
  })
}
