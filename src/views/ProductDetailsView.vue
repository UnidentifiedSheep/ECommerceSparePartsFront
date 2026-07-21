<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div class="min-w-0">
          <button
            class="mb-1 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            type="button"
            @click="router.push({ name: 'products' })"
          >
            <ArrowLeft class="h-4 w-4" />
            <span>{{ t('products.title') }}</span>
          </button>
          <h1 class="truncate text-2xl font-semibold text-slate-900">{{ productHeader }}</h1>
        </div>

        <div class="flex items-center gap-2">
          <el-button
            v-if="product && canViewPriceOffers"
            :icon="Money"
            plain
            @click="priceOffersDialogOpen = true"
          >
            {{ t('priceOffers.open') }}
          </el-button>
          <el-dropdown trigger="click" @command="handleProductAction">
            <el-button :icon="MoreFilled" circle plain :aria-label="t('common.labels.actions')" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="refresh" :icon="Refresh">{{ t('common.actions.refresh') }}</el-dropdown-item>
                <el-dropdown-item v-if="product && canEditProduct" command="edit" :icon="Edit">
                  {{ t('common.actions.edit') }}
                </el-dropdown-item>
                <el-dropdown-item v-if="canCreateCrosses" command="crosses" :icon="Plus">
                  {{ t('products.addCrosses') }}
                </el-dropdown-item>
                <el-dropdown-item v-if="product && canViewProductReservations" command="reservations" :icon="View">
                  {{ t('users.viewReservations') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <main class="flex flex-col gap-4 p-4">
      <div v-loading="isLoading">
        <div v-if="product" class="grid items-start gap-4 lg:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
          <ProductImageGallery
            :images="productImages"
            :can-add="canAddImages"
            :can-delete="canDeleteImages"
            :uploading="isUploadingImages"
            :deleting-image="deletingImage"
            @upload="uploadImages"
            @delete="removeImage"
          />
          <ProductSummaryPanel
            :product="product"
            :pair="productPair"
            :product-size="productSize"
            :product-weight="productWeight"
            :can-edit-product="canEditProduct"
            :can-set-size="canSetSize"
            :can-delete-size="canDeleteSize"
            :can-set-weight="canSetWeight"
            :can-delete-weight="canDeleteWeight"
            @manage-size="sizeDialogOpen = true"
            @manage-weight="weightDialogOpen = true"
            @select-pair="openPairSelector"
            @clear-pair="clearPair"
            @open-pair="openProduct"
          />
        </div>
        <el-empty v-else-if="!isLoading" :description="t('products.details.productNotFound')" />
      </div>

      <section v-if="product" class="product-workspace">
        <el-tabs v-model="activeTab" class="product-tabs">
          <el-tab-pane :label="t('products.details.productCrosses')" name="crosses" lazy>
            <ProductCrossesPanel
              v-model:search="crossSearch"
              v-model:page="page"
              v-model:size="size"
              :crosses="filteredCrosses"
              :loading="isCrossesLoading"
              :summary="crossesSummary"
              :has-next="hasNext"
              :can-create="canCreateCrosses"
              @create="crossDialogOpen = true"
              @open="openProduct"
              @sort-change="handleSortChange"
            />
          </el-tab-pane>

          <el-tab-pane
            v-if="canViewStorageContent"
            :label="t('products.details.storageStock')"
            name="storage"
            lazy
          >
            <ProductStoragePanel
              v-model:page="storageContentPage"
              v-model:size="storageContentSize"
              v-model:show-zero="showZeroStorageContent"
              :contents="storageContent"
              :loading="isStorageContentLoading"
              :summary="storageContentSummary"
              :has-next="storageContentHasNext"
              :can-create="canCreateStorageContent"
              :can-edit="canEditStorageContent"
              :can-delete="canDeleteStorageContent"
              @create="addStorageContentDialogOpen = true"
              @edit="openEditStorageContentDialog"
              @delete="removeStorageContentItem"
            />
          </el-tab-pane>

          <el-tab-pane :label="t('products.details.productContent')" name="content" lazy>
            <ProductContentPanel
              :content="productContent"
              :loading="isProductContentLoading"
              :summary="contentSummary"
              :can-create="canCreateProductContent"
              :can-edit="canEditProductContent"
              :can-delete="canDeleteProductContent"
              @create="openContentDialog()"
              @edit="openContentDialog"
              @delete="removeContentItem"
            />
          </el-tab-pane>

          <el-tab-pane :label="t('products.details.characteristics')" name="characteristics" lazy>
            <ProductCharacteristicsPanel
              v-model:page="characteristicsPage"
              v-model:size="characteristicsSize"
              :characteristics="characteristics"
              :loading="isCharacteristicsLoading"
              :summary="characteristicsSummary"
              :has-next="characteristicsHasNext"
              :can-create="canCreateCharacteristics"
              :can-edit="canEditCharacteristics"
              :can-delete="canDeleteCharacteristics"
              @create="openCharacteristicDialog()"
              @edit="openCharacteristicDialog"
              @delete="removeCharacteristic"
            />
          </el-tab-pane>
        </el-tabs>
      </section>
    </main>

    <CreateProductsCrossesDialog
      v-if="canCreateCrosses"
      v-model="crossDialogOpen"
      :initial-product-id="product?.id"
      :initial-product-label="productLabel"
      @saved="refreshCrosses"
    />
    <ProductSizeDialog
      v-if="product && canManageSize"
      v-model="sizeDialogOpen"
      :product-id="product.id"
      :product-size="productSize"
      :can-save="canSetSize"
      :can-delete="canDeleteSize"
      @saved="loadProductMetrics"
    />
    <ProductWeightDialog
      v-if="product && canManageWeight"
      v-model="weightDialogOpen"
      :product-id="product.id"
      :product-weight="productWeight"
      :can-save="canSetWeight"
      :can-delete="canDeleteWeight"
      @saved="loadProductMetrics"
    />
    <ProductEditDialog
      v-if="product && canEditProduct"
      v-model="editDialogOpen"
      :product="product"
      @saved="refreshSummary"
    />
    <ProductReservationsDialog
      v-if="product && canViewProductReservations"
      v-model="reservationsDialogOpen"
      :product-id="product.id"
      :title="t('products.details.reservationsTitle', { sku: product.sku })"
    />
    <ProductPriceOffersDialog
      v-if="product && canViewPriceOffers"
      v-model="priceOffersDialogOpen"
      :product-id="product.id"
      :product-label="productLabel"
    />
    <ProductSelectorDialog v-model="pairSelectorOpen" @select="handlePairSelected" />
    <AddProductStorageContentDialog
      v-if="product"
      v-model="addStorageContentDialogOpen"
      :product-id="product.id"
      :product-label="productLabel"
      @saved="refreshStorageContent"
    />
    <EditProductStorageContentDialog
      v-if="editingStorageContent"
      v-model="editStorageContentDialogOpen"
      :item="editingStorageContent"
      @saved="refreshStorageContent"
    />
    <ProductContentDialog
      v-if="product"
      v-model="contentDialogOpen"
      :product-id="product.id"
      :item="editingContentItem"
      @saved="refreshProductContent"
    />
    <ProductCharacteristicDialog
      v-if="product"
      v-model="characteristicDialogOpen"
      :product-id="product.id"
      :item="editingCharacteristic"
      @saved="refreshCharacteristics"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Edit, Money, MoreFilled, Plus, Refresh, View } from '@element-plus/icons-vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import AddProductStorageContentDialog from '@/components/products/AddProductStorageContentDialog.vue'
import CreateProductsCrossesDialog from '@/components/products/CreateProductsCrossesDialog.vue'
import EditProductStorageContentDialog from '@/components/products/EditProductStorageContentDialog.vue'
import ProductCharacteristicDialog from '@/components/products/ProductCharacteristicDialog.vue'
import ProductCharacteristicsPanel from '@/components/products/ProductCharacteristicsPanel.vue'
import ProductContentDialog from '@/components/products/ProductContentDialog.vue'
import ProductContentPanel from '@/components/products/ProductContentPanel.vue'
import ProductCrossesPanel from '@/components/products/ProductCrossesPanel.vue'
import ProductEditDialog from '@/components/products/ProductEditDialog.vue'
import ProductImageGallery from '@/components/products/ProductImageGallery.vue'
import ProductPriceOffersDialog from '@/components/pricing/ProductPriceOffersDialog.vue'
import ProductReservationsDialog from '@/components/products/ProductReservationsDialog.vue'
import ProductSizeDialog from '@/components/products/ProductSizeDialog.vue'
import ProductStoragePanel from '@/components/products/ProductStoragePanel.vue'
import ProductSummaryPanel from '@/components/products/ProductSummaryPanel.vue'
import ProductWeightDialog from '@/components/products/ProductWeightDialog.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import type {
  ProductCharacteristicModel,
  ProductContentModel,
  ProductModel,
  ProductSizeModel,
  ProductWeightModel,
} from '@/models/productModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { StorageContentModel } from '@/models/storageContentModel.ts'
import {
  deleteProductCharacteristic,
  deleteProductContent,
  deleteProductImage,
  editProduct,
  getProductById,
  getProductCharacteristics,
  getProductContent,
  getProductCrosses,
  getProductPair,
  getProductSize,
  getProductWeight,
  uploadProductImages,
} from '@/services/api/products.ts'
import { deleteStorageContent, getStorageContent } from '@/services/api/storages.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'

type ProductTab = 'crosses' | 'storage' | 'content' | 'characteristics'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const { hasPermission } = usePermissions()

const product = ref<ProductModel>()
const productPair = ref<ProductModel | null>(null)
const productSize = ref<ProductSizeModel | null>(null)
const productWeight = ref<ProductWeightModel | null>(null)
const crosses = ref<ProductModel[]>([])
const storageContent = ref<StorageContentModel[]>([])
const productContent = ref<ProductContentModel[]>([])
const characteristics = ref<ProductCharacteristicModel[]>([])
const activeTab = ref<ProductTab>('crosses')
const loadedTabs = ref<Record<ProductTab, boolean>>({
  crosses: false,
  storage: false,
  content: false,
  characteristics: false,
})

const page = ref(0)
const size = ref(20)
const hasNext = ref(false)
const storageContentPage = ref(0)
const storageContentSize = ref(20)
const storageContentHasNext = ref(false)
const characteristicsPage = ref(0)
const characteristicsSize = ref(10)
const characteristicsHasNext = ref(false)
const showZeroStorageContent = ref(false)
const crossSearch = ref('')
const sortBy = ref<string>()

const isLoading = ref(false)
const isCrossesLoading = ref(false)
const isStorageContentLoading = ref(false)
const isProductContentLoading = ref(false)
const isCharacteristicsLoading = ref(false)
const isUploadingImages = ref(false)
const deletingImage = ref<string | null>(null)
const deletingStorageContentId = ref<number>()

const crossDialogOpen = ref(false)
const sizeDialogOpen = ref(false)
const weightDialogOpen = ref(false)
const editDialogOpen = ref(false)
const reservationsDialogOpen = ref(false)
const priceOffersDialogOpen = ref(false)
const pairSelectorOpen = ref(false)
const addStorageContentDialogOpen = ref(false)
const editStorageContentDialogOpen = ref(false)
const contentDialogOpen = ref(false)
const characteristicDialogOpen = ref(false)
const editingStorageContent = ref<StorageContentModel>()
const editingContentItem = ref<ProductContentModel>()
const editingCharacteristic = ref<ProductCharacteristicModel>()

const canEditProduct = computed(() => hasPermission('ARTICLES_EDIT'))
const canCreateCrosses = computed(() => hasPermission('ARTICLE_CROSSES_CREATE'))
const canAddImages = computed(() => hasPermission('ARTICLE_IMAGES_CREATE'))
const canDeleteImages = computed(() => hasPermission('ARTICLE_IMAGES_DELETE'))
const canViewStorageContent = computed(() => hasPermission('STORAGES_CONTENT_GET_ALL'))
const canViewProductReservations = computed(() => hasPermission('ARTICLE_RESERVATIONS_GET_ALL'))
const canViewPriceOffers = computed(() => hasPermission('PRICES_GET_DETAILED'))
const canCreateStorageContent = computed(() => hasPermission('STORAGES_CONTENT_CREATE'))
const canEditStorageContent = computed(() => hasPermission('STORAGES_CONTENT_EDIT'))
const canDeleteStorageContent = computed(() => hasPermission('STORAGES_CONTENT_DELETE'))
const canSetSize = computed(() => hasPermission('ARTICLE_SIZES_CREATE'))
const canSetWeight = computed(() => hasPermission('ARTICLE_WEIGHT_CREATE'))
const canDeleteSize = computed(() => hasPermission('ARTICLE_SIZES_DELETE'))
const canDeleteWeight = computed(() => hasPermission('ARTICLE_WEIGHT_DELETE'))
const canCreateProductContent = computed(() => hasPermission('ARTICLE_CONTENT_CREATE'))
const canEditProductContent = computed(() => hasPermission('ARTICLE_CONTENT_EDIT'))
const canDeleteProductContent = computed(() => hasPermission('ARTICLE_CONTENT_DELETE'))
const canCreateCharacteristics = computed(() => hasPermission('ARTICLE_CHARACTERISTICS_CREATE'))
const canEditCharacteristics = computed(() => hasPermission('ARTICLE_CHARACTERISTICS_UPDATE'))
const canDeleteCharacteristics = computed(() => hasPermission('ARTICLE_CHARACTERISTICS_DELETE'))
const canManageSize = computed(() => canSetSize.value || Boolean(productSize.value && canDeleteSize.value))
const canManageWeight = computed(() => canSetWeight.value || Boolean(productWeight.value && canDeleteWeight.value))

const productId = computed(() => Number(route.params.id))
const productLabel = computed(() => product.value ? `${product.value.sku} - ${product.value.name}` : '')
const productImages = computed(() => product.value?.images.filter(Boolean) ?? [])
const productHeader = computed(() => product.value?.name ?? t('products.details.productHeader', { id: String(route.params.id) }))
const filteredCrosses = computed(() => {
  const query = crossSearch.value.trim().toLocaleLowerCase(locale.value)
  if (!query) return crosses.value
  return crosses.value.filter((item) => [item.sku, item.name, item.producerName, item.description]
    .filter(Boolean)
    .some((value) => value?.toLocaleLowerCase(locale.value).includes(query)))
})
const crossesSummary = computed(() => {
  if (isCrossesLoading.value) return t('products.details.loading')
  if (crossSearch.value.trim()) {
    return t('products.details.foundOf', { shown: filteredCrosses.value.length, total: crosses.value.length })
  }
  return crosses.value.length
    ? t('products.details.positionsOnPage', { count: crosses.value.length })
    : t('products.details.noLinkedPositions')
})
const storageContentSummary = computed(() => {
  if (isStorageContentLoading.value) return t('products.details.loading')
  return storageContent.value.length
    ? t('products.details.positionsOnPage', { count: storageContent.value.length })
    : t('products.details.noStoragePositions')
})
const contentSummary = computed(() => {
  if (isProductContentLoading.value) return t('products.details.loading')
  return productContent.value.length
    ? t('products.details.contentPositions', { count: productContent.value.length })
    : t('products.details.noContent')
})
const characteristicsSummary = computed(() => {
  if (isCharacteristicsLoading.value) return t('products.details.loading')
  return characteristics.value.length
    ? t('products.details.characteristicsCount', { count: characteristics.value.length })
    : t('products.details.noCharacteristics')
})

function openProduct(id: number) {
  router.push({ name: 'product-details', params: { id } })
}

function openPairSelector() {
  pairSelectorOpen.value = true
}

async function handlePairSelected(selected: ProductSearchModel) {
  if (!product.value) return
  if (selected.id === product.value.id) {
    ElNotification({
      title: t('products.details.fillDataTitle'),
      message: t('products.details.sameProductForbidden'),
      type: 'warning',
    })
    return
  }
  await setPair(selected.id)
}

async function setPair(pairId: number | null) {
  if (!product.value || !canEditProduct.value) return
  await editProduct({ id: product.value.id, pairId })
  ElNotification({
    title: t('products.details.pairSavedTitle'),
    message: t('products.details.pairSavedMessage'),
    type: 'success',
  })
  await loadPair()
}

async function clearPair() {
  if (!productPair.value) return
  try {
    await ElMessageBox.confirm(t('products.details.clearPairConfirm'), t('products.details.clearPairTitle'), {
      confirmButtonText: t('common.actions.delete'),
      cancelButtonText: t('common.actions.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  await setPair(null)
}

async function handleProductAction(command: string) {
  if (command === 'refresh') await refreshDetails()
  if (command === 'edit') editDialogOpen.value = true
  if (command === 'crosses') crossDialogOpen.value = true
  if (command === 'reservations') reservationsDialogOpen.value = true
}

async function uploadImages(files: File[]) {
  if (!product.value || !files.length) return
  isUploadingImages.value = true
  try {
    await uploadProductImages(product.value.id, files)
    ElNotification({
      title: t('products.details.imagesAddedTitle'),
      message: t('products.details.uploadedCount', { count: files.length }),
      type: 'success',
    })
    await loadProduct()
  } finally {
    isUploadingImages.value = false
  }
}

async function removeImage(image: string) {
  if (!product.value || deletingImage.value) return
  try {
    await ElMessageBox.confirm(t('products.details.deleteImageConfirm'), t('products.details.deleteImageTitle'), {
      confirmButtonText: t('common.actions.delete'),
      cancelButtonText: t('common.actions.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  deletingImage.value = image
  try {
    await deleteProductImage(product.value.id, image)
    ElNotification({
      title: t('products.details.imageDeletedTitle'),
      message: t('products.details.galleryUpdated'),
      type: 'success',
    })
    await loadProduct()
  } finally {
    deletingImage.value = null
  }
}

function openEditStorageContentDialog(item: StorageContentModel) {
  editingStorageContent.value = item
  editStorageContentDialogOpen.value = true
}

function openContentDialog(item?: ProductContentModel) {
  editingContentItem.value = item
  contentDialogOpen.value = true
}

function openCharacteristicDialog(item?: ProductCharacteristicModel) {
  editingCharacteristic.value = item
  characteristicDialogOpen.value = true
}

async function removeStorageContentItem(item: StorageContentModel) {
  if (deletingStorageContentId.value) return
  try {
    await ElMessageBox.confirm(t('products.details.deleteStockConfirm'), t('products.details.deleteStockTitle'), {
      confirmButtonText: t('common.actions.delete'),
      cancelButtonText: t('common.actions.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  deletingStorageContentId.value = item.id
  try {
    await deleteStorageContent(item.id, item.rowVersion)
    ElNotification({
      title: t('products.details.stockDeletedTitle'),
      message: t('products.details.stockDeletedMessage'),
      type: 'success',
    })
    await refreshStorageContent()
  } finally {
    deletingStorageContentId.value = undefined
  }
}

async function removeContentItem(item: ProductContentModel) {
  if (!product.value) return
  try {
    await ElMessageBox.confirm(t('products.details.deleteContentConfirm'), t('products.details.deleteContentTitle'), {
      confirmButtonText: t('common.actions.delete'),
      cancelButtonText: t('common.actions.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  await deleteProductContent(product.value.id, item.product.id)
  ElNotification({
    title: t('products.details.contentDeletedTitle'),
    message: t('products.details.contentDeletedMessage'),
    type: 'success',
  })
  await refreshProductContent()
}

async function removeCharacteristic(item: ProductCharacteristicModel) {
  if (!product.value) return
  try {
    await ElMessageBox.confirm(t('products.details.deleteCharacteristicConfirm'), t('products.details.deleteCharacteristicTitle'), {
      confirmButtonText: t('common.actions.delete'),
      cancelButtonText: t('common.actions.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  await deleteProductCharacteristic(product.value.id, item.name)
  ElNotification({
    title: t('products.details.characteristicDeletedTitle'),
    message: t('products.details.characteristicDeletedMessage'),
    type: 'success',
  })
  await refreshCharacteristics()
}

async function handleSortChange(event: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  sortBy.value = event.prop && event.order
    ? (event.order === 'descending' ? `${event.prop}_desc` : event.prop)
    : undefined
  if (page.value !== 0) {
    page.value = 0
    return
  }
  await refreshCrosses()
}

async function loadProduct() {
  product.value = (await getProductById(productId.value)).product
}

async function loadPair() {
  productPair.value = (await getProductPair(productId.value)).pair
}

async function loadProductMetrics() {
  productSize.value = null
  productWeight.value = null
  const [sizeResp, weightResp] = await Promise.allSettled([
    getProductSize(productId.value),
    getProductWeight(productId.value),
  ])
  if (sizeResp.status === 'fulfilled') productSize.value = sizeResp.value.productSize
  if (weightResp.status === 'fulfilled') productWeight.value = weightResp.value.productWeight
}

async function loadCrosses() {
  isCrossesLoading.value = true
  try {
    const resp = await getProductCrosses({ productId: productId.value, page: page.value, size: size.value, sortBy: sortBy.value })
    crosses.value = resp.crosses
    hasNext.value = resp.crosses.length === size.value
  } finally {
    isCrossesLoading.value = false
  }
}

async function loadStorageContent() {
  if (!canViewStorageContent.value) return
  isStorageContentLoading.value = true
  try {
    const resp = await getStorageContent({
      productId: productId.value,
      page: storageContentPage.value,
      size: storageContentSize.value,
      showZeroContent: showZeroStorageContent.value,
    })
    storageContent.value = resp.contents
    storageContentHasNext.value = resp.contents.length === storageContentSize.value
  } finally {
    isStorageContentLoading.value = false
  }
}

async function loadProductContent() {
  isProductContentLoading.value = true
  try {
    productContent.value = (await getProductContent(productId.value)).content
  } finally {
    isProductContentLoading.value = false
  }
}

async function loadCharacteristics() {
  isCharacteristicsLoading.value = true
  try {
    const resp = await getProductCharacteristics({
      productId: productId.value,
      page: characteristicsPage.value,
      size: characteristicsSize.value,
    })
    characteristics.value = resp.characteristics
    characteristicsHasNext.value = resp.characteristics.length === characteristicsSize.value
  } finally {
    isCharacteristicsLoading.value = false
  }
}

async function ensureTabLoaded(tab: ProductTab, force = false) {
  if (loadedTabs.value[tab] && !force) return
  if (tab === 'crosses') await loadCrosses()
  if (tab === 'storage') await loadStorageContent()
  if (tab === 'content') await loadProductContent()
  if (tab === 'characteristics') await loadCharacteristics()
  loadedTabs.value[tab] = true
}

async function refreshSummary() {
  await Promise.all([loadProduct(), loadPair(), loadProductMetrics()])
}

async function refreshCrosses() {
  await ensureTabLoaded('crosses', true)
}

async function refreshStorageContent() {
  loadedTabs.value.storage = false
  storageContentPage.value = 0
  await ensureTabLoaded('storage', true)
}

async function refreshProductContent() {
  await ensureTabLoaded('content', true)
}

async function refreshCharacteristics() {
  await ensureTabLoaded('characteristics', true)
}

async function refreshDetails() {
  isLoading.value = true
  try {
    await refreshSummary()
    await ensureTabLoaded(activeTab.value, true)
  } finally {
    isLoading.value = false
  }
}

function resetPageState() {
  product.value = undefined
  productPair.value = null
  productSize.value = null
  productWeight.value = null
  crosses.value = []
  storageContent.value = []
  productContent.value = []
  characteristics.value = []
  page.value = 0
  storageContentPage.value = 0
  characteristicsPage.value = 0
  crossSearch.value = ''
  hasNext.value = false
  storageContentHasNext.value = false
  characteristicsHasNext.value = false
  loadedTabs.value = { crosses: false, storage: false, content: false, characteristics: false }
}

async function loadInitialDetails() {
  if (!Number.isFinite(productId.value) || productId.value <= 0) {
    resetPageState()
    return
  }
  isLoading.value = true
  try {
    await refreshSummary()
  } finally {
    isLoading.value = false
  }
  await ensureTabLoaded(activeTab.value)
}

watch(productId, async () => {
  resetPageState()
  await loadInitialDetails()
})
watch(activeTab, async (tab) => ensureTabLoaded(tab))
watch(page, async () => {
  if (loadedTabs.value.crosses) await refreshCrosses()
})
watch(size, async () => {
  if (page.value !== 0) {
    page.value = 0
    return
  }
  if (loadedTabs.value.crosses) await refreshCrosses()
})
watch(storageContentPage, async () => {
  if (loadedTabs.value.storage) await ensureTabLoaded('storage', true)
})
watch(storageContentSize, async () => {
  if (storageContentPage.value !== 0) {
    storageContentPage.value = 0
    return
  }
  if (loadedTabs.value.storage) await ensureTabLoaded('storage', true)
})
watch(characteristicsPage, async () => {
  if (loadedTabs.value.characteristics) await ensureTabLoaded('characteristics', true)
})
watch(characteristicsSize, async () => {
  if (characteristicsPage.value !== 0) {
    characteristicsPage.value = 0
    return
  }
  if (loadedTabs.value.characteristics) await ensureTabLoaded('characteristics', true)
})
watch(showZeroStorageContent, async () => {
  if (storageContentPage.value !== 0) {
    storageContentPage.value = 0
    return
  }
  if (loadedTabs.value.storage) await ensureTabLoaded('storage', true)
})

onMounted(loadInitialDetails)
</script>

<style scoped>
.product-workspace {
  min-width: 0;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: white;
  padding: 0 16px 16px;
}

:deep(.product-tabs > .el-tabs__header) {
  margin-bottom: 0;
}

:deep(.product-tabs > .el-tabs__header .el-tabs__item) {
  height: 48px;
  padding: 0 18px;
  font-weight: 600;
}

:deep(.product-tabs > .el-tabs__content) {
  overflow: visible;
}
</style>
