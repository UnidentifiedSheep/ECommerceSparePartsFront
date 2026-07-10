<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div class="min-w-0">
          <div class="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <button class="text-slate-600 hover:text-slate-900" type="button" @click="router.push({ name: 'products' })">
              {{ t('products.title') }}
            </button>
            <span>/</span>
            <span>{{ t('products.crosses') }}</span>
          </div>
          <h1 class="truncate text-2xl font-semibold text-slate-900">
            {{ productHeader }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <el-button :icon="ArrowLeft" @click="router.push({ name: 'products' })">{{ t('common.actions.back') }}</el-button>
          <el-button
            v-if="product && canViewPriceOffers"
            :icon="Money"
            plain
            @click="priceOffersDialogOpen = true"
          >
            {{ t('priceOffers.open') }}
          </el-button>
          <el-dropdown trigger="click" @command="handleProductAction">
            <el-button :icon="MoreFilled" circle plain />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="refresh" :icon="Refresh">{{ t('common.actions.refresh') }}</el-dropdown-item>
                <el-dropdown-item v-if="product && canEditProduct" command="edit" :icon="Edit">{{ t('common.actions.edit') }}</el-dropdown-item>
                <el-dropdown-item v-if="canCreateCrosses" command="crosses" :icon="Plus">{{ t('products.addCrosses') }}</el-dropdown-item>
                <el-dropdown-item
                  v-if="product && canViewProductReservations"
                  command="reservations"
                  :icon="View"
                >
                  {{ t('users.viewReservations') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <main class="space-y-4 p-4">
      <div class="grid items-start gap-4 xl:grid-cols-[minmax(340px,35%)_minmax(0,65%)]">
        <section v-loading="isLoading" class="min-w-0 rounded-md border border-slate-200 bg-white">
          <template v-if="product">
            <div class="space-y-4 p-4">
              <div class="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                  <div class="text-sm font-semibold text-slate-900">{{ t('products.details.images') }}</div>
                  <div class="flex items-center gap-2">
                    <div v-if="productImages.length > 0" class="text-xs text-slate-500">
                      {{ productImages.length }} {{ t('products.details.photo') }}
                    </div>
                    <el-button
                      v-if="canAddImages"
                      :icon="Upload"
                      :loading="isUploadingImages"
                      size="small"
                      plain
                      @click="imageInput?.click()"
                    >
                      {{ t('common.actions.add') }}
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
                            {{ t('products.details.imageUnavailable') }}
                          </div>
                        </template>
                      </el-image>
                      <el-button
                        v-if="canDeleteImages"
                        :icon="Delete"
                        :loading="isDeletingImage && galleryImageIndex === index"
                        circle
                        type="danger"
                        class="absolute right-3 top-3"
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
                      galleryImageIndex === index ? 'border-slate-900 ring-1 ring-slate-200' : 'border-slate-200',
                    ]"
                    type="button"
                    @click="showGalleryImage(index)"
                  >
                    <el-image :src="image" fit="contain" class="h-full w-full" />
                  </button>
                </div>

                <el-empty v-else-if="productImages.length === 0" :description="t('products.details.noImages')" class="h-[220px]" />
              </div>

              <dl class="grid content-start grid-cols-[112px_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
                <dt class="text-slate-500">{{ t('products.sku') }}</dt>
                <dd class="min-w-0">
                  <ProductSkuCell :sku="product.sku" :indicator="product.indicator" />
                </dd>

                <dt class="text-slate-500">{{ t('common.labels.producer') }}</dt>
                <dd class="font-medium text-slate-900">{{ product.producerName || '-' }}</dd>

                <dt class="text-slate-500">{{ t('common.labels.name') }}</dt>
                <dd class="font-medium leading-5 text-slate-900">{{ product.name || '-' }}</dd>

                <dt class="text-slate-500">{{ t('common.labels.description') }}</dt>
                <dd class="font-medium leading-5 text-slate-900">{{ product.description || '-' }}</dd>

                <dt class="text-slate-500">{{ t('products.details.size') }}</dt>
                <dd class="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                  <span>{{ sizeText }}</span>
                  <el-button v-if="canManageSize" size="small" text type="primary" @click="sizeDialogOpen = true">
                    {{ sizeActionText }}
                  </el-button>
                </dd>

                <dt class="text-slate-500">{{ t('products.details.volume') }}</dt>
                <dd class="font-medium text-slate-900">{{ volumeText }}</dd>

                <dt class="text-slate-500">{{ t('products.weight') }}</dt>
                <dd class="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                  <span>{{ weightText }}</span>
                  <el-button v-if="canManageWeight" size="small" text type="primary" @click="weightDialogOpen = true">
                    {{ weightActionText }}
                  </el-button>
                </dd>

                <dt class="text-slate-500">{{ t('products.details.indicator') }}</dt>
                <dd>
                  <span v-if="product.indicator" class="inline-flex items-center gap-2">
                    <span
                      class="inline-block h-5 w-5 rounded border border-slate-300"
                      :style="{ backgroundColor: product.indicator }"
                    />
                  </span>
                  <span v-else class="font-medium text-slate-900">-</span>
                </dd>

                <dt class="text-slate-500">{{ t('products.stock') }}</dt>
                <dd>
                  <ProductStockCell :stock="product.stock" />
                </dd>
              </dl>

              <el-collapse v-model="productMetaCollapse" class="product-meta-collapse">
                <el-collapse-item name="pair">
                  <template #title>
                    <div class="product-collapse-title">
                      <span>{{ t('products.details.pairProduct') }}</span>
                      <span class="product-collapse-title__summary">{{ pairSummary }}</span>
                    </div>
                  </template>

                  <div class="product-collapse-body">
                    <div v-if="canEditProduct" class="product-extra-section__actions">
                      <el-button size="small" plain @click="openProductSelector('pair')">
                        {{ productPair ? t('products.details.changePair') : t('products.details.setPair') }}
                      </el-button>
                      <el-button v-if="productPair" size="small" text type="danger" @click="clearPair">
                        {{ t('common.actions.delete') }}
                      </el-button>
                    </div>

                    <div v-if="productPair" class="product-inline-card">
                      <ProductSkuCell :sku="productPair.sku" :indicator="productPair.indicator" />
                      <div class="min-w-0 flex-1">
                        <div class="truncate text-sm font-semibold text-slate-900">{{ productPair.name }}</div>
                        <div class="truncate text-xs text-slate-500">{{ productPair.producerName || '-' }}</div>
                      </div>
                      <el-button :icon="View" size="small" text @click="openProduct(productPair.id)" />
                    </div>
                    <el-empty v-else :description="t('products.details.noPair')" :image-size="48" />
                  </div>
                </el-collapse-item>

                <el-collapse-item name="content">
                  <template #title>
                    <div class="product-collapse-title">
                      <span>{{ t('products.details.productContent') }}</span>
                      <span class="product-collapse-title__summary">{{ contentSummary }}</span>
                    </div>
                  </template>

                  <div class="product-collapse-body">
                    <div class="product-collapse-toolbar">
                      <el-button
                        v-if="canCreateProductContent"
                        :icon="Plus"
                        size="small"
                        plain
                        @click="openAddContentDialog"
                      >
                        {{ t('common.actions.add') }}
                      </el-button>
                    </div>

                    <el-table
                      v-loading="isProductContentLoading"
                      :data="productContent"
                      size="small"
                      :empty-text="t('products.details.noContent')"
                      class="product-inner-table"
                    >
                      <el-table-column :label="t('common.labels.product')" min-width="220">
                        <template #default="{ row }">
                          <div class="product-table-product">
                            <ProductSkuCell :sku="row.product.sku" :indicator="row.product.indicator" />
                            <div class="min-w-0">
                              <div class="truncate font-semibold text-slate-900">{{ row.product.name }}</div>
                              <div class="truncate text-xs text-slate-500">{{ row.product.producerName || '-' }}</div>
                            </div>
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="quantity" :label="t('common.labels.count')" width="96" align="right" />
                      <el-table-column
                        v-if="canEditProductContent || canDeleteProductContent"
                        label=""
                        width="96"
                        align="right"
                      >
                        <template #default="{ row }">
                          <div class="flex justify-end gap-1">
                            <el-button
                              v-if="canEditProductContent"
                              :icon="Edit"
                              size="small"
                              text
                              @click="openEditContentDialog(row)"
                            />
                            <el-button
                              v-if="canDeleteProductContent"
                              :icon="Delete"
                              size="small"
                              text
                              type="danger"
                              @click="removeContentItem(row)"
                            />
                          </div>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-collapse-item>

                <el-collapse-item name="characteristics">
                  <template #title>
                    <div class="product-collapse-title">
                      <span>{{ t('products.details.characteristics') }}</span>
                      <span class="product-collapse-title__summary">{{ characteristicsSummary }}</span>
                    </div>
                  </template>

                  <div class="product-collapse-body">
                    <div class="product-collapse-toolbar">
                      <el-button
                        v-if="canCreateCharacteristics"
                        :icon="Plus"
                        size="small"
                        plain
                        @click="openCharacteristicDialog()"
                      >
                        {{ t('common.actions.add') }}
                      </el-button>
                    </div>

                    <el-table
                      v-loading="isCharacteristicsLoading"
                      :data="characteristics"
                      size="small"
                      :empty-text="t('products.details.noCharacteristics')"
                      class="product-inner-table"
                    >
                      <el-table-column prop="name" :label="t('common.labels.name')" min-width="140" show-overflow-tooltip />
                      <el-table-column prop="value" :label="t('common.labels.value')" min-width="180" show-overflow-tooltip />
                      <el-table-column
                        v-if="canEditCharacteristics || canDeleteCharacteristics"
                        label=""
                        width="96"
                        align="right"
                      >
                        <template #default="{ row }">
                          <div class="flex justify-end gap-1">
                            <el-button
                              v-if="canEditCharacteristics"
                              :icon="Edit"
                              size="small"
                              text
                              @click="openCharacteristicDialog(row)"
                            />
                            <el-button
                              v-if="canDeleteCharacteristics"
                              :icon="Delete"
                              size="small"
                              text
                              type="danger"
                              @click="removeCharacteristic(row)"
                            />
                          </div>
                        </template>
                      </el-table-column>
                    </el-table>

                    <div class="mt-3 flex justify-end border-t border-slate-200 pt-3">
                      <ZeroPagination
                        v-model:page="characteristicsPage"
                        v-model:size="characteristicsSize"
                        :has-next="characteristicsHasNext"
                        :sizes="[10, 20, 50]"
                      />
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>

              <el-collapse v-if="canViewStorageContent" v-model="storageContentCollapse" class="storage-content-collapse">
                <el-collapse-item name="storage-content">
                  <template #title>
                    <div class="flex min-w-0 flex-1 items-center justify-between gap-3 pr-3">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-slate-900">{{ t('products.details.storageStock') }}</div>
                        <div class="truncate text-xs text-slate-500">{{ storageContentSummary }}</div>
                      </div>
                    </div>
                  </template>

                  <div class="space-y-3">
                    <div class="flex items-center justify-end gap-2">
                      <el-switch
                        v-model="showZeroStorageContent"
                        :active-text="t('products.details.zero')"
                        :inactive-text="t('products.details.stocks')"
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
                        {{ t('common.actions.add') }}
                      </el-button>
                    </div>

                    <el-table
                      v-loading="isStorageContentLoading"
                      :data="storageContent"
                      stripe
                      size="small"
                      :empty-text="t('products.details.noStocks')"
                      class="storage-content-table"
                    >
                      <el-table-column prop="storageName" :label="t('common.labels.storage')" min-width="150" show-overflow-tooltip />
                      <el-table-column prop="count" :label="t('common.labels.count')" width="120" align="right">
                        <template #default="{ row }">
                          <ProductStockCell :stock="row.count" />
                        </template>
                      </el-table-column>
                      <el-table-column :label="t('products.details.purchase')" width="110" align="right">
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

          <el-empty v-else-if="!isLoading" :description="t('products.details.productNotFound')" />
        </section>

        <section class="product-crosses-panel">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">{{ t('products.details.productCrosses') }}</h2>
              <div class="text-sm text-slate-500">{{ crossesSummary }}</div>
            </div>

            <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <el-input
                v-model="crossSearch"
                clearable
                :placeholder="t('products.details.crossSearchPlaceholder')"
                class="min-w-64 flex-1 sm:w-80"
              />
              <el-button
                v-if="canCreateCrosses"
                :icon="Plus"
                type="primary"
                plain
                @click="crossDialogOpen = true"
              >
                {{ t('products.addCrosses') }}
              </el-button>
            </div>
          </div>

          <el-table
            v-loading="isCrossesLoading"
            :data="filteredCrosses"
            stripe
            height="100%"
            :empty-text="t('products.details.noCrosses')"
            class="crosses-table flex-1"
            @sort-change="handleSortChange"
          >
            <el-table-column prop="sku" :label="t('products.sku')" min-width="145" sortable="custom">
              <template #default="{ row }">
                <ProductSkuCell :sku="row.sku" :indicator="row.indicator" />
              </template>
            </el-table-column>
            <el-table-column prop="name" :label="t('common.labels.name')" min-width="210" show-overflow-tooltip sortable="custom" />
            <el-table-column prop="producerName" :label="t('common.labels.producer')" min-width="130" sortable="custom">
              <template #default="{ row }">
                {{ row.producerName || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="count" :label="t('products.stock')" width="128" align="right" sortable="custom">
              <template #default="{ row }">
                <ProductStockCell :stock="row.stock" />
              </template>
            </el-table-column>
            <el-table-column label="" width="72" align="right">
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
    <ProductSelectorDialog
      v-model="productSelectorOpen"
      @select="handleProductSelected"
    />

    <el-dialog v-model="addStorageContentDialogOpen" :title="t('products.details.addStockTitle')" width="520">
      <el-form label-position="top">
        <el-form-item :label="t('common.labels.product')">
          <el-input :model-value="productLabel" disabled />
        </el-form-item>

        <el-form-item :label="t('common.labels.storage')">
          <el-select
            v-model="addStorageContentForm.storageName"
            :loading="isStorageOptionsLoading"
            filterable
            class="w-full"
            :placeholder="t('storages.selectStorage')"
          >
            <el-option
              v-for="storage in storageOptions"
              :key="storage.name"
              :label="storage.name"
              :value="storage.name"
            >
              <div class="flex min-w-0 flex-col py-1">
                <span class="truncate">{{ storage.name }}</span>
                <span class="truncate text-xs text-slate-500">{{ storage.location || storage.description || t('products.details.noDescription') }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item :label="t('storages.contentPanel.quantity')">
            <el-input-number v-model="addStorageContentForm.count" :min="1" :controls="false" class="w-full" />
          </el-form-item>

          <el-form-item :label="t('storages.contentPanel.buyPrice')">
            <el-input-number v-model="addStorageContentForm.buyPrice" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
        </div>

        <el-form-item :label="t('common.labels.currency')">
          <el-select
            v-model="addStorageContentForm.currencyId"
            :loading="isCurrencyOptionsLoading"
            filterable
            class="w-full"
            :placeholder="t('currencies.selectCurrency')"
          >
            <el-option
              v-for="currency in currencyOptions"
              :key="currency.id"
              :label="`${currency.name} (${currency.currencySign})`"
              :value="currency.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('storages.contentPanel.purchaseDate')">
          <el-date-picker
            v-model="addStorageContentForm.purchaseDate"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS"
            class="w-full"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addStorageContentDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="isAddingStorageContent" @click="addStorageContentItem">{{ t('common.actions.add') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editStorageContentDialogOpen" :title="t('products.details.editStockTitle')" width="520">
      <el-form label-position="top">
        <el-form-item :label="t('common.labels.storage')">
          <el-input :model-value="editingStorageContent?.storageName" disabled />
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item :label="t('storages.contentPanel.quantity')">
            <el-input-number v-model="editStorageContentForm.count" :min="0" :controls="false" class="w-full" />
          </el-form-item>

          <el-form-item :label="t('storages.contentPanel.buyPrice')">
            <el-input-number v-model="editStorageContentForm.buyPrice" :min="0" :precision="2" :controls="false" class="w-full" />
          </el-form-item>
        </div>

        <el-form-item :label="t('common.labels.currency')">
          <el-select
            v-model="editStorageContentForm.currencyId"
            :loading="isCurrencyOptionsLoading"
            filterable
            class="w-full"
            :placeholder="t('currencies.selectCurrency')"
          >
            <el-option
              v-for="currency in currencyOptions"
              :key="currency.id"
              :label="`${currency.name} (${currency.currencySign})`"
              :value="currency.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('storages.contentPanel.purchaseDate')">
          <el-date-picker
            v-model="editStorageContentForm.purchaseDatetime"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSS"
            class="w-full"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editStorageContentDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="isEditingStorageContent" @click="saveStorageContentEdit">{{ t('common.actions.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="contentDialogOpen" :title="contentDialogTitle" width="520">
      <el-form label-position="top">
        <el-form-item :label="t('common.labels.product')">
          <div class="flex gap-2">
            <el-input :model-value="selectedContentProductLabel" readonly :placeholder="t('products.details.selectContentProduct')" />
            <el-button @click="openProductSelector('content')">{{ t('products.pick') }}</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="t('common.labels.count')">
          <el-input-number v-model="contentForm.count" :min="1" :controls="false" class="w-full" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="contentDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="isSavingProductContent" @click="saveContentItem">
          {{ t('common.actions.save') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="characteristicDialogOpen" :title="characteristicDialogTitle" width="520">
      <el-form label-position="top">
        <el-form-item :label="t('common.labels.name')">
          <el-input
            v-model="characteristicForm.name"
            :disabled="Boolean(editingCharacteristic)"
            :placeholder="t('products.details.characteristicNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('common.labels.value')">
          <el-input
            v-model="characteristicForm.value"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            :placeholder="t('products.details.characteristicValuePlaceholder')"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="characteristicDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="isSavingCharacteristic" @click="saveCharacteristic">
          {{ t('common.actions.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Delete, Edit, Money, MoreFilled, Plus, Refresh, Upload, View } from '@element-plus/icons-vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { CarouselInstance } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import CreateProductsCrossesDialog from '@/components/products/CreateProductsCrossesDialog.vue'
import ProductEditDialog from '@/components/products/ProductEditDialog.vue'
import ProductPriceOffersDialog from '@/components/pricing/ProductPriceOffersDialog.vue'
import ProductReservationsDialog from '@/components/products/ProductReservationsDialog.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import ProductSizeDialog from '@/components/products/ProductSizeDialog.vue'
import ProductSkuCell from '@/components/products/ProductSkuCell.vue'
import ProductStockCell from '@/components/products/ProductStockCell.vue'
import ProductWeightDialog from '@/components/products/ProductWeightDialog.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductCharacteristicModel, ProductContentModel, ProductModel, ProductSizeModel, ProductWeightModel } from '@/models/productModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { StorageContentModel } from '@/models/storageContentModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import {
  addProductCharacteristic,
  addProductContent,
  deleteProductCharacteristic,
  deleteProductContent,
  deleteProductImage,
  editProduct,
  editProductCharacteristic,
  editProductContent,
  getProductCharacteristics,
  getProductContent,
  getProductById,
  getProductCrosses,
  getProductPair,
  getProductSize,
  getProductWeight,
  uploadProductImages,
} from '@/services/api/products.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { addStorageContent, deleteStorageContent, editStorageContent, getStorageContent, getStorages } from '@/services/api/storages.ts'
import { toLocalDateTimeInputValue } from '@/utils/dateTime.ts'
import { dimensionMeasureUnitLabel, weightMeasureUnitLabel } from '@/utils/measurementUnits.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()

const product = ref<ProductModel>()
const crosses = ref<ProductModel[]>([])
const storageContent = ref<StorageContentModel[]>([])
const productPair = ref<ProductModel | null>(null)
const productContent = ref<ProductContentModel[]>([])
const characteristics = ref<ProductCharacteristicModel[]>([])
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
const characteristicsPage = ref(0)
const characteristicsSize = ref(10)
const characteristicsHasNext = ref(false)
const productMetaCollapse = ref<string[]>([])
const storageContentCollapse = ref<string[]>([])
const showZeroStorageContent = ref(false)
const isLoading = ref(false)
const isCrossesLoading = ref(false)
const isStorageContentLoading = ref(false)
const isProductContentLoading = ref(false)
const isCharacteristicsLoading = ref(false)
const isStorageOptionsLoading = ref(false)
const isCurrencyOptionsLoading = ref(false)
const isAddingStorageContent = ref(false)
const isEditingStorageContent = ref(false)
const isSavingProductContent = ref(false)
const isSavingCharacteristic = ref(false)
const deletingStorageContentId = ref<number>()
const crossSearch = ref('')
const sortBy = ref<string>()
const crossDialogOpen = ref(false)
const productSelectorOpen = ref(false)
const productSelectorMode = ref<'pair' | 'content'>('content')
const galleryImageIndex = ref(0)
const productGallery = ref<CarouselInstance>()
const imageInput = ref<HTMLInputElement>()
const isUploadingImages = ref(false)
const deletingImage = ref<string | null>(null)
const sizeDialogOpen = ref(false)
const weightDialogOpen = ref(false)
const editDialogOpen = ref(false)
const reservationsDialogOpen = ref(false)
const priceOffersDialogOpen = ref(false)
const addStorageContentDialogOpen = ref(false)
const editStorageContentDialogOpen = ref(false)
const contentDialogOpen = ref(false)
const characteristicDialogOpen = ref(false)
const editingStorageContent = ref<StorageContentModel>()
const editingContentItem = ref<ProductContentModel>()
const selectedContentProduct = ref<ProductSearchModel | null>(null)
const editingCharacteristic = ref<ProductCharacteristicModel>()
const { hasPermission } = usePermissions()
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
const sizeActionText = computed(() => canSetSize.value
  ? (productSize.value ? t('products.details.change') : t('products.details.set'))
  : t('common.actions.delete'))
const weightActionText = computed(() => canSetWeight.value
  ? (productWeight.value ? t('products.details.change') : t('products.details.set'))
  : t('common.actions.delete'))

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

const contentForm = reactive({
  count: 1,
})

const characteristicForm = reactive({
  name: '',
  value: '',
})

const productId = computed(() => Number(route.params.id))
const productLabel = computed(() => product.value ? `${product.value.sku} - ${product.value.name}` : '')
const productImages = computed(() => product.value?.images.filter(Boolean) ?? [])
const isDeletingImage = computed(() => deletingImage.value !== null)
const productHeader = computed(() => {
  if (!product.value) return t('products.details.productHeader', { id: String(route.params.id) })
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
  if (isCrossesLoading.value) return t('products.details.loading')
  if (crossSearch.value.trim()) return t('products.details.foundOf', {
    shown: filteredCrosses.value.length,
    total: crosses.value.length,
  })
  return crosses.value.length > 0
    ? t('products.details.positionsOnPage', { count: crosses.value.length })
    : t('products.details.noLinkedPositions')
})

const storageContentSummary = computed(() => {
  if (isStorageContentLoading.value) return t('products.details.loading')
  return storageContent.value.length > 0
    ? t('products.details.positionsOnPage', { count: storageContent.value.length })
    : t('products.details.noStoragePositions')
})

const pairSummary = computed(() => {
  if (productPair.value) return `${productPair.value.sku} · ${productPair.value.name}`
  return t('products.details.noPairSelected')
})

const contentSummary = computed(() => {
  if (isProductContentLoading.value) return t('products.details.loading')
  return productContent.value.length > 0
    ? t('products.details.contentPositions', { count: productContent.value.length })
    : t('products.details.noContent')
})

const characteristicsSummary = computed(() => {
  if (isCharacteristicsLoading.value) return t('products.details.loading')
  return characteristics.value.length > 0
    ? t('products.details.characteristicsCount', { count: characteristics.value.length })
    : t('products.details.noCharacteristics')
})

const selectedContentProductLabel = computed(() => {
  if (selectedContentProduct.value) return `${selectedContentProduct.value.sku} - ${selectedContentProduct.value.name}`
  if (editingContentItem.value) return `${editingContentItem.value.product.sku} - ${editingContentItem.value.product.name}`
  return ''
})

const contentDialogTitle = computed(() => (
  editingContentItem.value ? t('products.details.editContentTitle') : t('products.details.addContentTitle')
))

const characteristicDialogTitle = computed(() => (
  editingCharacteristic.value ? t('products.details.editCharacteristicTitle') : t('products.details.addCharacteristicTitle')
))

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
  return `${formatNumber(productSize.value.volumeM3)} ${t('purchases.m3')}`
})

const weightText = computed(() => {
  if (!productWeight.value) return '-'

  return `${formatNumber(productWeight.value.weight)} ${weightMeasureUnitLabel(productWeight.value.unit, productWeight.value.weight)}`
})

function formatNumber(value: number) {
  return value.toLocaleString(locale.value)
}

function formatMoney(value: number, currencySign?: string) {
  return `${formatNumber(value)} ${currencySign ?? ''}`.trim()
}

function openProduct(id: number) {
  router.push({
    name: 'product-details',
    params: { id },
  })
}

function openProductSelector(mode: 'pair' | 'content') {
  productSelectorMode.value = mode
  productSelectorOpen.value = true
}

async function handleProductSelected(selected: ProductSearchModel) {
  if (!product.value) return

  if (selected.id === product.value.id) {
    ElNotification({
      title: t('products.details.fillDataTitle'),
      message: t('products.details.sameProductForbidden'),
      type: 'warning',
    })
    return
  }

  if (productSelectorMode.value === 'pair') {
    await setPair(selected.id)
    return
  }

  selectedContentProduct.value = selected
}

async function setPair(pairId: number | null) {
  if (!product.value || !canEditProduct.value) return

  await editProduct({
    id: product.value.id,
    pairId,
  })

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
  switch (command) {
    case 'refresh':
      await loadDetails()
      break
    case 'edit':
      editDialogOpen.value = true
      break
    case 'crosses':
      crossDialogOpen.value = true
      break
    case 'reservations':
      reservationsDialogOpen.value = true
      break
  }
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
      title: t('products.details.imagesAddedTitle'),
      message: t('products.details.uploadedCount', { count: files.length }),
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
    const resp = await getCurrencies()
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
      title: t('products.details.fillDataTitle'),
      message: t('products.details.selectStorageAndCurrency'),
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
      title: t('products.details.stockAddedTitle'),
      message: t('products.details.stockAddedMessage'),
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
      title: t('products.details.fillDataTitle'),
      message: t('products.details.selectCurrency'),
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
      title: t('products.details.stockUpdatedTitle'),
      message: t('products.details.stockUpdatedMessage'),
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
      t('products.details.deleteStockConfirm'),
      t('products.details.deleteStockTitle'),
      {
        confirmButtonText: t('common.actions.delete'),
        cancelButtonText: t('common.actions.cancel'),
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
      title: t('products.details.stockDeletedTitle'),
      message: t('products.details.stockDeletedMessage'),
      type: 'success',
    })

    storageContentCollapse.value = ['storage-content']
    await loadDetails()
  } finally {
    deletingStorageContentId.value = undefined
  }
}

function openAddContentDialog() {
  editingContentItem.value = undefined
  selectedContentProduct.value = null
  contentForm.count = 1
  contentDialogOpen.value = true
}

function openEditContentDialog(item: ProductContentModel) {
  editingContentItem.value = item
  selectedContentProduct.value = null
  contentForm.count = item.quantity
  contentDialogOpen.value = true
}

async function saveContentItem() {
  if (!product.value) return

  if (!editingContentItem.value && !selectedContentProduct.value) {
    ElNotification({
      title: t('products.details.fillDataTitle'),
      message: t('products.details.selectContentProduct'),
      type: 'warning',
    })
    return
  }

  isSavingProductContent.value = true
  try {
    if (editingContentItem.value) {
      await editProductContent({
        productId: product.value.id,
        childProductId: editingContentItem.value.product.id,
        count: contentForm.count,
      })
    } else if (selectedContentProduct.value) {
      await addProductContent({
        productId: product.value.id,
        childProductId: selectedContentProduct.value.id,
        count: contentForm.count,
      })
    }

    ElNotification({
      title: t('products.details.contentSavedTitle'),
      message: t('products.details.contentSavedMessage'),
      type: 'success',
    })

    contentDialogOpen.value = false
    await loadProductContent()
  } finally {
    isSavingProductContent.value = false
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

  await loadProductContent()
}

function openCharacteristicDialog(item?: ProductCharacteristicModel) {
  editingCharacteristic.value = item
  characteristicForm.name = item?.name ?? ''
  characteristicForm.value = item?.value ?? ''
  characteristicDialogOpen.value = true
}

async function saveCharacteristic() {
  if (!product.value) return

  const name = characteristicForm.name.trim()
  const value = characteristicForm.value.trim()
  if (!name || !value) {
    ElNotification({
      title: t('products.details.fillDataTitle'),
      message: t('products.details.fillCharacteristic'),
      type: 'warning',
    })
    return
  }

  isSavingCharacteristic.value = true
  try {
    if (editingCharacteristic.value) {
      await editProductCharacteristic({
        productId: product.value.id,
        name: editingCharacteristic.value.name,
        value,
      })
    } else {
      await addProductCharacteristic({
        productId: product.value.id,
        name,
        value,
      })
    }

    ElNotification({
      title: t('products.details.characteristicSavedTitle'),
      message: t('products.details.characteristicSavedMessage'),
      type: 'success',
    })

    characteristicDialogOpen.value = false
    await loadCharacteristics()
  } finally {
    isSavingCharacteristic.value = false
  }
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

  await loadCharacteristics()
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

    crosses.value = resp.crosses
    hasNext.value = resp.crosses.length === size.value
  } finally {
    isCrossesLoading.value = false
  }
}

async function loadProduct() {
  if (!Number.isFinite(productId.value) || productId.value <= 0) {
    product.value = undefined
    return
  }

  const resp = await getProductById(productId.value)
  product.value = resp.product
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

async function loadPair() {
  if (!Number.isFinite(productId.value) || productId.value <= 0) {
    productPair.value = null
    return
  }

  const resp = await getProductPair(productId.value)
  productPair.value = resp.pair
}

async function loadProductContent() {
  if (!Number.isFinite(productId.value) || productId.value <= 0) {
    productContent.value = []
    return
  }

  isProductContentLoading.value = true
  try {
    const resp = await getProductContent(productId.value)
    productContent.value = resp.content
  } finally {
    isProductContentLoading.value = false
  }
}

async function loadCharacteristics() {
  if (!Number.isFinite(productId.value) || productId.value <= 0) {
    characteristics.value = []
    characteristicsHasNext.value = false
    return
  }

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
    productPair.value = null
    productContent.value = []
    characteristics.value = []
    hasNext.value = false
    storageContentHasNext.value = false
    characteristicsHasNext.value = false
    return
  }

  isLoading.value = true
  try {
    await Promise.all([
      loadProduct(),
      loadCrosses(),
      loadProductMetrics(),
      loadStorageContent(),
      loadPair(),
      loadProductContent(),
      loadCharacteristics(),
    ])
  } finally {
    isLoading.value = false
  }
}

watch(productId, async () => {
  page.value = 0
  storageContentPage.value = 0
  characteristicsPage.value = 0
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
watch(characteristicsPage, async () => loadCharacteristics())
watch(characteristicsSize, async () => {
  characteristicsPage.value = 0
  await loadCharacteristics()
})
watch(showZeroStorageContent, async () => {
  storageContentPage.value = 0
  await loadStorageContent()
})

onMounted(async () => loadDetails())
</script>

<style scoped>
.product-crosses-panel {
  display: flex;
  min-width: 0;
  min-height: calc(100vh - 176px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: white;
}

:deep(.crosses-table .el-table__header th) {
  background: rgb(248 250 252);
  color: rgb(71 85 105);
  font-weight: 700;
}

:deep(.crosses-table .el-table__cell) {
  padding-top: 10px;
  padding-bottom: 10px;
}

:deep(.crosses-table .stock-cell) {
  justify-content: flex-end;
}

.product-extra-section {
  border-top: 1px solid rgb(226 232 240);
  padding-top: 14px;
}

.product-extra-section + .product-extra-section {
  margin-top: 14px;
}

.product-extra-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.product-extra-section__header h2 {
  margin: 0;
  color: rgb(15 23 42);
  font-size: 14px;
  font-weight: 700;
}

.product-extra-section__header p {
  margin: 3px 0 0;
  color: rgb(100 116 139);
  font-size: 12px;
  line-height: 1.35;
}

.product-extra-section__actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 10px;
}

.product-meta-collapse {
  border-top: 1px solid rgb(226 232 240);
  border-bottom: 1px solid rgb(226 232 240);
}

:deep(.product-meta-collapse .el-collapse-item__header) {
  height: auto;
  min-height: 48px;
  padding: 8px 0;
  border-bottom-color: rgb(226 232 240);
  line-height: 1.35;
}

:deep(.product-meta-collapse .el-collapse-item__content) {
  padding-bottom: 14px;
}

.product-collapse-title {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 2px;
  padding-right: 12px;
}

.product-collapse-title > span:first-child {
  color: rgb(15 23 42);
  font-size: 14px;
  font-weight: 700;
}

.product-collapse-title__summary {
  overflow: hidden;
  color: rgb(100 116 139);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-collapse-body {
  padding-top: 2px;
}

.product-collapse-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.product-inline-card {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: rgb(248 250 252);
  padding: 10px;
}

.product-table-product {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

:deep(.product-inner-table .el-table__header th) {
  background: rgb(248 250 252);
  color: rgb(71 85 105);
  font-weight: 700;
}

:deep(.product-inner-table .el-table__cell) {
  padding-top: 8px;
  padding-bottom: 8px;
}

@media (max-width: 1280px) {
  .product-crosses-panel {
    min-height: 620px;
  }
}
</style>
