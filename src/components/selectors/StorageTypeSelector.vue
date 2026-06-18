<template>
  <el-select v-model="value" :placeholder="placeHolder" :clearable="clearable">
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
</template>

<script setup lang="ts">
import { StorageType } from '@/enums/storageType.ts'
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const options = computed(() => [
  {
    value: StorageType.Warehouse,
    label: t('storages.types.Warehouse'),
  },
  {
    value: StorageType.SupplierStorage,
    label: t('storages.types.SupplierStorage'),
  },
])

const value = defineModel<StorageType | undefined>()

const props = withDefaults(
  defineProps<{
    placeHolder?: string
    clearable?: boolean
  }>(),
  {
    placeHolder: undefined,
    clearable: true,
  },
)

const placeHolder = computed(() => props.placeHolder ?? t('storages.selectType'))
</script>

<style scoped>
</style>
