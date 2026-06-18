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

const loadStoragesDebounced = useDebounceFn(async () => {
  await loadStorages()
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

async function loadStorages() {
  isLoading.value = true
  try {
    const resp = await getStorages({
      page: 0,
      limit: 50,
      searchTerm: searchTerm.value.trim() || undefined,
      type: props.type,
    })
    storages.value = resp.storages
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
  if (open && storages.value.length === 0) {
    loadStorages()
  }
}

watch(selectedStorageName, ensureSelectedStorage)
watch(() => props.type, () => loadStorages())

onMounted(loadStorages)
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
