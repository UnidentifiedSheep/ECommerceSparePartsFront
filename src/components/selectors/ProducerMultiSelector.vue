<template>
  <el-select-v2
    v-model="producerIds"
    :options="options"
    :loading="loading"
    :placeholder="resolvedPlaceholder"
    :size="props.size"
    clearable
    collapse-tags
    collapse-tags-tooltip
    filterable
    multiple
    remote
    reserve-keyword
    class="w-full"
    :popper-class="popperClass"
    :remote-method="search"
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
import { useProducerSelectOptions } from '@/composables/useProducerSelectOptions.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{ placeholder?: string; size?: 'small' | 'default' | 'large' }>()
const producerIds = defineModel<number[]>({ required: true })
const { t } = useI18n()
const resolvedPlaceholder = computed(() => props.placeholder ?? t('products.selectProducer'))
const { options, loading, loadError, search, onVisibleChange, popperClass, loadMore, canRetry } = useProducerSelectOptions(producerIds)
</script>
