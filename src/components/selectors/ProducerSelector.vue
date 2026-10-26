<template>
  <el-select-v2
    ref="selectRef"
    v-bind="$attrs"
    v-model="producerId"
    :options="options"
    :loading="loading"
    :placeholder="resolvedPlaceholder"
    :size="props.size"
    :disabled="isDisabled"
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
      <el-button v-if="canOfferCreation" :icon="Plus" link type="primary" class="producer-create-action" @click="openCreateDialog">
        {{ t('producers.createNamed', { name: query }) }}
      </el-button>
    </template>
  </el-select-v2>
  <CreateProducerDialog
    v-if="props.allowCreate && canCreate"
    v-model="createDialogOpen"
    :initial-name="createName"
    @created="selectCreatedProducer"
    @closed="selectRef?.focus()"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useFormDisabled, type SelectV2Instance } from 'element-plus'
import CreateProducerDialog from '@/components/producers/CreateProducerDialog.vue'
import { useProducerSelectOptions } from '@/composables/useProducerSelectOptions.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import type { ProducerModel } from '@/models/producerModel.ts'
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
const createDialogOpen = ref(false)
const createName = ref('')

watch(autoSelectId, async (id) => {
  if (id === undefined || isDisabled.value || createDialogOpen.value) return
  const hadFocus = selectRef.value?.$el.contains(document.activeElement)
  producerId.value = id
  await nextTick()
  if (hadFocus && producerId.value === id) {
    selectRef.value?.blur()
    await nextTick()
    selectRef.value?.focus()
  }
})

function openCreateDialog() {
  if (!canOfferCreation.value) return
  createName.value = query.value
  selectRef.value?.blur()
  createDialogOpen.value = true
}

function selectCreatedProducer(producer: ProducerModel) {
  rememberProducer(producer)
  producerId.value = producer.id
}
</script>

<style scoped>
.producer-create-action { max-width: 100%; height: auto; padding: 6px 0; text-align: left; }
.producer-create-action :deep(span) { min-width: 0; white-space: normal; overflow-wrap: anywhere; }
</style>
