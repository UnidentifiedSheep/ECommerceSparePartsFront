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
  gap: 0;
  padding: 2px;
  border-radius: 8px;
}

.locale-switcher__item {
  min-width: 34px;
  height: 24px;
  padding: 0 9px;
  font-size: 11px;
  font-weight: 700;
  line-height: 24px;
  letter-spacing: 0;
  text-align: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.locale-switcher--dark {
  background: #111827;
  border: 1px solid #374151;
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
}

.locale-switcher--light {
  background: #ffffff;
  border: 1px solid #cbd5e1;
}

.locale-switcher--light .locale-switcher__item {
  color: #64748b;
}

.locale-switcher--light .locale-switcher__item:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.locale-switcher--light .locale-switcher__item--active {
  color: #0f172a;
  background: #e2e8f0;
}
</style>
