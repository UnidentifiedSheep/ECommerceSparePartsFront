<template>
  <el-select
    v-model="producerIds"
    :loading="isLoading"
    :placeholder="resolvedPlaceholder"
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
    <el-option
      v-for="producer in producers"
      :key="producer.id"
      :label="producer.name"
      :value="producer.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { ProducerSearchModel } from '@/models/producerSearchModel.ts'
import { useSelectInfiniteScroll } from '@/composables/useSelectInfiniteScroll.ts'
import { getProducersByIds } from '@/services/api/producers.ts'
import { searchProducers } from '@/services/api/search.ts'
import { useI18n } from '@/i18n'

const props = withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: undefined,
  },
)

const { t } = useI18n()
const resolvedPlaceholder = computed(() => props.placeholder ?? t('products.selectProducer'))
const producerIds = defineModel<number[]>({ required: true })
const producers = ref<ProducerSearchModel[]>([])
const searchTerm = ref('')
const isLoading = ref(false)
const page = ref(0)
const limit = 50
const hasNextPage = ref(true)
const popperClass = `producer-multi-selector-${Math.random().toString(36).slice(2)}`
const { attach: attachScroll, detach: detachScroll } = useSelectInfiniteScroll(popperClass, () => loadProducers(false))
const loadDebounced = useDebounceFn(async () => loadProducers(true), 250)

async function search(query: string) {
  searchTerm.value = query
  await loadDebounced()
}

async function loadProducers(reset = false) {
  if (isLoading.value) return
  if (reset) {
    page.value = 0
    hasNextPage.value = true
    producers.value = []
  }
  if (!hasNextPage.value) return

  isLoading.value = true
  try {
    const response = await searchProducers({
      query: searchTerm.value.trim() || undefined,
      page: page.value,
      size: limit,
    })
    const existingIds = new Set(producers.value.map((producer) => producer.id))
    producers.value.push(...response.producers.filter((producer) => !existingIds.has(producer.id)))
    hasNextPage.value = response.producers.length === limit
    page.value += 1
    await ensureSelectedProducersLoaded(producerIds.value)
  } finally {
    isLoading.value = false
  }
}

function onVisibleChange(open: boolean) {
  if (!open) {
    detachScroll()
    return
  }
  attachScroll()
  if (producers.value.length === 0) loadProducers(true)
}

async function ensureSelectedProducersLoaded(ids: number[]) {
  const missingIds = ids.filter((id) => !producers.value.some((producer) => producer.id === id))
  if (missingIds.length === 0) return

  const selected = await getProducersByIds(missingIds)
  const selectedIds = new Set(selected.map((producer) => producer.id))
  producers.value = [
    ...selected,
    ...producers.value.filter((producer) => !selectedIds.has(producer.id)),
  ]
}

watch(producerIds, (ids) => ensureSelectedProducersLoaded(ids), { immediate: true })
onMounted(() => loadProducers(true))
</script>
