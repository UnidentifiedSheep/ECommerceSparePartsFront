<template>
  <el-select-v2
    v-model="characteristicId"
    :options="options"
    :loading="loading"
    :placeholder="t('products.details.selectCharacteristic')"
    :popper-class="popperClass"
    :remote-method="search"
    :disabled="disabled"
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
import { computed, ref, useId, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useSelectInfiniteScroll } from '@/composables/useSelectInfiniteScroll.ts'
import { getCharacteristicsByIdsGraphql, searchCharacteristicsGraphql, type Characteristic } from '@/services/graphql/products.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{ disabled?: boolean; selectedName?: string }>()
const characteristicId = defineModel<number | undefined>()
const { t } = useI18n()
const pageSize = 50
const items = ref<Characteristic[]>([])
const knownNames = ref<Record<number, string>>({})
const loading = ref(false)
const loadError = ref(false)
const hasMore = ref(true)
const nextPage = ref(0)
const activeQuery = ref('')
const popperClass = `characteristic-select-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
let requestId = 0
const { attach, detach } = useSelectInfiniteScroll(popperClass, loadMore)

const options = computed(() => {
  const values = new Map<number, { value: number; label: string }>()
  if (characteristicId.value !== undefined) {
    values.set(characteristicId.value, {
      value: characteristicId.value,
      label: props.selectedName ?? knownNames.value[characteristicId.value] ?? `#${characteristicId.value}`,
    })
  }
  items.value.forEach((item) => values.set(item.id, { value: item.id, label: item.name }))
  return [...values.values()]
})

async function loadMore() {
  if (loading.value || !hasMore.value) return
  const currentRequest = requestId
  const page = nextPage.value
  loading.value = true
  loadError.value = false
  try {
    const result = await searchCharacteristicsGraphql({ searchTerm: activeQuery.value, page, size: pageSize })
    if (currentRequest !== requestId) return
    const ids = new Set(items.value.map((item) => item.id))
    items.value = [...items.value, ...result.filter((item) => !ids.has(item.id))]
    knownNames.value = { ...knownNames.value, ...Object.fromEntries(result.map((item) => [item.id, item.name])) }
    nextPage.value = page + 1
    hasMore.value = result.length === pageSize
  } catch {
    if (currentRequest === requestId) loadError.value = true
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

const debouncedLoad = useDebounceFn(() => loadMore(), 250)
function search(query: string) {
  const normalized = query.trim()
  if (normalized === activeQuery.value && items.value.length > 0) return
  requestId += 1
  activeQuery.value = normalized
  items.value = []
  nextPage.value = 0
  hasMore.value = true
  loading.value = false
  loadError.value = false
  void debouncedLoad()
}

function onVisibleChange(open: boolean) {
  if (open) {
    void attach()
    if (items.value.length === 0 && !loading.value) void loadMore()
  } else {
    detach()
  }
}

const canRetry = computed(() => loadError.value && items.value.length > 0)
watch(characteristicId, async (id) => {
  if (id === undefined || props.selectedName || knownNames.value[id]) return
  try {
    const result = await getCharacteristicsByIdsGraphql([id])
    if (result[0]) knownNames.value = { ...knownNames.value, [id]: result[0].name }
  } catch {
    // Preserve the selected ID if its label cannot be loaded.
  }
}, { immediate: true })
</script>
