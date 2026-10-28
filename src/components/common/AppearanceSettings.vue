<template>
  <div class="appearance-settings">
    <header>
      <h2>{{ t('settings.appearance.title') }}</h2>
      <p>{{ t('settings.appearance.hint') }}</p>
    </header>
    <fieldset>
      <legend>{{ t('settings.appearance.fontSize') }}</legend>
      <div class="appearance-settings__choices">
        <button v-for="scale in fontScales" :key="scale" type="button"
          :aria-pressed="store.appearance.fontScale === scale"
          @click="store.update({ ...store.appearance, fontScale: scale })">
          {{ scale }}%
        </button>
      </div>
      <p>{{ t('settings.appearance.fontHint') }}</p>
    </fieldset>
    <fieldset>
      <legend>{{ t('settings.appearance.accent') }}</legend>
      <div class="appearance-settings__choices">
        <button v-for="accent in accents" :key="accent" type="button"
          :aria-pressed="store.appearance.accent === accent"
          @click="store.update({ ...store.appearance, accent })">
          <span class="appearance-settings__swatch" :style="{ backgroundColor: colors[accent] }" aria-hidden="true" />
          {{ t(`settings.appearance.${accent}`) }}
        </button>
      </div>
    </fieldset>
    <footer>
      <p :role="store.storageFailed ? 'alert' : undefined">{{ t(store.storageFailed ? 'settings.appearance.storageError' : 'settings.appearance.savedHint') }}</p>
      <el-button :icon="RefreshLeft" plain @click="store.reset">{{ t('settings.appearance.reset') }}</el-button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RefreshLeft } from '@element-plus/icons-vue'
import { useAppearanceStore } from '@/stores/appearanceStore'
import { fontScales, accents } from '@/utils/appearance'
import { useI18n } from '@/i18n'
const store = useAppearanceStore()
const { t } = useI18n()
const colors = { emerald: '#047857', sapphire: '#1d4ed8', amethyst: '#7e22ce' }
</script>

<style scoped>
.appearance-settings { display: grid; gap: 28px; }
.appearance-settings h2 { margin: 0; color: var(--app-text); font-size: 20px; font-weight: 650; }
.appearance-settings p { margin: 6px 0 0; max-width: 65ch; color: var(--el-text-color-regular); font-size: 14px; line-height: 1.5; }
.appearance-settings header { padding-bottom: 16px; border-bottom: 1px solid var(--app-border); }
.appearance-settings fieldset { min-width: 0; margin: 0; padding: 0; border: 0; }
.appearance-settings legend { margin-bottom: 10px; color: var(--app-text); font-weight: 650; }
.appearance-settings__choices { display: flex; flex-wrap: wrap; gap: 8px; }
.appearance-settings__choices button { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 8px 14px; border: 1px solid var(--app-border-strong); border-radius: 6px; background: var(--app-surface); color: var(--el-text-color-regular); font: inherit; cursor: pointer; }
.appearance-settings__choices button:hover { background: var(--app-bg-soft); }
.appearance-settings__choices button[aria-pressed='true'] { border-color: var(--app-primary); background: var(--app-primary-soft); color: var(--app-primary); font-weight: 650; }
.appearance-settings__choices button:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 3px; }
.appearance-settings__swatch { width: 12px; height: 12px; border-radius: 50%; flex: none; }
.appearance-settings footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding-top: 16px; border-top: 1px solid var(--app-border); }
</style>
