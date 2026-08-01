<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView } from 'vue-router'
import ru from 'element-plus/es/locale/lang/ru'
import en from 'element-plus/es/locale/lang/en'
import tr from 'element-plus/es/locale/lang/tr'
import { useI18n } from '@/i18n'
import { useAuthStore } from '@/stores/authStore.ts'
import { useCurrencyStore } from '@/stores/currencyStore.ts'

const { locale } = useI18n()
const elementLocales = { ru, en, tr }
const elementLocale = computed(() => elementLocales[locale.value])
const authStore = useAuthStore()
const currencyStore = useCurrencyStore()

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
