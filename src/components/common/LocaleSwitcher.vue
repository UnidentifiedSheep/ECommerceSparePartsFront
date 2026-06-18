<template>
  <div class="locale-switcher" :class="`locale-switcher--${variant}`" :aria-label="t('common.labels.language')">
    <button
      v-for="option in localeOptions"
      :key="option.value"
      type="button"
      class="locale-switcher__item"
      :class="{ 'locale-switcher__item--active': locale === option.value }"
      :aria-pressed="locale === option.value"
      @click="setLocale(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { type AppLocale, useI18n } from '@/i18n'

withDefaults(defineProps<{
  variant?: 'dark' | 'light'
}>(), {
  variant: 'light',
})

const { locale, setLocale, t } = useI18n()
const localeOptions: Array<{ label: string, value: AppLocale }> = [
  { label: 'RU', value: 'ru' },
  { label: 'EN', value: 'en' },
  { label: 'TR', value: 'tr' },
]
</script>

<style scoped>
.locale-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
}

.locale-switcher__item {
  min-width: 34px;
  height: 26px;
  padding: 0 9px;
  font-size: 11px;
  font-weight: 700;
  line-height: 26px;
  letter-spacing: 0.04em;
  text-align: center;
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.locale-switcher--dark {
  background: rgba(17, 24, 39, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.locale-switcher--dark .locale-switcher__item {
  color: #cbd5e1;
}

.locale-switcher--dark .locale-switcher__item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.locale-switcher--dark .locale-switcher__item--active {
  color: #0f172a;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.24);
}

.locale-switcher--light {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(203, 213, 225, 0.9);
  box-shadow:
    0 12px 30px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
}

.locale-switcher--light .locale-switcher__item {
  color: #64748b;
}

.locale-switcher--light .locale-switcher__item:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.locale-switcher--light .locale-switcher__item--active {
  color: #ffffff;
  background: #2563eb;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.28);
}
</style>
