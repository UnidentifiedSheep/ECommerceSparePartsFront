<template>
  <el-dialog
    v-model="isOpen"
    width="min(760px, calc(100vw - 32px))"
    :title="t('sales.storageBatchesTitle')"
    destroy-on-close
  >
    <div class="batches-meta">
      <div>
        <span>{{ t('common.labels.product') }}</span>
        <strong>{{ productName || '—' }}</strong>
        <small>{{ productSku || '—' }}</small>
      </div>
      <div>
        <span>{{ t('common.labels.storage') }}</span>
        <strong>{{ storageCode || '—' }}</strong>
      </div>
    </div>

    <el-table v-loading="isLoading" :data="contents" stripe max-height="420" class="batches-table">
      <el-table-column prop="id" width="82"><template #header><SortableColumnHeader label="ID" field="id" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSortToggle" /></template></el-table-column>
      <el-table-column prop="count" min-width="110">
        <template #header><SortableColumnHeader :label="t('common.labels.count')" field="count" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSortToggle" /></template>
        <template #default="{ row }">
          <strong>{{ row.count.toLocaleString(locale) }}</strong>
        </template>
      </el-table-column>
      <el-table-column prop="buyPrice" min-width="130">
        <template #header><SortableColumnHeader :label="t('sales.purchasePrice')" field="buyPrice" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSortToggle" /></template>
        <template #default="{ row }">
          {{ formatCurrency(row.buyPrice, row.currency?.currencySign) }}
        </template>
      </el-table-column>
      <el-table-column prop="currencyId" min-width="150" show-overflow-tooltip>
        <template #header><SortableColumnHeader :label="t('common.labels.currency')" field="currencyId" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSortToggle" /></template>
        <template #default="{ row }">
          {{ row.currency?.shortName }} ({{ row.currency?.currencySign }})
        </template>
      </el-table-column>
      <el-table-column prop="purchaseDatetime" min-width="180">
        <template #header><SortableColumnHeader :label="t('sales.purchaseDate')" field="purchaseDatetime" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSortToggle" /></template>
        <template #default="{ row }">
          {{ formatDate(row.purchaseDatetime) }}
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!isLoading && contents.length === 0" :description="t('sales.noStorageBatches')" />

    <div class="batches-pagination">
      <el-button :disabled="page === 0 || isLoading" @click="page--">{{ t('common.actions.back') }}</el-button>
      <span>{{ t('common.labels.page', { page: page + 1 }) }}</span>
      <el-button :disabled="!hasNext || isLoading" @click="page++">{{ t('common.actions.forward') }}</el-button>
    </div>

    <template #footer>
      <el-button @click="isOpen = false">{{ t('common.actions.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import SortableColumnHeader from '@/components/common/SortableColumnHeader.vue'
import type { StorageContentModel } from '@/models/storageContentModel.ts'
import { getStorageContent } from '@/services/api/storages.ts'
import { formatLocalDateTime } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'
import { useMultiSort } from '@/composables/useMultiSort.ts'

const props = defineProps<{
  storageCode?: string
  productId?: number
  productName?: string
  productSku?: string
}>()

const isOpen = defineModel<boolean>({ required: true })
const { locale, t } = useI18n()
const contents = ref<StorageContentModel[]>([])
const isLoading = ref(false)
const page = ref(0)
const size = 20
const hasNext = ref(false)
const { sortBy, toggleSort } = useMultiSort()

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

function formatDate(value: string) {
  return formatLocalDateTime(value)
}

async function loadContents() {
  if (!isOpen.value || !props.storageCode || !props.productId) {
    contents.value = []
    hasNext.value = false
    return
  }

  isLoading.value = true
  try {
    const resp = await getStorageContent({
      storageCode: props.storageCode,
      productId: props.productId,
      page: page.value,
      size,
      showZeroContent: false,
      sortBy: sortBy.value,
    })
    contents.value = resp.contents
    hasNext.value = resp.contents.length === size
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('sales.loadStorageBatchesError'))
  } finally {
    isLoading.value = false
  }
}

async function handleSortToggle(field: string, event: MouseEvent) {
  toggleSort(field, event)
  if (page.value !== 0) {
    page.value = 0
    return
  }
  await loadContents()
}

watch(isOpen, (open) => {
  if (open) {
    page.value = 0
    void loadContents()
  }
})

watch(page, () => {
  void loadContents()
})

watch(() => [props.storageCode, props.productId], () => {
  if (!isOpen.value) return
  page.value = 0
  void loadContents()
})
</script>

<style scoped>
.batches-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 220px);
  gap: 12px;
  margin-bottom: 14px;
}

.batches-meta > div {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px 12px;
}

.batches-meta span,
.batches-meta strong,
.batches-meta small {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
}

.batches-meta span,
.batches-meta small {
  color: #64748b;
  font-size: 12px;
}

.batches-meta strong {
  margin: 4px 0 2px;
  color: #111827;
  font-size: 14px;
}

.batches-table {
  width: 100%;
}

.batches-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.batches-pagination span {
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 640px) {
  .batches-meta {
    grid-template-columns: 1fr;
  }
}
</style>
