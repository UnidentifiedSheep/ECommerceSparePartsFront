<template>
  <el-popover v-model:visible="open" trigger="click" placement="bottom-end" :width="380" popper-class="notification-popover" @after-enter="trackingReady = true" @before-leave="trackingReady = false">
    <template #reference>
      <button type="button" class="notification-trigger" :aria-label="t('notifications.title')" :aria-expanded="open">
        <el-badge :value="store.unreadCount" :max="99" :hidden="!store.unreadCount">
          <el-icon :size="20"><Bell /></el-icon>
        </el-badge>
      </button>
    </template>
    <section class="notification-menu" :aria-label="t('notifications.title')">
      <div class="notification-menu__header">
        <strong>{{ t('notifications.title') }}</strong>
        <div class="notification-menu__actions">
          <el-button text :icon="Refresh" :loading="store.loading" :aria-label="t('common.actions.refresh')" @click="store.load()" />
          <el-button text :icon="Setting" :aria-label="t('notifications.preferencesTitle')" @click="openSettings" />
        </div>
      </div>
      <p v-if="store.error || autoReadError" class="notification-menu__error" role="alert">{{ store.error || autoReadError }}</p>
      <p v-else-if="!store.connected" class="notification-menu__connection">{{ t('notifications.reconnecting') }}</p>
      <div ref="listRoot" class="notification-menu__list" :aria-busy="store.loading">
        <p v-if="!store.items.length" class="notification-menu__empty">
          {{ store.loading ? t('notifications.loading') : t('notifications.empty') }}
        </p>
        <article v-for="item in store.items" :key="item.id" :data-notification-id="item.id" class="notification-item" :class="{ 'notification-item--unread': !item.seenAt }">
          <p>{{ item.text }}</p>
          <div class="notification-item__footer">
            <time :datetime="item.createdAt">{{ formatDate(item.createdAt) }}</time>
            <el-button v-if="!item.seenAt" text size="small" :icon="Check" :loading="store.seeingIds.includes(item.id)" @click="markSeen(item.id)">
              {{ t('notifications.markSeen') }}
            </el-button>
            <span v-else>{{ t('notifications.seen') }}</span>
          </div>
        </article>
      </div>
      <div v-if="store.hasMore || store.unreadCount" class="notification-menu__footer">
        <span v-if="store.unreadCount" :title="t('notifications.loadedUnreadHint')">{{ t('notifications.loadedUnread', { count: store.unreadCount }) }}</span>
        <el-button v-if="store.hasMore" text :loading="store.loading" @click="store.load(true)">{{ t('common.actions.loadMore') }}</el-button>
      </div>
    </section>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDocumentVisibility, useWindowFocus } from '@vueuse/core'
import { useRouter } from 'vue-router'
import { Bell, Check, Refresh, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useNotificationStore } from '@/stores/notificationStore.ts'
import { useI18n } from '@/i18n'
import { useNotificationAutoRead } from './useNotificationAutoRead.ts'

const store = useNotificationStore()
const router = useRouter()
const { t, locale } = useI18n()
const open = ref(false)
const listRoot = ref<HTMLElement>()
const trackingReady = ref(false)
const autoReadError = ref('')
const visibility = useDocumentVisibility()
const focused = useWindowFocus()
const trackingActive = computed(() => open.value && trackingReady.value && visibility.value === 'visible' && focused.value)
const unreadIds = computed(() => store.items
  .filter((item) => !item.seenAt && !store.seeingIds.includes(item.id))
  .map((item) => item.id))

useNotificationAutoRead(listRoot, trackingActive, unreadIds, async (ids) => {
  try {
    await store.markSeen(ids)
    autoReadError.value = ''
  } catch (error) {
    autoReadError.value = error instanceof Error ? error.message : t('notifications.seeError')
  }
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

async function markSeen(id: number) {
  try { await store.markSeen(id) } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('notifications.seeError'))
  }
}

function openSettings() {
  open.value = false
  void router.push({ path: '/settings', query: { section: 'notifications' } })
}

watch(open, (visible) => { if (visible) void store.load() })
</script>

<style scoped>
.notification-trigger { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 0; border-radius: 6px; background: transparent; color: var(--app-text); cursor: pointer; }
.notification-trigger:hover { background: var(--app-surface-muted, #f1f5f9); }
.notification-trigger:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
.notification-menu__header, .notification-menu__actions, .notification-menu__footer, .notification-item__footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.notification-menu__header { padding-bottom: 8px; border-bottom: 1px solid var(--app-border); }
.notification-menu__actions .el-button + .el-button { margin-left: 0; }
.notification-menu__list { max-height: min(440px, 65vh); overflow-y: auto; overscroll-behavior: contain; }
.notification-menu__empty { padding: 24px 8px; text-align: center; color: var(--el-text-color-secondary); }
.notification-item { padding: 12px 8px; border-bottom: 1px solid var(--app-border); }
.notification-item--unread { border-left: 2px solid var(--el-color-primary); background: var(--el-color-primary-light-9); }
.notification-item p { margin: 0 0 8px; color: var(--el-text-color-primary); white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
.notification-item__footer { color: var(--el-text-color-secondary); font-size: 12px; }
.notification-item__footer .el-button { padding: 4px; height: auto; }
.notification-menu__footer { padding-top: 8px; color: var(--el-text-color-secondary); font-size: 12px; }
.notification-menu__connection, .notification-menu__error { margin: 8px 0; font-size: 12px; }
.notification-menu__connection { color: var(--el-text-color-secondary); }
.notification-menu__error { color: var(--el-color-danger); }
</style>

<style>
.notification-popover.el-popover { max-width: calc(100vw - 24px); box-sizing: border-box; }
</style>
