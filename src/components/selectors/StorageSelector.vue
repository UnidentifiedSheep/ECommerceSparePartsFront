<template>
  <el-select
    v-model="selectedStorageName"
    filterable
    remote
    clearable
    :disabled="disabled"
    :remote-method="onSearch"
    :loading="isLoading"
    :placeholder="placeholder"
    class="w-full"
    :popper-class="popperClass"
    @visible-change="onVisibleChange"
  >
    <el-option
      v-for="storage in storages"
      :key="storage.name"
      :label="storage.name"
      :value="storage.name"
    >
      <div class="storage-option">
        <span>{{ storage.name }}</span>
        <small>{{ toText(storage.type) }}</small>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { StorageModel } from '@/models/storageModel.ts'
import { useSelectInfiniteScroll } from '@/composables/useSelectInfiniteScroll.ts'
import { type StorageType, toText } from '@/enums/storageType.ts'
import { getStorages } from '@/services/api/storages.ts'
import { useI18n } from '@/i18n'

const props = withDefaults(defineProps<{
  placeholder?: string
  disabled?: boolean
  type?: StorageType
}>(), {
  placeholder: undefined,
  disabled: false,
  type: undefined,
})

const { t } = useI18n()
const placeholder = computed(() => props.placeholder ?? t('storages.selectStorage'))
const selectedStorageName = defineModel<string | undefined>({ required: true })

const storages = ref<StorageModel[]>([])
const searchTerm = ref('')
const isLoading = ref(false)
const page = ref(0)
const limit = ref(50)
const hasNextPage = ref(true)
const popperClass = `storage-selector-${Math.random().toString(36).slice(2)}`
const { attach: attachScroll, detach: detachScroll } = useSelectInfiniteScroll(popperClass, () => loadStorages(false))

const loadStoragesDebounced = useDebounceFn(async () => {
  await loadStorages(true)
}, 300)

function ensureSelectedStorage() {
  if (!selectedStorageName.value) return
  const exists = storages.value.some((storage) => storage.name === selectedStorageName.value)
  if (exists) return

  storages.value.unshift({
    name: selectedStorageName.value,
    type: props.type ?? storages.value[0]?.type,
  } as StorageModel)
}

async function loadStorages(reset = false) {
  if (isLoading.value) return
  if (reset) {
    page.value = 0
    hasNextPage.value = true
    storages.value = []
  }

  if (!hasNextPage.value) return

  isLoading.value = true
  try {
    const resp = await getStorages({
      page: page.value,
      limit: limit.value,
      searchTerm: searchTerm.value.trim() || undefined,
      type: props.type,
    })
    const existingNames = new Set(storages.value.map((storage) => storage.name))
    storages.value.push(...resp.storages.filter((storage) => !existingNames.has(storage.name)))
    hasNextPage.value = resp.storages.length === limit.value
    page.value += 1
    ensureSelectedStorage()
  } finally {
    isLoading.value = false
  }
}

function onSearch(query: string) {
  searchTerm.value = query
  loadStoragesDebounced()
}

function onVisibleChange(open: boolean) {
  if (!open) {
    detachScroll()
    return
  }

  attachScroll()
  if (storages.value.length === 0) {
    loadStorages(true)
  }
}

watch(selectedStorageName, ensureSelectedStorage)
watch(() => props.type, () => loadStorages(true))

onMounted(() => loadStorages(true))
</script>

<style scoped>
.storage-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.storage-option small {
  color: #94a3b8;
  font-size: 12px;
}
</style>
