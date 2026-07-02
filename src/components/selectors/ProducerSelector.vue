<template>
  <el-select
    v-model="producerId"
    :loading="isLoading"
    :placeholder="resolvedPlaceholder"
    clearable
    filterable
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
import { getProducer } from '@/services/api/producers.ts'
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
const producerId = defineModel<number | undefined>()

const producers = ref<ProducerSearchModel[]>([])
const searchTerm = ref('')
const isLoading = ref(false)
const page = ref(0)
const limit = ref(50)
const hasNextPage = ref(true)
const popperClass = `producer-selector-${Math.random().toString(36).slice(2)}`
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
    const resp = await searchProducers({
      query: searchTerm.value.trim() || undefined,
      page: page.value,
      size: limit.value,
    })

    const existingIds = new Set(producers.value.map((producer) => producer.id))
    producers.value.push(...resp.producers.filter((producer) => !existingIds.has(producer.id)))
    hasNextPage.value = resp.producers.length === limit.value
    page.value += 1
    await ensureSelectedProducerLoaded(producerId.value)
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
  if (producers.value.length === 0) {
    loadProducers(true)
  }
}

async function ensureSelectedProducerLoaded(id?: number) {
  if (!id || producers.value.some((producer) => producer.id === id)) return

  const resp = await getProducer(id)
  producers.value = [resp.producer, ...producers.value]
}

watch(producerId, async (id) => ensureSelectedProducerLoaded(id), { immediate: true })
onMounted(() => loadProducers(true))
</script>
