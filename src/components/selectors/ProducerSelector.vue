<template>
  <el-select-v2
    ref="selectRef"
    v-bind="$attrs"
    v-model="producerId"
    :options="options"
    :loading="loading || creating"
    :placeholder="resolvedPlaceholder"
    :size="props.size"
    :disabled="isDisabled || creating"
    clearable
    filterable
    remote
    class="w-full"
    :popper-class="popperClass"
    :remote-method="search"
    @visible-change="onVisibleChange"
  >
    <template #empty>{{ t(loadError ? 'products.filterOptionsLoadError' : 'products.noFilterOptions') }}</template>
    <template v-if="canRetry || canOfferCreation" #footer>
      <el-button v-if="canRetry" link @click="loadMore">{{ t('common.actions.loadMore') }}</el-button>
      <el-button v-if="canOfferCreation" :icon="Plus" link type="primary" class="producer-create-action" :loading="creating" @click="createFromQuery">
        {{ t('producers.createNamed', { name: query }) }}
      </el-button>
    </template>
  </el-select-v2>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, useFormDisabled, type SelectV2Instance } from 'element-plus'
import { createProducer } from '@/services/api/producers'
import { useProducerSelectOptions } from '@/composables/useProducerSelectOptions.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ placeholder?: string; size?: 'small' | 'default' | 'large'; allowCreate?: boolean; disabled?: boolean }>(), {
  disabled: undefined,
})
const producerId = defineModel<number | undefined>()
const { t } = useI18n()
const resolvedPlaceholder = computed(() => props.placeholder ?? t('products.selectProducer'))
const selectedIds = computed(() => producerId.value === undefined ? [] : [producerId.value])
const { options, loading, loadError, search, onVisibleChange, popperClass, loadMore, canRetry, query, canCreateForQuery, rememberProducer, autoSelectId } = useProducerSelectOptions(selectedIds)
const { hasPermission } = usePermissions()
const canCreate = computed(() => hasPermission('PRODUCERS_CREATE'))
const isDisabled = useFormDisabled()
const canOfferCreation = computed(() => props.allowCreate && canCreate.value && !isDisabled.value && canCreateForQuery.value)
const selectRef = ref<SelectV2Instance>()
const creating = ref(false)

watch(autoSelectId, async (id) => {
  if (id === undefined || isDisabled.value || creating.value) return
  const hadFocus = selectRef.value?.$el.contains(document.activeElement)
  producerId.value = id
  await nextTick()
  if (hadFocus && producerId.value === id) {
    selectRef.value?.blur()
    await nextTick()
    selectRef.value?.focus()
  }
})

async function createFromQuery() {
  if (!canOfferCreation.value || creating.value) return
  const name = query.value.trim()
  creating.value = true
  try {
    const { producer } = await createProducer({ name, description: null })
    rememberProducer(producer)
    producerId.value = producer.id
    selectRef.value?.blur()
    ElMessage.success(t('producers.created'))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('producers.createError'))
  } finally {
    creating.value = false
    await nextTick()
    selectRef.value?.focus()
  }
}
</script>

<style scoped>
.producer-create-action { max-width: 100%; height: auto; padding: 6px 0; text-align: left; }
.producer-create-action :deep(span) { min-width: 0; white-space: normal; overflow-wrap: anywhere; }
</style>
