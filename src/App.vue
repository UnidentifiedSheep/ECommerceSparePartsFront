<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import ru from 'element-plus/es/locale/lang/ru'
import en from 'element-plus/es/locale/lang/en'
import tr from 'element-plus/es/locale/lang/tr'
import { useI18n } from '@/i18n'

const { locale } = useI18n()
const elementLocales = { ru, en, tr }
const elementLocale = computed(() => elementLocales[locale.value])
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <RouterView />
  </el-config-provider>
</template>

<style scoped>

</style>
