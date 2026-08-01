<template>
  <el-dialog
    v-model="isOpen"
    :title="t('products.selectorTitle')"
    width="min(980px, calc(100vw - 24px))"
    class="product-selector-dialog"
  >
    <div class="space-y-3">
      <div class="product-selector-search">
        <div
          class="product-selector-search__primary"
          :class="{ 'product-selector-search__primary--sku': searchMode === 'sku' }"
        >
          <div class="product-selector-field product-selector-field--mode">
            <label>{{ t('products.searchMode') }}</label>
            <el-select v-model="searchMode" class="w-full">
              <el-option :label="t('products.searchAll')" value="all" />
              <el-option :label="t('products.searchSku')" value="sku" />
            </el-select>
          </div>

          <div class="product-selector-field product-selector-field--query">
            <label>{{ t('common.labels.search') }}</label>
            <el-input
              v-model="query"
              clearable
              :placeholder="searchPlaceholder"
              @keyup.enter="loadProducts(true)"
            />
          </div>

          <div v-if="searchMode === 'sku'" class="product-selector-field product-selector-field--match">
            <label>{{ t('products.matchMode') }}</label>
            <el-select v-model="skuSearchMode" class="w-full">
              <el-option
                v-for="mode in skuSearchModes"
                :key="mode"
                :label="t(`products.skuSearchModes.${mode}`)"
                :value="mode"
              />
            </el-select>
          </div>
        </div>

        <div class="product-selector-search__filters">
          <div class="product-selector-field">
            <label>{{ t('common.labels.producer') }}</label>
            <ProducerSelector v-model="producerId" :placeholder="t('products.allProducers')" />
          </div>
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="isLoading"
        :data="products"
        class="product-selector-results"
        stripe
        height="min(420px, calc(100dvh - 280px))"
        :empty-text="t('products.notFound')"
        @row-dblclick="selectProduct"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="sku" :label="t('products.sku')" min-width="150" sortable="custom">
          <template #default="{ row }">
            <ProductSkuCell :sku="row.sku" :indicator="row.indicator" />
          </template>
        </el-table-column>
        <el-table-column prop="name" :label="t('common.labels.name')" min-width="280" show-overflow-tooltip />
        <el-table-column
          prop="producerId"
          :label="t('common.labels.producer')"
          min-width="180"
          sortable="custom"
        >
          <template #default="{ row }">
            {{ producerName(row.producerId) }}
          </template>
        </el-table-column>
        <el-table-column prop="stock" :label="t('products.stock')" min-width="140" sortable="custom">
          <template #default="{ row }">
            <ProductStockCell :stock="row.stock" />
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="" width="96" align="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="selectProduct(row)">{{ t('products.pick') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-start">
        <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" />
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { TableInstance } from 'element-plus'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { getProducersByIds } from '@/services/api/producers.ts'
import {
  searchProducts,
  searchProductsBySku,
  type SkuSearchMode,
} from '@/services/api/search.ts'
import { useI18n } from '@/i18n'
import {
  loadProductSearchPreferences,
  productDialogSearchPreferencesKey,
  saveProductSearchPreferences,
  type ProductSearchMode,
} from '@/utils/productSearchPreferences.ts'

const { t } = useI18n()
const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  select: [product: ProductSearchModel]
}>()

const products = ref<ProductSearchModel[]>([])
const tableRef = ref<TableInstance>()
const producerNames = ref<Record<number, string>>({})
const query = ref('')
const producerId = ref<number>()
const sortBy = ref<string>()
let searchPreferences = loadProductSearchPreferences(productDialogSearchPreferencesKey)
const searchMode = ref<ProductSearchMode>(searchPreferences.searchMode)
const skuSearchMode = ref<SkuSearchMode>(searchPreferences.skuSearchMode)
const page = ref(0)
const size = ref(20)
const hasNext = ref(false)
const isLoading = ref(false)
let productsRequestId = 0
let isResettingOnOpen = false
const skuSearchModes: SkuSearchMode[] = ['Full', 'Exact', 'StartsWith', 'Contains', 'Fuzzy']

const searchPlaceholder = computed(() => (
  searchMode.value === 'sku' ? t('products.skuPlaceholder') : t('products.searchPlaceholder')
))

const searchProductsDebounced = useDebounceFn(async () => {
  await loadProducts(true)
}, 350)

function producerName(id: number) {
  return producerNames.value[id] ?? '-'
}

function selectProduct(product: ProductSearchModel) {
  emit('select', product)
  isOpen.value = false
}

async function handleSortChange({ prop, order }: { prop?: string; order?: string | null }) {
  sortBy.value = prop && order
    ? order === 'descending' ? `${prop}_desc` : prop
    : undefined

  if (!isResettingOnOpen) await loadProducts(true)
}

function resetSelectorState() {
  isResettingOnOpen = true
  productsRequestId += 1
  query.value = ''
  producerId.value = undefined
  sortBy.value = undefined
  searchPreferences = loadProductSearchPreferences(productDialogSearchPreferencesKey)
  searchMode.value = searchPreferences.searchMode
  skuSearchMode.value = searchPreferences.skuSearchMode
  page.value = 0
  size.value = 20
  products.value = []
  hasNext.value = false
  isLoading.value = false

  queueMicrotask(() => {
    tableRef.value?.clearSort()
    isResettingOnOpen = false
  })
}

async function loadProducts(resetPage: boolean) {
  if (!isOpen.value) return

  if (resetPage) page.value = 0

  const requestId = ++productsRequestId
  isLoading.value = true
  try {
    const normalizedQuery = query.value.trim()
    const resp = searchMode.value === 'sku'
      ? await searchProductsBySku({
          sku: normalizedQuery,
          producerId: producerId.value,
          searchMode: skuSearchMode.value,
          page: page.value,
          size: size.value,
          sortBy: sortBy.value ? [sortBy.value] : undefined,
        })
      : await searchProducts({
          query: normalizedQuery || undefined,
          producerId: producerId.value,
          page: page.value,
          size: size.value,
          sortBy: sortBy.value ? [sortBy.value] : undefined,
        })

    if (requestId !== productsRequestId) return

    products.value = resp.products
    hasNext.value = resp.products.length === size.value
    await loadProducerNames(resp.products)
  } finally {
    if (requestId === productsRequestId) {
      isLoading.value = false
    }
  }
}

async function loadProducerNames(items: ProductSearchModel[]) {
  const ids = [...new Set(items.map((product) => product.producerId))]
    .filter((id) => !producerNames.value[id])

  const producers = await getProducersByIds(ids)
  producers.forEach((producer) => {
    producerNames.value[producer.id] = producer.name
  })
}

watch(isOpen, async (open) => {
  if (!open) return

  resetSelectorState()
  await loadProducts(true)
})
watch(page, async () => {
  if (!isResettingOnOpen) await loadProducts(false)
})
watch(size, async () => {
  if (!isResettingOnOpen) await loadProducts(true)
})
watch(producerId, async () => {
  if (!isResettingOnOpen) await loadProducts(true)
})
watch(searchMode, async () => {
  if (isResettingOnOpen) return
  rememberSearchPreferences()
  await loadProducts(true)
})
watch(skuSearchMode, async () => {
  if (isResettingOnOpen) return
  rememberSearchPreferences()
  if (searchMode.value === 'sku') await loadProducts(true)
})
watch(query, () => {
  if (!isResettingOnOpen) searchProductsDebounced()
})

function rememberSearchPreferences() {
  searchPreferences = {
    searchMode: searchMode.value,
    skuSearchMode: skuSearchMode.value,
  }
  saveProductSearchPreferences(productDialogSearchPreferencesKey, searchPreferences)
}
onMounted(async () => {
  if (isOpen.value) await loadProducts(true)
})
</script>

<style scoped>
:deep(.product-selector-dialog .el-dialog__header) {
  padding: 18px 20px 12px;
}

:deep(.product-selector-dialog .el-dialog__body) {
  padding: 12px 20px 20px;
}

.product-selector-search { display: grid; gap: 12px; }
.product-selector-search__primary {
  display: grid;
  grid-template-columns: 180px minmax(240px, 1fr);
  align-items: end;
  gap: 12px;
}
.product-selector-search__primary--sku { grid-template-columns: 180px minmax(240px, 1fr) 200px; }
.product-selector-search__filters {
  display: grid;
  grid-template-columns: minmax(220px, 360px);
  gap: 12px;
}
.product-selector-results { margin-top: 20px !important; }
.product-selector-field { min-width: 0; }
.product-selector-field > label {
  display: block;
  margin-bottom: 6px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .product-selector-search__primary,
  .product-selector-search__filters { grid-template-columns: 1fr; }
  :deep(.product-selector-dialog) {
    margin-top: 12px;
  }

  :deep(.product-selector-dialog .el-dialog__header) {
    padding: 14px 14px 10px;
  }

  :deep(.product-selector-dialog .el-dialog__body) {
    padding: 10px 14px 14px;
  }
}
</style>
