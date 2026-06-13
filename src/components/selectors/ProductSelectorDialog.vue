<template>
  <el-dialog
    v-model="isOpen"
    title="Выбор товара"
    width="min(920px, calc(100vw - 24px))"
    class="product-selector-dialog"
  >
    <div class="space-y-3">
      <div class="grid grid-cols-1 items-end gap-3 md:grid-cols-[minmax(260px,1fr)_260px]">
        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">Поиск</label>
          <el-input
            v-model="query"
            clearable
            placeholder="Артикул, название или текст"
            @keyup.enter="loadProducts(true)"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">Производитель</label>
          <ProducerSelector v-model="producerId" placeholder="Все производители" />
        </div>
      </div>

      <el-table
        v-loading="isLoading"
        :data="products"
        stripe
        height="min(420px, calc(100dvh - 280px))"
        empty-text="Товары не найдены"
        @row-dblclick="selectProduct"
      >
        <el-table-column prop="sku" label="Артикул" min-width="150" />
        <el-table-column prop="name" label="Название" min-width="280" show-overflow-tooltip />
        <el-table-column label="Производитель" min-width="180">
          <template #default="{ row }">
            {{ producerName(row.producerId) }}
          </template>
        </el-table-column>
        <el-table-column label="Остаток" min-width="110" align="right">
          <template #default="{ row }">
            <span :class="stockColorClass(row.stock)">
              {{ row.stock.toLocaleString('ru-RU') }}
            </span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="" width="96" align="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" plain @click="selectProduct(row)">Выбрать</el-button>
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
import { onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import ProducerSelector from '@/components/selectors/ProducerSelector.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { getProducer } from '@/services/api/producers.ts'
import { searchProducts } from '@/services/api/search.ts'

const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  select: [product: ProductSearchModel]
}>()

const products = ref<ProductSearchModel[]>([])
const producerNames = ref<Record<number, string>>({})
const query = ref('')
const producerId = ref<number>()
const page = ref(0)
const size = ref(20)
const hasNext = ref(false)
const isLoading = ref(false)
let productsRequestId = 0

const searchProductsDebounced = useDebounceFn(async () => {
  await loadProducts(true)
}, 350)

function producerName(id: number) {
  return producerNames.value[id] ?? '-'
}

function stockColorClass(stock: number) {
  if (stock <= 0) return 'text-red-700 font-semibold'
  if (stock <= 5) return 'text-amber-600 font-semibold'
  return 'text-emerald-700 font-semibold'
}

function selectProduct(product: ProductSearchModel) {
  emit('select', product)
  isOpen.value = false
}

async function loadProducts(resetPage: boolean) {
  if (!isOpen.value) return

  if (resetPage) page.value = 0

  const requestId = ++productsRequestId
  isLoading.value = true
  try {
    const resp = await searchProducts({
      query: query.value.trim() || undefined,
      producerId: producerId.value,
      page: page.value,
      size: size.value,
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

  await Promise.all(ids.map(async (id) => {
    const resp = await getProducer(id)
    producerNames.value[id] = resp.producer.name
  }))
}

watch(isOpen, async (open) => {
  if (open && products.value.length === 0) {
    await loadProducts(true)
  }
})
watch(page, async () => loadProducts(false))
watch(size, async () => loadProducts(true))
watch(producerId, async () => loadProducts(true))
watch(query, () => searchProductsDebounced())
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

@media (max-width: 640px) {
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
