<template>
  <div ref="element" class="pin-settings">
    <header><h2>{{ t('pinnedNavigation.title') }}</h2><p>{{ t('pinnedNavigation.hint') }}</p></header>
    <div class="pin-settings__options">
      <el-checkbox :model-value="store.preferences.enabled" @change="(value: boolean) => store.update({ ...store.preferences, enabled: value })">{{ t('pinnedNavigation.show') }}</el-checkbox>
      <el-checkbox :model-value="store.preferences.showLabels" @change="(value: boolean) => store.update({ ...store.preferences, showLabels: value })">{{ t('pinnedNavigation.showLabels') }}</el-checkbox>
      <label class="pin-settings__bar-color"><span>{{ t('pinnedNavigation.barColor') }}</span>
        <el-select :model-value="store.preferences.barColor" :aria-label="t('pinnedNavigation.barColor')" @change="(value: PinColor) => store.update({ ...store.preferences, barColor: value })">
          <el-option v-for="color in pinColors" :key="color" :value="color" :label="t(`pinnedNavigation.colors.${color}`)" />
        </el-select>
      </label>
    </div>
    <div class="pin-settings__add">
      <el-select v-model="selectedPath" filterable clearable :placeholder="t('pinnedNavigation.choose')" :aria-label="t('pinnedNavigation.choose')">
        <el-option v-for="entry in availableToAdd" :key="entry.path" :value="entry.path" :label="t(entry.label)" />
      </el-select>
      <el-button :disabled="!selectedPath" :icon="Plus" type="primary" @click="add">{{ t('common.actions.add') }}</el-button>
    </div>
    <p v-if="!store.visiblePins.length">{{ t('pinnedNavigation.empty') }}</p>
    <ol v-else class="pin-settings__list">
      <li v-for="(entry, index) in store.visiblePins" :key="entry.path" :data-pin-path="entry.path" class="pin-settings__row">
        <div class="pin-settings__identity" :style="pinStyle(entry.pin.color)"><el-icon><component :is="entry.icon" /></el-icon><strong>{{ t(entry.label) }}</strong></div>
        <label :for="`pin-name-${index}`" class="pin-settings__name"><span>{{ t('pinnedNavigation.label') }}</span>
          <el-input :id="`pin-name-${index}`" :model-value="entry.pin.label" :placeholder="t(entry.label)" :aria-label="`${t('pinnedNavigation.label')}: ${t(entry.label)}`" :maxlength="32" clearable @update:model-value="(value: string) => store.edit(entry.path, { label: value })" />
        </label>
        <label class="pin-settings__color"><span>{{ t('pinnedNavigation.color') }}</span>
          <el-select :model-value="entry.pin.color" :aria-label="t('pinnedNavigation.buttonColor', { name: t(entry.label) })" @change="(value: PinColor) => store.edit(entry.path, { color: value })">
            <el-option v-for="color in pinColors" :key="color" :value="color" :label="t(`pinnedNavigation.colors.${color}`)" />
          </el-select>
        </label>
        <div class="pin-settings__actions">
          <el-button :icon="ArrowUp" data-move="-1" :disabled="index === 0" :aria-label="t('pinnedNavigation.up', { name: t(entry.label) })" @click="move(entry.path, -1)" />
          <el-button :icon="ArrowDown" data-move="1" :disabled="index === store.visiblePins.length - 1" :aria-label="t('pinnedNavigation.down', { name: t(entry.label) })" @click="move(entry.path, 1)" />
          <el-button :icon="Delete" type="danger" plain :aria-label="t('pinnedNavigation.unpin', { name: t(entry.label) })" @click="store.toggle(entry.path)" />
        </div>
      </li>
    </ol>
    <p class="sr-only" role="status">{{ moveMessage }}</p>
    <p :role="store.storageFailed ? 'alert' : undefined">{{ t(store.storageFailed ? 'settings.appearance.storageError' : 'settings.appearance.savedHint') }}</p>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ArrowUp, ArrowDown, Delete, Plus } from '@element-plus/icons-vue'
import { usePinnedNavigationStore } from '@/stores/pinnedNavigationStore'
import { pinColors, pinStyle, type PinColor } from '@/utils/pinnedNavigation'
import { useI18n } from '@/i18n'
const store = usePinnedNavigationStore()
const { t } = useI18n()
const element = ref<HTMLElement>()
const selectedPath = ref<string>()
const moveMessage = ref('')
const availableToAdd = computed(() => store.availableEntries.filter(entry => !store.isPinned(entry.path)))
watch(availableToAdd, entries => { if (!entries.some(entry => entry.path === selectedPath.value)) selectedPath.value = undefined })
function add() { if (selectedPath.value && !store.isPinned(selectedPath.value)) store.toggle(selectedPath.value); selectedPath.value = undefined }
async function move(path: string, direction: -1 | 1) {
  moveMessage.value = ''
  store.move(path, direction)
  await nextTick()
  const row = element.value?.querySelector<HTMLElement>(`[data-pin-path="${path}"]`)
  const button = row?.querySelector<HTMLButtonElement>(`[data-move="${direction}"]`)
  if (button && !button.disabled) button.focus()
  else row?.querySelector<HTMLInputElement>('input')?.focus()
  moveMessage.value = t('pinnedNavigation.orderUpdated')
}
</script>
<style scoped>
.pin-settings { display: grid; min-width: 0; gap: 24px; container: pin-settings / inline-size; }
.pin-settings h2 { margin: 0; font-size: 20px; color: var(--app-text); }
.pin-settings p { margin: 6px 0 0; max-width: 65ch; color: var(--el-text-color-regular); font-size: 14px; line-height: 1.5; }
.pin-settings__options { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; }
.pin-settings__bar-color { display: grid; gap: 6px; min-width: 180px; }
.pin-settings__add { display: flex; gap: 8px; }
.pin-settings__add .el-select { max-width: 400px; min-width: 0; }
.pin-settings__list { margin: 0; padding: 0; list-style: none; }
.pin-settings__row { display: grid; grid-template-columns: minmax(130px, 1fr) minmax(150px, 1.2fr) minmax(140px, 1fr) auto; align-items: end; gap: 16px; border-bottom: 1px solid var(--app-border); padding: 16px 0; }
.pin-settings__identity { display: flex; align-items: center; gap: 8px; min-width: 0; align-self: center; color: var(--pin-color); }
.pin-settings__identity strong { overflow-wrap: anywhere; font-size: 14px; }
.pin-settings__row label { display: grid; gap: 6px; min-width: 0; }
.pin-settings label > span { font-size: 12px; color: var(--el-text-color-regular); }
.pin-settings__actions { display: flex; gap: 4px; }
.pin-settings__actions .el-button + .el-button { margin-left: 0; }
@container pin-settings (max-width: 720px) { .pin-settings__row { grid-template-columns: 1fr 1fr; } .pin-settings__identity { grid-column: 1 / -1; } }
@container pin-settings (max-width: 420px) { .pin-settings__row { grid-template-columns: minmax(0, 1fr); gap: 12px; } .pin-settings__bar-color { width: 100%; } }
</style>
