<template>
  <el-drawer
    :model-value="modelValue"
    direction="rtl"
    size="min(480px, 100vw)"
    class="product-quick-view-drawer"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div v-if="product" class="quick-view-header">
        <ProductSkuCell :sku="product.sku" :indicator="product.indicator" />
        <h2>{{ product.name }}</h2>
        <p>{{ displayProducerName }}</p>
      </div>
    </template>

    <div v-if="product" v-loading="isLoading" class="quick-view-body">
      <section class="quick-view-section quick-view-stock">
        <div class="quick-view-stock__summary">
          <div>
            <h3>{{ t('products.quickView.totalStock') }}</h3>
            <p>{{ t('products.quickView.totalStockHint') }}</p>
          </div>
          <div class="quick-view-stock__value">
            <ProductStockCell :stock="displayStock" />
            <el-button
              v-if="canViewStorageContent"
              text
              size="small"
              :loading="isStorageStockLoading"
              @click="toggleStorageStock"
            >
              {{ stockExpanded ? t('products.quickView.hideByStorage') : t('products.quickView.byStorage') }}
              <el-icon class="el-icon--right"><component :is="stockExpanded ? ArrowUp : ArrowDown" /></el-icon>
            </el-button>
          </div>
        </div>

        <el-collapse-transition>
          <div v-if="stockExpanded" class="quick-view-storage-stock">
            <div v-if="storageStocks.length > 0" class="quick-view-storage-stock__list">
              <div v-for="item in storageStocks" :key="item.storageName" class="quick-view-storage-stock__row">
                <span>
                  <strong>{{ item.storageName }}</strong>
                  <small>{{ t('products.quickView.storageBatches', { count: item.batches }) }}</small>
                </span>
                <ProductStockCell :stock="item.count" />
              </div>
            </div>
            <p v-else-if="!isStorageStockLoading" class="quick-view-storage-stock__empty">
              {{ t('products.quickView.noStorageStock') }}
            </p>
          </div>
        </el-collapse-transition>
      </section>

      <section class="quick-view-section">
        <h3>{{ t('products.quickView.specifications') }}</h3>
        <dl class="quick-view-specs">
          <div>
            <dt>{{ t('common.labels.producer') }}</dt>
            <dd>{{ displayProducerName }}</dd>
          </div>
          <div>
            <dt>{{ t('products.weight') }}</dt>
            <dd v-if="product.weight">
              {{ product.weight.value }} {{ weightMeasureUnitLabel(product.weight.unit, product.weight.value) }}
            </dd>
            <dd v-else>—</dd>
          </div>
          <div class="quick-view-specs__wide">
            <dt>{{ t('products.dimensions') }}</dt>
            <dd v-if="product.dimensions">
              {{ formatDimension(product.dimensions.length) }} ×
              {{ formatDimension(product.dimensions.width) }} ×
              {{ formatDimension(product.dimensions.height) }}
              {{ dimensionMeasureUnitLabel(product.dimensions.unit) }}
            </dd>
            <dd v-else>—</dd>
          </div>
        </dl>
      </section>

      <section v-if="fullProduct?.description" class="quick-view-section">
        <h3>{{ t('products.quickView.description') }}</h3>
        <p class="quick-view-description">{{ fullProduct.description }}</p>
      </section>

      <section v-if="canViewCrosses" class="quick-view-section quick-view-crosses">
        <div class="quick-view-section__header">
          <div>
            <h3>{{ t('products.crosses') }}</h3>
            <p>{{ t('products.quickView.crossesShown', { count: crosses.length }) }}</p>
          </div>
          <el-button v-if="crosses.length > 0" text @click="emit('open-product', product.id)">
            {{ t('products.quickView.showAll') }}
          </el-button>
        </div>

        <div v-if="crosses.length > 0" class="quick-view-cross-list">
          <button
            v-for="cross in crosses"
            :key="cross.id"
            type="button"
            class="quick-view-cross-row"
            @click="emit('open-product', cross.id)"
          >
            <span class="quick-view-cross-row__identity">
              <ProductSkuCell :sku="cross.sku" :indicator="cross.indicator" />
              <span>{{ cross.name }}</span>
            </span>
            <span class="quick-view-cross-row__stock">
              <ProductStockCell :stock="cross.stock" />
              <el-icon><ArrowRight /></el-icon>
            </span>
          </button>
        </div>

        <el-empty
          v-else-if="!isLoading"
          :description="t('products.quickView.noCrosses')"
          :image-size="56"
        />
      </section>
    </div>

    <template #footer>
      <div v-if="product" class="quick-view-footer">
        <el-button
          v-if="canViewPriceOffers"
          :icon="Money"
          plain
          @click="emit('open-prices', product)"
        >
          {{ t('priceOffers.open') }}
        </el-button>
        <el-button type="primary" @click="emit('open-product', product.id)">
          {{ t('products.quickView.openFull') }}
          <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowDown, ArrowRight, ArrowUp, Money } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import type { ProductModel } from '@/models/productModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { getProductById, getProductCrosses } from '@/services/api/products.ts'
import { getStorageContent } from '@/services/api/storages.ts'
import { dimensionMeasureUnitLabel, weightMeasureUnitLabel } from '@/utils/measurementUnits.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  modelValue: boolean
  product: ProductSearchModel | null
  producerName?: string
  canViewPriceOffers?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open-product': [productId: number]
  'open-prices': [product: ProductSearchModel]
}>()

const { locale, t } = useI18n()
const { hasPermission } = usePermissions()
const canViewCrosses = computed(() => hasPermission('ARTICLE_CROSSES_GET'))
const canViewStorageContent = computed(() => hasPermission('STORAGES_CONTENT_GET_ALL'))
const fullProduct = ref<ProductModel | null>(null)
const crosses = ref<ProductModel[]>([])
const storageStocks = ref<Array<{ storageName: string; count: number; batches: number }>>([])
const stockExpanded = ref(false)
const storageStockLoaded = ref(false)
const isStorageStockLoading = ref(false)
const isLoading = ref(false)
let requestId = 0
let stockRequestId = 0

const displayProducerName = computed(() => fullProduct.value?.producerName || props.producerName || '—')
const displayStock = computed(() => fullProduct.value?.stock ?? props.product?.stock ?? 0)

function formatDimension(value: number) {
  return value.toLocaleString(locale.value)
}

async function toggleStorageStock() {
  stockExpanded.value = !stockExpanded.value
  if (stockExpanded.value && !storageStockLoaded.value) {
    await loadStorageStock()
  }
}

async function loadStorageStock() {
  if (!props.product || !canViewStorageContent.value || isStorageStockLoading.value) return

  const currentRequestId = ++stockRequestId
  const productId = props.product.id
  const pageSize = 100
  let page = 0
  const contents = []
  isStorageStockLoading.value = true

  try {
    while (true) {
      const response = await getStorageContent({
        productId,
        page,
        size: pageSize,
        showZeroContent: false,
      })
      if (currentRequestId !== stockRequestId) return

      contents.push(...response.contents)
      if (response.contents.length < pageSize) break
      page += 1
    }

    const byStorage = new Map<string, { storageName: string; count: number; batches: number }>()
    contents.forEach((item) => {
      const current = byStorage.get(item.storageName) ?? {
        storageName: item.storageName,
        count: 0,
        batches: 0,
      }
      current.count += item.count
      current.batches += 1
      byStorage.set(item.storageName, current)
    })

    storageStocks.value = [...byStorage.values()].sort((left, right) => (
      right.count - left.count || left.storageName.localeCompare(right.storageName, locale.value)
    ))
    storageStockLoaded.value = true
  } catch (error) {
    if (currentRequestId === stockRequestId) {
      ElMessage.error(error instanceof Error ? error.message : t('products.quickView.stockLoadError'))
    }
  } finally {
    if (currentRequestId === stockRequestId) isStorageStockLoading.value = false
  }
}

async function loadPreview() {
  if (!props.modelValue || !props.product) return

  const currentRequestId = ++requestId
  isLoading.value = true
  fullProduct.value = null
  crosses.value = []
  stockRequestId += 1
  storageStocks.value = []
  stockExpanded.value = false
  storageStockLoaded.value = false
  isStorageStockLoading.value = false

  try {
    const [productResponse, crossesResponse] = await Promise.all([
      getProductById(props.product.id),
      canViewCrosses.value
        ? getProductCrosses({ productId: props.product.id, page: 0, size: 5, sortBy: 'sku' })
        : Promise.resolve({ crosses: [] }),
    ])
    if (currentRequestId !== requestId) return

    fullProduct.value = productResponse.product
    crosses.value = crossesResponse.crosses
  } catch (error) {
    if (currentRequestId === requestId) {
      ElMessage.error(error instanceof Error ? error.message : t('products.quickView.loadError'))
    }
  } finally {
    if (currentRequestId === requestId) isLoading.value = false
  }
}

watch(
  () => [props.modelValue, props.product?.id],
  () => void loadPreview(),
  { immediate: true },
)
</script>

<style>
.product-quick-view-drawer .el-drawer__header {
  margin-bottom: 0;
  border-bottom: 1px solid #dfe3e8;
  padding: 18px 20px;
}

.product-quick-view-drawer .el-drawer__body {
  padding: 0;
}

.product-quick-view-drawer .el-drawer__footer {
  border-top: 1px solid #dfe3e8;
  padding: 12px 20px;
}
</style>

<style scoped>
.quick-view-header {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.quick-view-header h2 {
  overflow: hidden;
  margin: 3px 0 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-view-header p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.quick-view-body {
  min-height: 240px;
}

.quick-view-section {
  border-bottom: 1px solid #eceff2;
  padding: 18px 20px;
}

.quick-view-section:last-child {
  border-bottom: 0;
}

.quick-view-section h3 {
  margin: 0;
  color: #1e293b;
  font-size: 14px;
  font-weight: 650;
}

.quick-view-section > p,
.quick-view-section__header p,
.quick-view-stock p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.quick-view-stock {
  background: #fafafa;
}

.quick-view-stock__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.quick-view-stock__value {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.quick-view-storage-stock {
  margin-top: 14px;
  border-top: 1px solid #dfe3e8;
  padding-top: 6px;
}

.quick-view-storage-stock__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #eceff2;
  padding: 9px 0;
}

.quick-view-storage-stock__row:last-child {
  border-bottom: 0;
}

.quick-view-storage-stock__row > span {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.quick-view-storage-stock__row strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-view-storage-stock__row small {
  color: #64748b;
  font-size: 11px;
}

.quick-view-storage-stock__empty {
  margin: 10px 0 4px !important;
  text-align: center;
}

.quick-view-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 14px 0 0;
}

.quick-view-specs div {
  min-width: 0;
}

.quick-view-specs__wide {
  grid-column: 1 / -1;
}

.quick-view-specs dt {
  margin-bottom: 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.quick-view-specs dd {
  margin: 0;
  color: #1e293b;
  font-size: 13px;
  font-weight: 550;
}

.quick-view-description {
  margin-top: 10px !important;
  color: #475569 !important;
  font-size: 13px !important;
  line-height: 1.55;
  white-space: pre-wrap;
}

.quick-view-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.quick-view-cross-list {
  border-top: 1px solid #eceff2;
}

.quick-view-cross-row {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 0;
  border-bottom: 1px solid #eceff2;
  background: transparent;
  padding: 10px 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.quick-view-cross-row:hover {
  background: #fafbfc;
}

.quick-view-cross-row__identity {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.quick-view-cross-row__identity > span:last-child {
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-view-cross-row__stock {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  color: #64748b;
}

.quick-view-cross-row__stock :deep(.stock-cell) {
  grid-template-columns: minmax(34px, auto);
  min-width: 34px;
}

.quick-view-cross-row__stock :deep(.stock-cell__rail) {
  display: none;
}

.quick-view-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 520px) {
  .quick-view-stock__summary {
    align-items: flex-start;
  }

  .quick-view-stock__value {
    align-items: flex-end;
    flex-direction: column;
  }

  .quick-view-footer {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .quick-view-footer .el-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>
