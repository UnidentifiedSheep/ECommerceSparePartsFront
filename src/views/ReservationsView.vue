<template>
  <div class="reservations-page">
    <div class="reservations-header">
      <div>
        <h1>{{ t('reservations.title') }}</h1>
        <p>{{ t('reservations.description') }}</p>
      </div>
    </div>

    <main class="reservations-content">
      <section class="reservations-toolbar">
        <div>
          <h2>{{ t('reservations.listTitle') }}</h2>
          <p>{{ activeFiltersText }}</p>
        </div>
        <div class="toolbar-actions">
          <el-badge :value="activeFiltersCount" :hidden="activeFiltersCount === 0">
            <el-button size="large" plain @click="filtersDrawerOpen = true">{{ t('reservations.filters') }}</el-button>
          </el-badge>
        </div>
      </section>

      <el-drawer
        v-model="filtersDrawerOpen"
        :title="t('reservations.filtersTitle')"
        direction="rtl"
        size="min(440px, 100vw)"
        class="reservation-filters-drawer"
      >
        <div class="drawer-content">
          <div class="drawer-body">
            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('reservations.viewSlice') }}</div>
              <div class="drawer-section-subtitle">{{ t('reservations.viewSliceHint') }}</div>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('common.labels.status') }}</div>
              <label class="filter-field">
                <span>{{ t('reservations.reservationType') }}</span>
                <el-segmented v-model="reservationState" :options="reservationStateOptions" class="w-full" />
              </label>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('organizations.organization') }}</div>
              <label class="filter-field">
                <span>{{ t('organizations.organization') }}</span>
                <OrganizationSelector
                  v-model="selectedOrganization"
                  :member-required="false"
                  :placeholder="t('reservations.anyOrganization')"
                />
              </label>
            </section>

            <section class="drawer-section">
              <div class="drawer-section-title">{{ t('common.labels.product') }}</div>
              <label class="filter-field">
                <span>{{ t('common.labels.product') }}</span>
                <div class="picker-row">
                  <el-input
                    :model-value="selectedProductLabel"
                    :placeholder="t('reservations.anyProduct')"
                    readonly
                    clearable
                    @clear="selectedProduct = undefined"
                  />
                  <el-button @click="productSelectorOpen = true">{{ t('reservations.pick') }}</el-button>
                </div>
              </label>
            </section>
          </div>

          <div class="drawer-footer">
            <el-button @click="resetFilters">{{ t('common.actions.reset') }}</el-button>
            <el-button type="primary" @click="filtersDrawerOpen = false">{{ t('reservations.apply') }}</el-button>
          </div>
        </div>
      </el-drawer>

      <ProductReservationsPanel
        :key="panelKey"
        :product-id="selectedProduct?.id"
        :organization-id="selectedOrganization?.organization.id"
        :show-deleted="reservationState === 'withDeleted'"
        :title="t('reservations.listTitle')"
      />
    </main>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="selectProduct" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ProductReservationsPanel from '@/components/products/ProductReservationsPanel.vue'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import OrganizationSelector from '@/components/selectors/OrganizationSelector.vue'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { OrganizationSelection } from '@/models/organizationModel.ts'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const selectedOrganization = ref<OrganizationSelection>()
const selectedProduct = ref<ProductSearchModel>()
const productSelectorOpen = ref(false)
const filtersDrawerOpen = ref(false)
const reservationState = ref<'active' | 'withDeleted'>('active')
const reservationStateOptions = computed(() => [
  { label: t('reservations.active'), value: 'active' },
  { label: t('reservations.withDeleted'), value: 'withDeleted' },
])

const selectedProductLabel = computed(() => (
  selectedProduct.value ? `${selectedProduct.value.sku} - ${selectedProduct.value.name}` : ''
))
const activeFiltersCount = computed(() => (
  (selectedOrganization.value ? 1 : 0)
  + (selectedProduct.value ? 1 : 0)
  + (reservationState.value === 'withDeleted' ? 1 : 0)
))
const activeFiltersText = computed(() => (
  activeFiltersCount.value === 0
    ? t('reservations.allShown')
    : t('reservations.activeFilters', { count: activeFiltersCount.value })
))
const panelKey = computed(() => `${selectedOrganization.value?.organization.id ?? 'all-organizations'}:${selectedProduct.value?.id ?? 'all-products'}:${reservationState.value}`)

function selectProduct(product: ProductSearchModel) {
  selectedProduct.value = product
}

function resetFilters() {
  selectedOrganization.value = undefined
  selectedProduct.value = undefined
  reservationState.value = 'active'
}
</script>

<style scoped>
.reservations-page {
  min-height: calc(100vh - 56px);
  background: #f7f7f8;
}

.reservations-header {
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 18px 20px;
}

.reservations-header h1,
.reservations-toolbar h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 750;
  line-height: 1.2;
}

.reservations-header h1 {
  font-size: 26px;
}

.reservations-header p,
.reservations-toolbar p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.reservations-content {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.reservations-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 16px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.drawer-content {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.drawer-body {
  flex: 1;
  overflow: auto;
  padding: 10px 20px 24px;
}

.drawer-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
}

.drawer-section + .drawer-section {
  margin-top: 14px;
}

.drawer-section-title {
  margin-bottom: 10px;
  color: #334155;
  font-size: 15px;
  font-weight: 650;
}

.drawer-section-subtitle {
  color: #64748b;
  font-size: 13px;
  line-height: 1.4;
}

.filter-field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.filter-field > span {
  color: #334155;
  font-size: 13px;
  font-weight: 650;
}

.picker-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  padding: 14px 20px;
}

:deep(.reservation-filters-drawer .el-drawer__header) {
  margin-bottom: 0;
  border-bottom: 1px solid #e2e8f0;
  padding: 18px 20px;
}

:deep(.reservation-filters-drawer .el-drawer__body) {
  padding: 0;
}

@media (max-width: 760px) {
  .reservations-header,
  .reservations-toolbar {
    align-items: stretch;
    flex-direction: column;
    padding: 16px 14px;
  }

  .reservations-header h1 {
    font-size: 22px;
  }

  .reservations-content {
    gap: 12px;
    padding: 12px;
  }

  .toolbar-actions,
  .toolbar-actions :deep(.el-badge),
  .toolbar-actions :deep(.el-button),
  .picker-row :deep(.el-button) {
    width: 100%;
  }

  .picker-row {
    grid-template-columns: 1fr;
  }

  .drawer-body {
    padding: 10px 14px 18px;
  }

  .drawer-footer {
    display: grid;
    grid-template-columns: 1fr;
    padding: 12px 14px;
  }

  .drawer-footer :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
