<template>
  <el-select
    v-model="producerId"
    :loading="isLoading"
    :placeholder="placeholder"
    clearable
    filterable
    remote
    reserve-keyword
    class="w-full"
    :remote-method="search"
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
import { onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { ProducerSearchModel } from '@/models/producerSearchModel.ts'
import { getProducer } from '@/services/api/producers.ts'
import { searchProducers } from '@/services/api/search.ts'

withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: 'Выберите производителя',
  },
)

const producerId = defineModel<number | undefined>()

const producers = ref<ProducerSearchModel[]>([])
const searchTerm = ref('')
const isLoading = ref(false)

const loadDebounced = useDebounceFn(async () => loadProducers(), 250)

async function search(query: string) {
  searchTerm.value = query
  await loadDebounced()
}

async function loadProducers() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const resp = await searchProducers({
      query: searchTerm.value.trim() || undefined,
      page: 0,
      size: 100,
    })

    producers.value = resp.producers
  } finally {
    isLoading.value = false
  }
}

async function ensureSelectedProducerLoaded(id?: number) {
  if (!id || producers.value.some((producer) => producer.id === id)) return

  const resp = await getProducer(id)
  producers.value = [resp.producer, ...producers.value]
}

watch(producerId, async (id) => ensureSelectedProducerLoaded(id), { immediate: true })
onMounted(loadProducers)
</script>
