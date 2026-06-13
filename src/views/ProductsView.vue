<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Товары</h1>
        <p class="text-sm text-slate-500">Поиск товаров по артикулу, названию и параметрам размеров.</p>
      </div>
      <el-button v-if="canCreateProducts" type="primary" @click="createDialogOpen = true">Создать продукты</el-button>
    </div>

    <div class="p-4">
      <el-card shadow="hover">
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-[220px_minmax(300px,1fr)_300px_auto_auto_auto] items-end gap-3">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">Вариант поиска</label>
              <el-select v-model="form.searchMode" size="large" class="w-full" @change="applyFilters">
                <el-option label="По всем полям" value="all" />
                <el-option label="По артикулу / SKU" value="sku" />
              </el-select>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">Поиск</label>
              <el-input
                v-model="form.query"
                clearable
                size="large"
                :placeholder="searchPlaceholder"
                @keyup.enter="applyFilters"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">Производитель</label>
              <ProducerSelector v-model="form.producerId" placeholder="Все производители" />
            </div>

            <el-badge v-if="form.searchMode === 'all'" :value="dimensionFiltersCount" :hidden="dimensionFiltersCount === 0">
              <el-button size="large" plain @click="filtersDrawerOpen = true">Фильтры</el-button>
            </el-badge>

            <el-button size="large" type="primary" @click="applyFilters">Найти</el-button>
            <el-button size="large" plain @click="resetFilters">Сбросить</el-button>
          </div>

          <div v-if="activeFilters.length > 0" class="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span class="text-xs font-medium uppercase tracking-wide text-slate-400">Активно</span>
            <el-tag
              v-for="filter in activeFilters"
              :key="filter.key"
              closable
              effect="plain"
              round
              @close="clearFilter(filter.key)"
            >
              {{ filter.label }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <el-drawer
        v-model="filtersDrawerOpen"
        title="Фильтры товаров"
        size="440px"
        class="product-filters-drawer"
      >
        <div class="flex h-full flex-col">
          <div class="flex-1 overflow-auto px-5 pb-6 pt-2">
            <fieldset class="rounded-2xl border border-slate-200 px-4 pb-6 pt-4">
              <legend class="px-2">
                <span class="inline-flex items-center gap-1.5 text-base font-semibold text-slate-900">
                  Размеры
                  <el-tooltip content="Задайте диапазоны только для тех параметров, которые важны." placement="top">
                    <el-icon class="cursor-help text-slate-400"><InfoFilled /></el-icon>
                  </el-tooltip>
                </span>
              </legend>

              <el-form label-position="top">
                <el-form-item label="Единица измерения" class="mb-5">
                  <el-select v-model="form.dimensionUnit" class="w-full">
                    <el-option
                      v-for="unit in dimensionSearchUnitOptions"
                      :key="unit.value"
                      :label="unit.label"
                      :value="unit.value"
                    />
                  </el-select>
                </el-form-item>

                  <div class="dimension-groups">
                    <fieldset class="rounded-xl border border-slate-200 bg-slate-50 px-4 pb-4 pt-3">
                      <legend class="px-2 text-sm font-medium text-slate-700">Длина</legend>
                      <div class="grid grid-cols-2 gap-3">
                        <el-form-item label="От" class="dimension-range-item">
                          <el-input-number v-model="form.lengthMin" :min="0" :precision="2" :controls="false" class="w-full" />
                      </el-form-item>
                      <el-form-item label="До" class="dimension-range-item">
                          <el-input-number v-model="form.lengthMax" :min="0" :precision="2" :controls="false" class="w-full" />
                        </el-form-item>
                      </div>
                    </fieldset>

                    <fieldset class="rounded-xl border border-slate-200 bg-slate-50 px-4 pb-4 pt-3">
                      <legend class="px-2 text-sm font-medium text-slate-700">Ширина</legend>
                      <div class="grid grid-cols-2 gap-3">
                        <el-form-item label="От" class="dimension-range-item">
                          <el-input-number v-model="form.widthMin" :min="0" :precision="2" :controls="false" class="w-full" />
                      </el-form-item>
                      <el-form-item label="До" class="dimension-range-item">
                          <el-input-number v-model="form.widthMax" :min="0" :precision="2" :controls="false" class="w-full" />
                        </el-form-item>
                      </div>
                    </fieldset>

                    <fieldset class="rounded-xl border border-slate-200 bg-slate-50 px-4 pb-4 pt-3">
                      <legend class="px-2 text-sm font-medium text-slate-700">Высота</legend>
                      <div class="grid grid-cols-2 gap-3">
                        <el-form-item label="От" class="dimension-range-item">
                          <el-input-number v-model="form.heightMin" :min="0" :precision="2" :controls="false" class="w-full" />
                      </el-form-item>
                      <el-form-item label="До" class="dimension-range-item">
                          <el-input-number v-model="form.heightMax" :min="0" :precision="2" :controls="false" class="w-full" />
                        </el-form-item>
                      </div>
                    </fieldset>
                  </div>
              </el-form>
            </fieldset>
          </div>

          <div class="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4">
            <div class="flex justify-end gap-3">
              <el-button @click="clearDimensionFilters">Очистить</el-button>
              <el-button type="primary" @click="applyFilters">Применить</el-button>
            </div>
          </div>
        </div>
      </el-drawer>

      <el-card shadow="hover" class="mt-4">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Результаты поиска</h2>
              <p class="text-sm text-slate-500">{{ resultTitle }}</p>
            </div>
          </div>
        </template>

        <el-table v-loading="isLoading" :data="products" stripe>
          <el-table-column prop="sku" label="Артикул" min-width="160" />
          <el-table-column prop="name" label="Название" min-width="260" />
          <el-table-column label="Производитель" min-width="180">
            <template #default="{ row }">
              {{ producerName(row.producerId) }}
            </template>
          </el-table-column>
          <el-table-column label="Остаток" min-width="120" align="right">
            <template #default="{ row }">
              <span :class="stockColorClass(row.stock)">
                {{ row.stock.toLocaleString('ru-RU') }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="Размеры" min-width="220">
            <template #default="{ row }">
              <span v-if="row.dimensions">
                {{ formatDimension(row.dimensions.length) }} ×
                {{ formatDimension(row.dimensions.width) }} ×
                {{ formatDimension(row.dimensions.height) }}
                {{ dimensionMeasureUnitLabel(row.dimensions.unit) }}
              </span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </el-table-column>
          <el-table-column label="Вес" min-width="140">
            <template #default="{ row }">
              <span v-if="row.weight">{{ row.weight.value }} {{ weightMeasureUnitLabel(row.weight.unit, row.weight.value) }}</span>
              <span v-else class="text-slate-400">—</span>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="Действия" width="120">
            <template #default="{ row }">
              <el-button size="small" type="primary" plain @click="openCrosses(row.id)">Кроссы</el-button>
            </template>
          </el-table-column>
        </el-table>

        <template #footer>
          <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" />
        </template>
      </el-card>
    </div>

    <CreateProductsCrossesDialog v-if="canCreateProducts" v-model="createDialogOpen" @saved="loadProducts" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { InfoFilled } from '@element-plus/icons-vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import CreateProductsCrossesDialog from '@/components/products/CreateProductsCrossesDialog.vue'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { getProducer } from '@/services/api/producers.ts'
import { searchProducts, searchProductsBySku } from '@/services/api/search.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import {
  dimensionMeasureUnitLabel,
  dimensionSearchUnitOptions,
  dimensionUnitLabel,
  weightMeasureUnitLabel,
} from '@/utils/measurementUnits.ts'

type ProductSearchMode = 'all' | 'sku'

interface ProductSearchForm {
  query: string
  searchMode: ProductSearchMode
  producerId?: number
  lengthMin?: number
  lengthMax?: number
  widthMin?: number
  widthMax?: number
  heightMin?: number
  heightMax?: number
  dimensionUnit: string
}

const route = useRoute()
const router = useRouter()

const products = ref<ProductSearchModel[]>([])
const page = ref(0)
const size = ref(20)
const hasNext = ref(false)
const isLoading = ref(false)
const producerNames = ref<Record<number, string>>({})
const filtersDrawerOpen = ref(false)
const skipNextDrawerCloseApply = ref(false)
const createDialogOpen = ref(false)
const { hasPermission } = usePermissions()
const canCreateProducts = computed(() => hasPermission('ARTICLES_CREATE'))

const form = reactive<ProductSearchForm>({
  query: '',
  searchMode: 'all',
  dimensionUnit: 'Meter',
})

const searchPlaceholder = computed(() => (
  form.searchMode === 'sku' ? 'SKU или артикул' : 'Артикул, название или текст'
))

const resultTitle = computed(() => {
  const query = form.query.trim()
  if (query) return form.searchMode === 'sku' ? `Поиск по артикулу / SKU: ${query}` : `Запрос: ${query}`
  return form.searchMode === 'sku' ? 'Введите артикул или SKU.' : 'Введите запрос или задайте фильтры.'
})

const dimensionFiltersCount = computed(() => {
  if (form.searchMode === 'sku') return 0

  return [
    form.lengthMin,
    form.lengthMax,
    form.widthMin,
    form.widthMax,
    form.heightMin,
    form.heightMax,
    form.dimensionUnit !== 'Meter' ? form.dimensionUnit : undefined,
  ].filter((value) => value !== undefined && value !== null && value !== '').length
})

const activeFilters = computed(() => {
  const filters: { key: keyof ProductSearchForm; label: string }[] = []

  if (form.producerId) filters.push({ key: 'producerId', label: `Производитель: ${producerName(form.producerId)}` })
  if (form.searchMode === 'sku') return filters

  if (form.dimensionUnit !== 'Meter') filters.push({ key: 'dimensionUnit', label: `Единица: ${dimensionUnitLabel(form.dimensionUnit)}` })
  if (form.lengthMin !== undefined) filters.push({ key: 'lengthMin', label: `Длина от ${formatDimension(form.lengthMin)}` })
  if (form.lengthMax !== undefined) filters.push({ key: 'lengthMax', label: `Длина до ${formatDimension(form.lengthMax)}` })
  if (form.widthMin !== undefined) filters.push({ key: 'widthMin', label: `Ширина от ${formatDimension(form.widthMin)}` })
  if (form.widthMax !== undefined) filters.push({ key: 'widthMax', label: `Ширина до ${formatDimension(form.widthMax)}` })
  if (form.heightMin !== undefined) filters.push({ key: 'heightMin', label: `Высота от ${formatDimension(form.heightMin)}` })
  if (form.heightMax !== undefined) filters.push({ key: 'heightMax', label: `Высота до ${formatDimension(form.heightMax)}` })

  return filters
})

function formatDimension(value: number) {
  return value.toLocaleString('ru-RU')
}

function producerName(id: number) {
  return producerNames.value[id] ?? '—'
}

function stockColorClass(stock: number) {
  if (stock <= 0) return 'text-red-700 font-semibold'
  if (stock <= 5) return 'text-amber-600 font-semibold'
  return 'text-emerald-700 font-semibold'
}

function openCrosses(productId: number) {
  router.push({
    name: 'product-details',
    params: { id: productId },
  })
}

function queryString(name: string) {
  const value = route.query[name]
  return typeof value === 'string' ? value : undefined
}

function queryNumber(name: string) {
  const value = queryString(name)
  if (!value) return undefined

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function syncFormFromRoute() {
  form.query = queryString('query') ?? ''
  form.searchMode = queryString('searchMode') === 'sku' ? 'sku' : 'all'
  form.producerId = queryNumber('producerId')
  if (form.searchMode === 'sku') {
    clearDimensionFilters()
  } else {
    form.lengthMin = queryNumber('lengthMin')
    form.lengthMax = queryNumber('lengthMax')
    form.widthMin = queryNumber('widthMin')
    form.widthMax = queryNumber('widthMax')
    form.heightMin = queryNumber('heightMin')
    form.heightMax = queryNumber('heightMax')
    form.dimensionUnit = queryString('dimensionUnit') ?? 'Meter'
  }
  page.value = queryNumber('page') ?? 0
  size.value = queryNumber('size') ?? 20
}

function buildRouteQuery(resetPage: boolean) {
  const useDimensionFilters = form.searchMode === 'all'

  return {
    query: form.query.trim() || undefined,
    searchMode: form.searchMode === 'sku' ? form.searchMode : undefined,
    producerId: form.producerId,
    lengthMin: useDimensionFilters ? form.lengthMin : undefined,
    lengthMax: useDimensionFilters ? form.lengthMax : undefined,
    widthMin: useDimensionFilters ? form.widthMin : undefined,
    widthMax: useDimensionFilters ? form.widthMax : undefined,
    heightMin: useDimensionFilters ? form.heightMin : undefined,
    heightMax: useDimensionFilters ? form.heightMax : undefined,
    dimensionUnit: useDimensionFilters ? form.dimensionUnit || undefined : undefined,
    page: resetPage ? 0 : page.value,
    size: size.value,
  }
}

async function applyFilters() {
  if (filtersDrawerOpen.value) {
    skipNextDrawerCloseApply.value = true
  }

  filtersDrawerOpen.value = false
  await router.push({
    name: 'products',
    query: buildRouteQuery(true),
  })
}

async function resetFilters() {
  form.query = ''
  form.searchMode = 'all'
  form.producerId = undefined
  form.lengthMin = undefined
  form.lengthMax = undefined
  form.widthMin = undefined
  form.widthMax = undefined
  form.heightMin = undefined
  form.heightMax = undefined
  form.dimensionUnit = 'Meter'
  filtersDrawerOpen.value = false

  await router.push({
    name: 'products',
    query: { page: 0, size: size.value },
  })
}

async function clearFilter(key: keyof ProductSearchForm) {
  if (key === 'query') {
    form.query = ''
  } else if (key === 'searchMode') {
    form.searchMode = 'all'
  } else if (key === 'dimensionUnit') {
    form.dimensionUnit = 'Meter'
  } else {
    form[key] = undefined
  }

  await applyFilters()
}

function clearDimensionFilters() {
  form.lengthMin = undefined
  form.lengthMax = undefined
  form.widthMin = undefined
  form.widthMax = undefined
  form.heightMin = undefined
  form.heightMax = undefined
  form.dimensionUnit = 'Meter'
}

async function loadProducts() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const query = form.query.trim()
    const resp = form.searchMode === 'sku'
      ? query
        ? await searchProductsBySku({
            sku: query,
            producerId: form.producerId,
            page: page.value,
            size: size.value,
          })
        : { products: [] }
      : await searchProducts({
          query: query || undefined,
          producerId: form.producerId,
          lengthMin: form.lengthMin,
          lengthMax: form.lengthMax,
          widthMin: form.widthMin,
          widthMax: form.widthMax,
          heightMin: form.heightMin,
          heightMax: form.heightMax,
          dimensionUnit: form.dimensionUnit,
          page: page.value,
          size: size.value,
        })

    products.value = resp.products
    hasNext.value = resp.products.length === size.value
    await loadProducerNames(resp.products)
    await ensureProducerName(form.producerId)
  } finally {
    isLoading.value = false
  }
}

async function ensureProducerName(id?: number) {
  if (!id || producerNames.value[id]) return

  const resp = await getProducer(id)
  producerNames.value[id] = resp.producer.name
}

async function loadProducerNames(items: ProductSearchModel[]) {
  const ids = [...new Set(items.map((product) => product.producerId))]
    .filter((id) => !producerNames.value[id])

  await Promise.all(ids.map(async (id) => {
    const resp = await getProducer(id)
    producerNames.value[id] = resp.producer.name
  }))
}

watch(
  () => route.query,
  async () => {
    syncFormFromRoute()
    await loadProducts()
  },
)

watch(filtersDrawerOpen, async (isOpen, wasOpen) => {
  if (isOpen || !wasOpen) return

  if (skipNextDrawerCloseApply.value) {
    skipNextDrawerCloseApply.value = false
    return
  }

  await applyFilters()
})

watch(page, async () => {
  await router.push({
    name: 'products',
    query: buildRouteQuery(false),
  })
})

watch(size, async () => {
  page.value = 0
  await router.push({
    name: 'products',
    query: buildRouteQuery(true),
  })
})

onMounted(async () => {
  syncFormFromRoute()
  await loadProducts()
})
</script>

<style scoped>
:deep(.product-filters-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 20px 20px 16px;
}

:deep(.product-filters-drawer .el-drawer__body) {
  padding: 0;
}

:deep(.product-filters-drawer .el-form-item) {
  margin-bottom: 16px;
}

:deep(.product-filters-drawer .dimension-range-item) {
  margin-bottom: 0;
}

.dimension-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
