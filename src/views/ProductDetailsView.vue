<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div class="min-w-0">
          <div class="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <button class="text-slate-600 hover:text-slate-900" type="button" @click="router.push({ name: 'products' })">
              Товары
            </button>
            <span>/</span>
            <span>Кроссы</span>
          </div>
          <h1 class="truncate text-2xl font-semibold text-slate-900">
            {{ productHeader }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <el-button v-if="product && canEditProduct" plain @click="editDialogOpen = true">Редактировать</el-button>
          <el-button v-if="canCreateCrosses" type="primary" @click="crossDialogOpen = true">Добавить кроссы</el-button>
          <el-button :icon="ArrowLeft" @click="router.push({ name: 'products' })">Назад</el-button>
          <el-button :icon="Refresh" :loading="isLoading" plain @click="loadDetails">Обновить</el-button>
        </div>
      </div>
    </header>

    <main class="space-y-4 p-4">
      <div class="grid items-start gap-4 xl:grid-cols-[minmax(340px,35%)_minmax(0,65%)]">
        <section v-loading="isLoading" class="min-w-0 rounded-md border border-slate-200 bg-white shadow-sm">
          <template v-if="product">
            <div class="space-y-4 p-4">
              <div class="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                  <div class="text-sm font-semibold text-slate-900">Изображения</div>
                  <div class="flex items-center gap-2">
                    <div v-if="productImages.length > 0" class="text-xs text-slate-500">
                      {{ productImages.length }} фото
                    </div>
                    <el-button
                      v-if="canAddImages"
                      :icon="Upload"
                      :loading="isUploadingImages"
                      size="small"
                      plain
                      @click="imageInput?.click()"
                    >
                      Добавить
                    </el-button>
                    <input
                      ref="imageInput"
                      type="file"
                      multiple
                      accept=".png,.jpeg,.jpg,.gif,.bmp,.webp,.tiff,image/png,image/jpeg,image/gif,image/bmp,image/webp,image/tiff"
                      class="hidden"
                      @change="uploadImages"
                    />
                  </div>
                </div>

                <el-carousel
                  v-if="productImages.length > 0"
                  ref="productGallery"
                  arrow="always"
                  trigger="click"
                  height="280px"
                  :autoplay="false"
                  indicator-position="outside"
                  class="product-gallery"
                  @change="setGalleryIndex"
                >
                  <el-carousel-item v-for="(image, index) in productImages" :key="`${image}-${index}`">
                    <div class="relative h-full w-full">
                      <el-image
                        :src="image"
                        :preview-src-list="productImages"
                        :initial-index="index"
                        fit="contain"
                        show-progress
                        hide-on-click-modal
                        preview-teleported
                        class="h-full w-full bg-white"
                      >
                        <template #error>
                          <div class="flex h-full w-full items-center justify-center text-sm text-slate-400">
                            Изображение недоступно
                          </div>
                        </template>
                      </el-image>
                      <el-button
                        v-if="canDeleteImages"
                        :icon="Delete"
                        :loading="isDeletingImage && galleryImageIndex === index"
                        circle
                        type="danger"
                        class="absolute right-3 top-3 shadow"
                        @click.stop="removeImage(image, index)"
                      />
                    </div>
                  </el-carousel-item>
                </el-carousel>

                <div v-if="productImages.length > 1" class="grid grid-cols-5 gap-2 border-t border-slate-200 bg-white p-3">
                  <button
                    v-for="(image, index) in productImages"
                    :key="`thumb-${image}-${index}`"
                    :class="[
                      'h-14 overflow-hidden rounded border bg-white p-0.5 transition',
                      galleryImageIndex === index ? 'border-blue-500 ring-1 ring-blue-200' : 'border-slate-200',
                    ]"
                    type="button"
                    @click="showGalleryImage(index)"
                  >
                    <el-image :src="image" fit="contain" class="h-full w-full" />
                  </button>
                </div>

                <el-empty v-else-if="productImages.length === 0" description="Изображений нет" class="h-[220px]" />
              </div>

              <dl class="grid content-start grid-cols-[112px_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
                <dt class="text-slate-500">Артикул</dt>
                <dd class="min-w-0 break-all font-medium text-slate-900">{{ product.sku }}</dd>

                <dt class="text-slate-500">Производитель</dt>
                <dd class="font-medium text-slate-900">{{ product.producerName || '-' }}</dd>

                <dt class="text-slate-500">Название</dt>
                <dd class="font-medium leading-5 text-slate-900">{{ product.name || '-' }}</dd>

                <dt class="text-slate-500">Описание</dt>
                <dd class="font-medium leading-5 text-slate-900">{{ product.description || '-' }}</dd>

                <dt class="text-slate-500">Размер</dt>
                <dd class="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                  <span>{{ sizeText }}</span>
                  <el-button v-if="canManageSize" size="small" text type="primary" @click="sizeDialogOpen = true">
                    {{ sizeActionText }}
                  </el-button>
                </dd>

                <dt class="text-slate-500">Объем</dt>
                <dd class="font-medium text-slate-900">{{ volumeText }}</dd>

                <dt class="text-slate-500">Вес</dt>
                <dd class="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                  <span>{{ weightText }}</span>
                  <el-button v-if="canManageWeight" size="small" text type="primary" @click="weightDialogOpen = true">
                    {{ weightActionText }}
                  </el-button>
                </dd>

                <dt class="text-slate-500">Индикатор</dt>
                <dd>
                  <span v-if="product.indicator" class="inline-flex items-center gap-2">
                    <span
                      class="inline-block h-5 w-5 rounded border border-slate-300"
                      :style="{ backgroundColor: product.indicator }"
                    />
                  </span>
                  <span v-else class="font-medium text-slate-900">-</span>
                </dd>

                <dt class="text-slate-500">Остаток</dt>
                <dd :class="['font-semibold', stockColorClass(product.stock)]">{{ formatNumber(product.stock) }}</dd>
              </dl>

              <el-divider v-if="canViewStorageContent" class="!my-3" />

              <el-collapse v-if="canViewStorageContent" v-model="storageContentCollapse" class="storage-content-collapse">
                <el-collapse-item name="storage-content">
                  <template #title>
                    <div class="flex min-w-0 flex-1 items-center justify-between gap-3 pr-3">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-slate-900">Складские остатки</div>
                        <div class="truncate text-xs text-slate-500">{{ storageContentSummary }}</div>
                      </div>
                    </div>
                  </template>

                  <div class="space-y-3">
                    <div class="flex items-center justify-end gap-2">
                      <el-switch
                        v-model="showZeroStorageContent"
                        active-text="Нулевые"
                        inactive-text="Остатки"
                        inline-prompt
                        class="storage-zero-switch"
                      />
                      <el-button
                        v-if="canCreateStorageContent"
                        :icon="Plus"
                        size="small"
                        type="primary"
                        plain
                        @click="openAddStorageContentDialog"
                      >
                        Добавить
                      </el-button>
                    </div>

                    <el-table
                      v-loading="isStorageContentLoading"
                      :data="storageContent"
                      stripe
                      size="small"
                      empty-text="Остатков нет"
                      class="storage-content-table"
                    >
                      <el-table-column prop="storageName" label="Склад" min-width="150" show-overflow-tooltip />
                      <el-table-column prop="count" label="Кол-во" width="84" align="right">
                        <template #default="{ row }">
                          <span :class="['font-semibold', stockColorClass(row.count)]">
                            {{ formatNumber(row.count) }}
                          </span>
                        </template>
                      </el-table-column>
                      <el-table-column label="Закупка" width="110" align="right">
                        <template #default="{ row }">
                          {{ formatMoney(row.buyPrice, row.currency?.currencySign) }}
                        </template>
                      </el-table-column>
                      <el-table-column
                        v-if="canEditStorageContent || canDeleteStorageContent"
                        label=""
                        width="86"
                        align="right"
                      >
                        <template #default="{ row }">
                          <div class="flex justify-end gap-1">
                            <el-button
                              v-if="canEditStorageContent"
                              :icon="Edit"
                              size="small"
                              text
                              @click="openEditStorageContentDialog(row)"
                            />
                            <el-button
                              v-if="canDeleteStorageContent"
                              :icon="Delete"
                              size="small"
                              text
                              type="danger"
                              @click="removeStorageContentItem(row)"
                            />
                          </div>
                        </template>
                      </el-table-column>
                    </el-table>

                    <div class="flex justify-end border-t border-slate-200 pt-3">
                      <ZeroPagination
                        v-model:page="storageContentPage"
                        v-model:size="storageContentSize"
                        :has-next="storageContentHasNext"
                        :sizes="[10, 20, 50]"
                      />
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </template>

          <el-empty v-else-if="!isLoading" description="Товар не найден" />
        </section>

        <section class="flex min-h-[760px] min-w-0 flex-col rounded-md border border-slate-200 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Кроссы продукта</h2>
              <div class="text-sm text-slate-500">{{ crossesSummary }}</div>
            </div>

            <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <el-input
                v-model="crossSearch"
                clearable
                placeholder="Артикул, название, производитель"
                class="min-w-64 flex-1 sm:w-80"
              />
            </div>
          </div>

          <el-table
            v-loading="isCrossesLoading"
            :data="filteredCrosses"
            stripe
            height="100%"
            empty-text="Кроссов нет"
            class="crosses-table flex-1"
            @sort-change="handleSortChange"
          >
            <el-table-column prop="sku" label="Артикул" min-width="150" sortable="custom">
              <template #default="{ row }">
                <span class="font-medium text-slate-900">{{ row.sku }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="Название" min-width="260" show-overflow-tooltip sortable="custom" />
            <el-table-column prop="producerName" label="Производитель" min-width="160" sortable="custom">
              <template #default="{ row }">
                {{ row.producerName || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="Описание" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <span :class="row.description ? 'text-slate-700' : 'text-slate-400'">
                  {{ row.description || '-' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="Остаток" width="120" align="right" sortable="custom">
              <template #default="{ row }">
                <span :class="['font-semibold', stockColorClass(row.stock)]">
                  {{ row.stock }}
                </span>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="" width="72" align="right">
              <template #default="{ row }">
                <el-button :icon="View" size="small" text @click="openProduct(row.id)" />
              </template>
            </el-table-column>
          </el-table>

          <div class="mt-auto flex justify-end border-t border-slate-200 px-4 py-3">
            <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" />
          </div>
        </section>
      </div>
    </main>

    <CreateProductsCrossesDialog
      v-if="canCreateCrosses"
      v-model="crossDialogOpen"
      :initial-product-id="product?.id"
      :initial-product-label="productLabel"
      @saved="loadDetails"
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
      @saved="loadDetails"
    />

    <el-dialog v-model="addStorageContentDialogOpen" title="Добавить остаток на склад" width="520">
      <el-form label-position="top">
        <el-form-item label="Продукт">
          <el-input :model-value="productLabel" disabled />
        </el-form-item>

        <el-form-item label="Склад">
          <el-select
            v-model="addStorageContentForm.storageName"
            :loading="isStorageOptionsLoading"
            filterable
            class="w-full"
            placeholder="Выберите склад"
          >
            <el-option
              v-for="storage in storageOptions"
              :key="storage.name"
              :label="storage.name"
              :value="storage.name"
            >
              <div class="flex min-w-0 flex-col py-1">
                <span class="truncate">{{ storage.name }}</span>
                <span class="truncate text-xs text-slate-500">{{ storage.location || storage.description || 'Без описания' }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item label="Количество">
            <el-input-number v-model="addStorageContentForm.count" :min="1" :controls="false" class="w-full" />
          </el-form-item>

          <el-form-item label="Цена закупки">
            <el-input-number v-model="addStorageContentForm.buyPrice" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
        </div>

        <el-form-item label="Валюта">
          <el-select
            v-model="addStorageContentForm.currencyId"
            :loading="isCurrencyOptionsLoading"
            filterable
            class="w-full"
            placeholder="Выберите валюту"
          >
            <el-option
              v-for="currency in currencyOptions"
              :key="currency.id"
              :label="`${currency.name} (${currency.currencySign})`"
              :value="currency.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Дата закупки">
          <el-date-picker
            v-model="addStorageContentForm.purchaseDate"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS"
            class="w-full"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addStorageContentDialogOpen = false">Отмена</el-button>
        <el-button type="primary" :loading="isAddingStorageContent" @click="addStorageContentItem">Добавить</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editStorageContentDialogOpen" title="Редактировать остаток" width="520">
      <el-form label-position="top">
        <el-form-item label="Склад">
          <el-input :model-value="editingStorageContent?.storageName" disabled />
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item label="Количество">
            <el-input-number v-model="editStorageContentForm.count" :min="0" :controls="false" class="w-full" />
          </el-form-item>

          <el-form-item label="Цена закупки">
            <el-input-number v-model="editStorageContentForm.buyPrice" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
        </div>

        <el-form-item label="Валюта">
          <el-select
            v-model="editStorageContentForm.currencyId"
            :loading="isCurrencyOptionsLoading"
            filterable
            class="w-full"
            placeholder="Выберите валюту"
          >
            <el-option
              v-for="currency in currencyOptions"
              :key="currency.id"
              :label="`${currency.name} (${currency.currencySign})`"
              :value="currency.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Дата закупки">
          <el-date-picker
            v-model="editStorageContentForm.purchaseDatetime"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS"
            class="w-full"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editStorageContentDialogOpen = false">Отмена</el-button>
        <el-button type="primary" :loading="isEditingStorageContent" @click="saveStorageContentEdit">Сохранить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Delete, Edit, Plus, Refresh, Upload, View } from '@element-plus/icons-vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { CarouselInstance } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import CreateProductsCrossesDialog from '@/components/products/CreateProductsCrossesDialog.vue'
import ProductEditDialog from '@/components/products/ProductEditDialog.vue'
import ProductSizeDialog from '@/components/products/ProductSizeDialog.vue'
import ProductWeightDialog from '@/components/products/ProductWeightDialog.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductModel, ProductSizeModel, ProductWeightModel } from '@/models/productModel.ts'
import type { StorageContentModel } from '@/models/storageContentModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { deleteProductImage, getProductCrosses, getProductSize, getProductWeight, uploadProductImages } from '@/services/api/products.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { addStorageContent, deleteStorageContent, editStorageContent, getStorageContent, getStorages } from '@/services/api/storages.ts'
import { toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { dimensionMeasureUnitLabel, weightMeasureUnitLabel } from '@/utils/measurementUnits.ts'
import { usePermissions } from '@/composables/usePermissions.ts'

const route = useRoute()
const router = useRouter()

const product = ref<ProductModel>()
const crosses = ref<ProductModel[]>([])
const storageContent = ref<StorageContentModel[]>([])
const storageOptions = ref<StorageModel[]>([])
const currencyOptions = ref<CurrencyModel[]>([])
const productSize = ref<ProductSizeModel | null>(null)
const productWeight = ref<ProductWeightModel | null>(null)
const page = ref(0)
const size = ref(20)
const hasNext = ref(false)
const storageContentPage = ref(0)
const storageContentSize = ref(20)
const storageContentHasNext = ref(false)
const storageContentCollapse = ref<string[]>([])
const showZeroStorageContent = ref(false)
const isLoading = ref(false)
const isCrossesLoading = ref(false)
const isStorageContentLoading = ref(false)
const isStorageOptionsLoading = ref(false)
const isCurrencyOptionsLoading = ref(false)
const isAddingStorageContent = ref(false)
const isEditingStorageContent = ref(false)
const deletingStorageContentId = ref<number>()
const crossSearch = ref('')
const sortBy = ref<string>()
const crossDialogOpen = ref(false)
const galleryImageIndex = ref(0)
const productGallery = ref<CarouselInstance>()
const imageInput = ref<HTMLInputElement>()
const isUploadingImages = ref(false)
const deletingImage = ref<string | null>(null)
const sizeDialogOpen = ref(false)
const weightDialogOpen = ref(false)
const editDialogOpen = ref(false)
const addStorageContentDialogOpen = ref(false)
const editStorageContentDialogOpen = ref(false)
const editingStorageContent = ref<StorageContentModel>()
const { hasPermission } = usePermissions()
const canEditProduct = computed(() => hasPermission('ARTICLES_EDIT'))
const canCreateCrosses = computed(() => hasPermission('ARTICLE_CROSSES_CREATE'))
const canAddImages = computed(() => hasPermission('ARTICLE_IMAGES_CREATE'))
const canDeleteImages = computed(() => hasPermission('ARTICLE_IMAGES_DELETE'))
const canViewStorageContent = computed(() => hasPermission('STORAGES_CONTENT_GET_ALL'))
const canCreateStorageContent = computed(() => hasPermission('STORAGES_CONTENT_CREATE'))
const canEditStorageContent = computed(() => hasPermission('STORAGES_CONTENT_EDIT'))
const canDeleteStorageContent = computed(() => hasPermission('STORAGES_CONTENT_DELETE'))
const canSetSize = computed(() => hasPermission('ARTICLE_SIZES_CREATE'))
const canSetWeight = computed(() => hasPermission('ARTICLE_WEIGHT_CREATE'))
const canDeleteSize = computed(() => hasPermission('ARTICLE_SIZES_DELETE'))
const canDeleteWeight = computed(() => hasPermission('ARTICLE_WEIGHT_DELETE'))
const canManageSize = computed(() => canSetSize.value || Boolean(productSize.value && canDeleteSize.value))
const canManageWeight = computed(() => canSetWeight.value || Boolean(productWeight.value && canDeleteWeight.value))
const sizeActionText = computed(() => canSetSize.value ? (productSize.value ? 'Изменить' : 'Задать') : 'Удалить')
const weightActionText = computed(() => canSetWeight.value ? (productWeight.value ? 'Изменить' : 'Задать') : 'Удалить')

const addStorageContentForm = reactive({
  storageName: '',
  count: 1,
  buyPrice: 0,
  currencyId: undefined as number | undefined,
  purchaseDate: toLocalDateTimeInputValue(),
})

const editStorageContentForm = reactive({
  count: 0,
  buyPrice: 0,
  currencyId: undefined as number | undefined,
  purchaseDatetime: toLocalDateTimeInputValue(),
})

const productId = computed(() => Number(route.params.id))
const productLabel = computed(() => product.value ? `${product.value.sku} - ${product.value.name}` : '')
const productImages = computed(() => product.value?.images.filter(Boolean) ?? [])
const isDeletingImage = computed(() => deletingImage.value !== null)
const productHeader = computed(() => {
  if (!product.value) return `Товар #${route.params.id}`
  return product.value.name
})

const filteredCrosses = computed(() => {
  const query = crossSearch.value.trim().toLowerCase()
  if (!query) return crosses.value

  return crosses.value.filter((item) => {
    return [item.sku, item.name, item.producerName, item.description]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query))
  })
})

const crossesSummary = computed(() => {
  if (isCrossesLoading.value) return 'Загрузка'
  if (crossSearch.value.trim()) return `${filteredCrosses.value.length} из ${crosses.value.length}`
  return crosses.value.length > 0 ? `${crosses.value.length} позиций на странице` : 'Нет связанных позиций'
})

const storageContentSummary = computed(() => {
  if (isStorageContentLoading.value) return 'Загрузка'
  return storageContent.value.length > 0
    ? `${storageContent.value.length} позиций на странице`
    : 'Нет складских позиций по этому продукту'
})

const sizeText = computed(() => {
  if (!productSize.value) return '-'

  return [
    formatNumber(productSize.value.length),
    formatNumber(productSize.value.width),
    formatNumber(productSize.value.height),
  ].join(' x ') + ` ${dimensionMeasureUnitLabel(productSize.value.unit)}`
})

const volumeText = computed(() => {
  if (!productSize.value) return '-'
  return `${formatNumber(productSize.value.volumeM3)} м³`
})

const weightText = computed(() => {
  if (!productWeight.value) return '-'

  return `${formatNumber(productWeight.value.weight)} ${weightMeasureUnitLabel(productWeight.value.unit, productWeight.value.weight)}`
})

function formatNumber(value: number) {
  return value.toLocaleString('ru-RU')
}

function formatMoney(value: number, currencySign?: string) {
  return `${formatNumber(value)} ${currencySign ?? ''}`.trim()
}

function stockColorClass(stock: number) {
  if (stock <= 0) return 'text-red-700'
  if (stock <= 2) return 'text-orange-600'
  if (stock <= 5) return 'text-amber-600'
  if (stock <= 10) return 'text-lime-700'
  return 'text-emerald-700'
}

function openProduct(id: number) {
  router.push({
    name: 'product-details',
    params: { id },
  })
}

function setGalleryIndex(index: number) {
  galleryImageIndex.value = index
}

function showGalleryImage(index: number) {
  galleryImageIndex.value = index
  productGallery.value?.setActiveItem(index)
}

async function uploadImages(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (files.length === 0 || !product.value) return

  isUploadingImages.value = true
  try {
    await uploadProductImages(product.value.id, files)

    ElNotification({
      title: 'Изображения добавлены',
      message: `Загружено: ${files.length}`,
      type: 'success',
    })

    galleryImageIndex.value = 0
    await loadDetails()
  } finally {
    isUploadingImages.value = false
    input.value = ''
  }
}

async function removeImage(image: string, index: number) {
  if (!product.value || deletingImage.value) return

  try {
    await ElMessageBox.confirm('Удалить изображение продукта?', 'Удаление изображения', {
      confirmButtonText: 'Удалить',
      cancelButtonText: 'Отмена',
      type: 'warning',
    })
  } catch {
    return
  }

  deletingImage.value = image
  try {
    await deleteProductImage(product.value.id, image)

    ElNotification({
      title: 'Изображение удалено',
      message: 'Галерея продукта обновлена.',
      type: 'success',
    })

    galleryImageIndex.value = Math.max(0, Math.min(index, productImages.value.length - 2))
    await loadDetails()
  } finally {
    deletingImage.value = null
  }
}

async function openAddStorageContentDialog() {
  if (!product.value) return

  resetAddStorageContentForm()
  addStorageContentDialogOpen.value = true
  await Promise.all([
    loadStorageOptions(),
    loadCurrencyOptions(),
  ])
}

function resetAddStorageContentForm() {
  addStorageContentForm.storageName = storageOptions.value[0]?.name ?? ''
  addStorageContentForm.count = 1
  addStorageContentForm.buyPrice = 0
  addStorageContentForm.currencyId = currencyOptions.value[0]?.id
  addStorageContentForm.purchaseDate = toLocalDateTimeInputValue()
}

async function loadStorageOptions() {
  if (storageOptions.value.length > 0 || isStorageOptionsLoading.value) return

  isStorageOptionsLoading.value = true
  try {
    const resp = await getStorages({
      page: 0,
      limit: 200,
    })
    storageOptions.value = resp.storages
    if (!addStorageContentForm.storageName) {
      addStorageContentForm.storageName = resp.storages[0]?.name ?? ''
    }
  } finally {
    isStorageOptionsLoading.value = false
  }
}

async function loadCurrencyOptions() {
  if (currencyOptions.value.length > 0 || isCurrencyOptionsLoading.value) return

  isCurrencyOptionsLoading.value = true
  try {
    const resp = await getCurrencies({
      page: 0,
      size: 100,
    })
    currencyOptions.value = resp.currencies
    if (!addStorageContentForm.currencyId) {
      addStorageContentForm.currencyId = resp.currencies[0]?.id
    }
  } finally {
    isCurrencyOptionsLoading.value = false
  }
}

async function addStorageContentItem() {
  if (!product.value) return

  if (!addStorageContentForm.storageName || !addStorageContentForm.currencyId) {
    ElNotification({
      title: 'Заполните данные',
      message: 'Нужно выбрать склад и валюту.',
      type: 'warning',
    })
    return
  }

  isAddingStorageContent.value = true
  try {
    await addStorageContent({
      storageName: addStorageContentForm.storageName,
      storageContent: [
        {
          productId: product.value.id,
          count: addStorageContentForm.count,
          buyPrice: addStorageContentForm.buyPrice,
          currencyId: addStorageContentForm.currencyId,
          purchaseDate: addStorageContentForm.purchaseDate,
        },
      ],
    })

    ElNotification({
      title: 'Остаток добавлен',
      message: 'Позиция добавлена на склад.',
      type: 'success',
    })

    addStorageContentDialogOpen.value = false
    storageContentPage.value = 0
    storageContentCollapse.value = ['storage-content']
    await loadDetails()
  } finally {
    isAddingStorageContent.value = false
  }
}

async function openEditStorageContentDialog(item: StorageContentModel) {
  editingStorageContent.value = item
  editStorageContentForm.count = item.count
  editStorageContentForm.buyPrice = item.buyPrice
  editStorageContentForm.currencyId = item.currency?.id
  editStorageContentForm.purchaseDatetime = toLocalDateTimeInputValue(new Date(item.purchaseDatetime))
  editStorageContentDialogOpen.value = true
  await loadCurrencyOptions()
}

async function saveStorageContentEdit() {
  if (!editingStorageContent.value || !editStorageContentForm.currencyId) {
    ElNotification({
      title: 'Заполните данные',
      message: 'Нужно выбрать валюту.',
      type: 'warning',
    })
    return
  }

  isEditingStorageContent.value = true
  try {
    await editStorageContent({
      id: editingStorageContent.value.id,
      rowVersion: editingStorageContent.value.rowVersion,
      count: editStorageContentForm.count,
      buyPrice: editStorageContentForm.buyPrice,
      currencyId: editStorageContentForm.currencyId,
      purchaseDatetime: editStorageContentForm.purchaseDatetime,
    })

    ElNotification({
      title: 'Остаток обновлен',
      message: 'Складская позиция сохранена.',
      type: 'success',
    })

    editStorageContentDialogOpen.value = false
    storageContentCollapse.value = ['storage-content']
    await loadDetails()
  } finally {
    isEditingStorageContent.value = false
  }
}

async function removeStorageContentItem(item: StorageContentModel) {
  if (deletingStorageContentId.value) return

  try {
    await ElMessageBox.confirm(
      'Установить количество по этой складской позиции в 0?',
      'Удаление остатка',
      {
        confirmButtonText: 'Удалить',
        cancelButtonText: 'Отмена',
        type: 'warning',
      },
    )
  } catch {
    return
  }

  deletingStorageContentId.value = item.id
  try {
    await deleteStorageContent(item.id, item.rowVersion)

    ElNotification({
      title: 'Остаток удален',
      message: 'Количество складской позиции установлено в 0.',
      type: 'success',
    })

    storageContentCollapse.value = ['storage-content']
    await loadDetails()
  } finally {
    deletingStorageContentId.value = undefined
  }
}

async function handleSortChange(event: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  if (!event.prop || !event.order) {
    sortBy.value = undefined
  } else {
    sortBy.value = event.order === 'descending'
      ? `${event.prop}_desc`
      : event.prop
  }

  if (page.value !== 0) {
    page.value = 0
    return
  }

  await loadCrosses()
}

async function loadCrosses() {
  if (!Number.isFinite(productId.value) || productId.value <= 0) return

  isCrossesLoading.value = true
  try {
    const resp = await getProductCrosses({
      productId: productId.value,
      page: page.value,
      size: size.value,
      sortBy: sortBy.value,
    })

    product.value = resp.requestedArticle
    crosses.value = resp.crosses
    hasNext.value = resp.crosses.length === size.value
  } finally {
    isCrossesLoading.value = false
  }
}

async function loadStorageContent() {
  if (!canViewStorageContent.value || !Number.isFinite(productId.value) || productId.value <= 0) {
    storageContent.value = []
    storageContentHasNext.value = false
    return
  }

  isStorageContentLoading.value = true
  try {
    const resp = await getStorageContent({
      articleId: productId.value,
      page: storageContentPage.value,
      limit: storageContentSize.value,
      showZeroContent: showZeroStorageContent.value,
    })

    storageContent.value = resp.content
    storageContentHasNext.value = resp.content.length === storageContentSize.value
  } finally {
    isStorageContentLoading.value = false
  }
}

async function loadProductMetrics() {
  productSize.value = null
  productWeight.value = null

  const [sizeResp, weightResp] = await Promise.allSettled([
    getProductSize(productId.value),
    getProductWeight(productId.value),
  ])

  if (sizeResp.status === 'fulfilled') {
    productSize.value = sizeResp.value.productSize
  }

  if (weightResp.status === 'fulfilled') {
    productWeight.value = weightResp.value.productWeight
  }
}

async function loadDetails() {
  if (!Number.isFinite(productId.value) || productId.value <= 0) {
    product.value = undefined
    crosses.value = []
    storageContent.value = []
    hasNext.value = false
    storageContentHasNext.value = false
    return
  }

  isLoading.value = true
  try {
    await Promise.all([
      loadCrosses(),
      loadProductMetrics(),
      loadStorageContent(),
    ])
  } finally {
    isLoading.value = false
  }
}

watch(productId, async () => {
  page.value = 0
  storageContentPage.value = 0
  crossSearch.value = ''
  galleryImageIndex.value = 0
  await loadDetails()
})

watch(page, async () => loadCrosses())
watch(size, async () => {
  page.value = 0
  await loadCrosses()
})
watch(storageContentPage, async () => loadStorageContent())
watch(storageContentSize, async () => {
  storageContentPage.value = 0
  await loadStorageContent()
})
watch(showZeroStorageContent, async () => {
  storageContentPage.value = 0
  await loadStorageContent()
})

onMounted(async () => loadDetails())
</script>

<style scoped>
:deep(.crosses-table .el-table__cell) {
  padding-top: 10px;
  padding-bottom: 10px;
}
</style>
