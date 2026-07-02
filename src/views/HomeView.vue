<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50 p-6">
    <el-card shadow="never">
      <el-empty :description="t('home.disabled')" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>
