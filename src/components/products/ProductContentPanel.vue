<template>
  <div class="product-data-panel">
    <div class="product-data-panel__toolbar">
      <div class="text-sm text-slate-500">{{ summary }}</div>
      <el-button v-if="canCreate" :icon="Plus" type="primary" plain @click="emit('create')">
        {{ t('common.actions.add') }}
      </el-button>
    </div>

    <el-table v-loading="loading" :data="content" :empty-text="t('products.details.noContent')">
      <el-table-column :label="t('common.labels.product')" :min-width="mobile ? 180 : 300">
        <template #default="{ row }">
          <div class="content-product">
            <button
              v-if="images(row).length"
              type="button"
              class="content-product__thumbnail"
              :aria-label="t('products.details.viewProductImages', { sku: row.product.sku })"
              @click="openImages(row, $event)"
            >
              <el-image :src="images(row)[0]" alt="" fit="contain" lazy>
                <template #error><el-icon :title="t('products.details.imageUnavailable')"><Picture /></el-icon></template>
              </el-image>
              <span v-if="images(row).length > 1" class="content-product__image-count" aria-hidden="true">{{ images(row).length }}</span>
            </button>
            <span v-else class="content-product__thumbnail content-product__thumbnail--empty" :title="t('products.details.noImages')" aria-hidden="true"><el-icon><Picture /></el-icon></span>
            <div class="content-product__identity">
              <RouterLink :to="{ name: 'product-details', params: { id: row.product.id } }" class="content-product__link">
                <ProductSkuCell :sku="row.product.sku" :indicator="row.product.indicator" />
              </RouterLink>
              <div class="content-product__name" :title="row.product.name">{{ row.product.name }}</div>
              <div class="content-product__producer">{{ row.product.producerName || '—' }}</div>
              <div v-if="mobile" class="content-product__metadata">
                <span>{{ t('products.details.quantityInKit') }}: <strong>{{ row.quantity.toLocaleString(locale) }}</strong></span>
                <span class="content-product__stock" :title="t('products.quickView.totalStockHint')">
                  {{ t('products.quickView.totalStock') }}: <ProductStockCell :stock="row.product.stock" />
                </span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-if="!mobile" prop="quantity" :label="t('products.details.quantityInKit')" width="120" align="right">
        <template #default="{ row }">{{ row.quantity.toLocaleString(locale) }}</template>
      </el-table-column>
      <el-table-column v-if="!mobile" :label="t('products.quickView.totalStock')" min-width="150" align="right">
        <template #header>
          <span :title="t('products.quickView.totalStockHint')">{{ t('products.quickView.totalStock') }}</span>
        </template>
        <template #default="{ row }"><ProductStockCell :stock="row.product.stock" /></template>
      </el-table-column>
      <el-table-column v-if="canEdit || canDelete" label="" width="96" align="right">
        <template #default="{ row }">
          <div class="flex justify-end gap-1">
            <el-button
              v-if="canEdit"
              :icon="Edit"
              size="small"
              text
              :aria-label="t('common.actions.edit')"
              @click="emit('edit', row)"
            />
            <el-button
              v-if="canDelete"
              :icon="Delete"
              size="small"
              text
              type="danger"
              :aria-label="t('common.actions.delete')"
              @click="emit('delete', row)"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>
    <ElImageViewer v-if="previewImages.length" :url-list="previewImages" teleported hide-on-click-modal show-progress @close="closeImages" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ElImageViewer } from 'element-plus'
import { useMediaQuery } from '@vueuse/core'
import { Delete, Edit, Picture, Plus } from '@element-plus/icons-vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import type { ProductContentModel } from '@/models/productModel.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  content: ProductContentModel[]
  loading: boolean
  summary: string
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  create: []
  edit: [item: ProductContentModel]
  delete: [item: ProductContentModel]
}>()

const { locale, t } = useI18n()
const mobile = useMediaQuery('(max-width: 600px)')
const previewImages = ref<string[]>([])
let previewTrigger: HTMLElement | null = null

function images(item: ProductContentModel) {
  return [...new Set((item.product.images ?? []).filter(image => image?.trim()))]
}

function openImages(item: ProductContentModel, event: MouseEvent) {
  previewImages.value = images(item)
  previewTrigger = event.currentTarget as HTMLElement
}

function closeImages() {
  previewImages.value = []
  void nextTick(() => {
    if (previewTrigger?.isConnected) previewTrigger.focus({ preventScroll: true })
    previewTrigger = null
  })
}

watch(() => props.content, () => { previewImages.value = []; previewTrigger = null })
</script>

<style scoped>
.content-product {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.content-product__thumbnail {
  position: relative;
  display: inline-flex;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 4px;
  padding: 0;
  background: var(--app-surface);
  color: var(--app-text-muted);
  cursor: pointer;
}

.content-product__thumbnail .el-image {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.content-product__thumbnail--empty {
  background: var(--app-bg-soft);
  cursor: default;
}

.content-product__image-count {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 0 3px;
  background: var(--app-text);
  color: var(--app-surface);
  font-size: 10px;
  line-height: 1.4;
}

.content-product__identity {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.content-product__link {
  display: inline-flex;
  min-width: 0;
  width: fit-content;
  max-width: 100%;
  text-decoration: none;
}

.content-product__link:hover :deep(.product-sku__text) {
  color: var(--app-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.content-product__link:focus-visible,
button.content-product__thumbnail:focus-visible {
  outline: 2px solid var(--app-primary);
  outline-offset: 2px;
}

.content-product__name {
  overflow: hidden;
  color: var(--app-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-product__producer {
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-product__metadata {
  display: grid;
  gap: 3px;
  margin-top: 4px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.content-product__stock {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.content-product__stock :deep(.stock-cell) {
  grid-template-columns: auto;
  min-width: 0;
}

.content-product__stock :deep(.stock-cell__rail) {
  display: none;
}

.product-data-panel__toolbar {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0 12px;
}

:deep(.el-table__header th) {
  background: rgb(248 250 252);
  color: rgb(71 85 105);
  font-weight: 700;
}

:deep(.stock-cell) {
  justify-content: end;
}
</style>
