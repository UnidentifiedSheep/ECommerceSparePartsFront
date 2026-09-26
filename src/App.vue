<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView } from 'vue-router'
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

watch(
  () => [authStore.user?.id, hasPermission('NOTIFICATIONS_ME')] as const,
  ([userId, allowed], previous) => {
    if (previous && userId === previous[0] && allowed === previous[1]) return
    if (authStore.token && userId && allowed) notificationStore.start(userId)
    else notificationStore.reset()
  },
  { immediate: true },
)

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) void currencyStore.loadBaseCurrency()
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
