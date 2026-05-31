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

const options = [
  {
    value: StorageType.Warehouse,
    label: 'Наш склад',
  },
  {
    value: StorageType.SupplierStorage,
    label: 'Склад поставщика',
  },
]

const value = defineModel<StorageType | undefined>()

withDefaults(
  defineProps<{
    placeHolder?: string
    clearable?: boolean
  }>(),
  {
    placeHolder: 'Выберите тип склада',
    clearable: true,
  },
)
</script>

<style scoped>
</style>