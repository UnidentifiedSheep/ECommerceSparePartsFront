<template>
  <el-select-v2
    v-model="groupId"
    :options="options"
    :loading="loading"
    :placeholder="resolvedPlaceholder"
    :popper-class="popperClass"
    :remote-method="search"
    clearable
    filterable
    remote
    class="w-full"
    @visible-change="onVisibleChange"
  >
    <template #empty>{{ t(loadError ? 'products.filterOptionsLoadError' : 'products.noFilterOptions') }}</template>
    <template v-if="canRetry" #footer>
      <el-button link @click="loadMore">{{ t('common.actions.loadMore') }}</el-button>
    </template>
  </el-select-v2>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProductGroupSelectOptions } from '@/composables/useProductGroupSelectOptions.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{ placeholder?: string }>()
const groupId = defineModel<number | undefined>()
const { t } = useI18n()
const selectedIds = computed(() => groupId.value === undefined ? [] : [groupId.value])
const resolvedPlaceholder = computed(() => props.placeholder ?? t('products.selectProductGroup'))
const { options, loading, loadError, search, onVisibleChange, popperClass, loadMore, canRetry } = useProductGroupSelectOptions(selectedIds)
</script>
