<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { graphqlClient } from '@/services/graphql/client'
import ru from 'element-plus/es/locale/lang/ru'
import en from 'element-plus/es/locale/lang/en'
import tr from 'element-plus/es/locale/lang/tr'
import { useI18n } from '@/i18n'
import { useAuthStore } from '@/stores/authStore.ts'
import { useCurrencyStore } from '@/stores/currencyStore.ts'
import { useNotificationStore } from '@/stores/notificationStore.ts'
import { usePermissions } from '@/composables/usePermissions.ts'

const { locale } = useI18n()
const elementLocales = { ru, en, tr }
const elementLocale = computed(() => elementLocales[locale.value])
const authStore = useAuthStore()
const currencyStore = useCurrencyStore()
const notificationStore = useNotificationStore()
const { hasPermission } = usePermissions()
const router = useRouter()
watch(() => authStore.sessionId, (sessionId, previous) => {
  if (previous) {
    void graphqlClient.clearStore()
    notificationStore.reset()
    currencyStore.reset()
  }
  if (previous && !sessionId) void router.replace({ name: 'auth' })
}, { flush: 'sync' })

watch(
  () => [authStore.sessionId, authStore.user?.id, hasPermission('NOTIFICATIONS_ME')] as const,
  ([sessionId, userId, allowed], previous) => {
    if (previous && sessionId === previous[0] && userId === previous[1] && allowed === previous[2]) return
    if (authStore.token && userId && allowed) notificationStore.start(userId)
    else notificationStore.reset()
  },
  { immediate: true },
)

watch(
  () => authStore.sessionId,
  (sessionId) => {
    if (sessionId) void currencyStore.loadBaseCurrency()
  },
  { immediate: true },
)
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <RouterView />
  </el-config-provider>
</template>

<style scoped>

</style>
