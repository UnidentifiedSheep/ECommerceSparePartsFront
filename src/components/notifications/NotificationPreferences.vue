<template>
  <div v-loading="loading" class="notification-preferences">
    <div class="notification-preferences__header">
      <h2>{{ t('notifications.preferencesTitle') }}</h2>
      <el-button :icon="Refresh" :loading="loading" :disabled="saving" @click="load">{{ t('common.actions.refresh') }}</el-button>
    </div>
    <p>{{ t('notifications.preferencesHint') }}</p>
    <p v-if="error" role="alert" class="notification-preferences__error">{{ error }}</p>
    <div v-for="item in preferences" :key="item.channelName" class="notification-preferences__row">
      <label :for="`notification-channel-${item.channelName}`">{{ item.localizableChannelName }}</label>
      <span v-if="item.channelName === 'InApp'">{{ t('notifications.alwaysEnabled') }}</span>
      <el-switch :id="`notification-channel-${item.channelName}`" v-model="item.enabled" :disabled="saving || item.channelName === 'InApp'" :aria-label="item.localizableChannelName" />
    </div>
    <p v-if="!loading && !error && !preferences.length">{{ t('notifications.noChannels') }}</p>
    <el-button v-if="preferences.length" type="primary" :loading="saving" :disabled="!dirty" @click="save">{{ t('common.actions.save') }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'
import { getNotificationPreferences, saveNotificationPreferences, type NotificationPreference } from '@/services/graphql/notifications.ts'

const { t, locale } = useI18n()
const preferences = ref<NotificationPreference[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const saved = ref('')
const snapshot = () => JSON.stringify(preferences.value.map(({ channelName, enabled }) => [channelName, enabled]))
const dirty = computed(() => saved.value !== snapshot())
let requestId = 0

async function load() {
  const currentRequestId = ++requestId
  loading.value = true
  error.value = ''
  try {
    const result = await getNotificationPreferences()
    if (currentRequestId !== requestId) return
    preferences.value = result.map((item) => ({ ...item, enabled: item.channelName === 'InApp' || item.enabled }))
    saved.value = snapshot()
  } catch (cause) {
    if (currentRequestId === requestId) error.value = cause instanceof Error ? cause.message : t('notifications.preferencesLoadError')
  } finally {
    if (currentRequestId === requestId) loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await saveNotificationPreferences(preferences.value.map(({ channelName, enabled }) => ({ channelName, isEnabled: enabled })))
    saved.value = snapshot()
    ElMessage.success(t('notifications.preferencesSaved'))
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : t('notifications.preferencesSaveError'))
  } finally { saving.value = false }
}

onMounted(load)
watch(locale, load)
</script>

<style scoped>
.notification-preferences { max-width: 640px; min-height: 160px; }
.notification-preferences__header, .notification-preferences__row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.notification-preferences h2 { margin: 0; font-size: 20px; font-weight: 600; color: var(--el-text-color-primary); }
.notification-preferences p { margin: 8px 0 20px; color: var(--el-text-color-secondary); font-size: 14px; }
.notification-preferences__row { padding: 12px 0; border-bottom: 1px solid var(--app-border); }
.notification-preferences > .el-button { margin-top: 20px; }
.notification-preferences .notification-preferences__error { color: var(--el-color-danger); }
</style>
