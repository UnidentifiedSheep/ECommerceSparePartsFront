<template>
  <div class="flex flex-wrap items-center gap-3">
    <el-select v-model="size" class="page-size-select" :placeholder="t('common.labels.size')">
      <el-option v-for="option in sizes" :key="option" :label="option" :value="option" />
    </el-select>

    <el-button :disabled="page <= 0" @click="page -= 1">{{ t('common.actions.back') }}</el-button>
    <span class="min-w-24 text-center text-sm text-slate-600">{{ t('common.labels.page', { page: page + 1 }) }}</span>
    <el-button :disabled="!hasNext" @click="page += 1">{{ t('common.actions.forward') }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/i18n'

const { t } = useI18n()
const page = defineModel<number>('page', { required: true })
const size = defineModel<number>('size', { required: true })

withDefaults(
  defineProps<{
    hasNext: boolean
    sizes?: number[]
  }>(),
  {
    sizes: () => [10, 20, 30, 40, 50, 100],
  },
)
</script>

<style scoped>
.page-size-select {
  flex: 0 0 96px;
  width: 96px;
}
</style>
