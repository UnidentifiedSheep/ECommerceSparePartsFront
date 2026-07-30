<template>
  <Teleport to="body">
  <aside
    class="sale-history"
    :class="{ 'sale-history--open': isOpen }"
    :style="{ zIndex: panelZIndex }"
  >
    <button
      v-if="!isOpen"
      type="button"
      class="sale-history__toggle"
      :aria-label="t('sales.history.open')"
      :title="t('sales.history.open')"
      @click="isOpen = true"
    >
      <el-icon>
        <ArrowLeft />
      </el-icon>
      <span>{{ t('sales.history.show') }}</span>
    </button>

    <div v-if="isOpen" class="sale-history__content">
      <header class="sale-history__header">
        <div class="min-w-0">
          <div class="sale-history__title">{{ t('sales.history.title') }}</div>
          <div v-if="product" class="sale-history__product">
            <strong>{{ product.name }}</strong>
            <span>{{ product.sku }} · ID {{ product.id }}</span>
          </div>
          <div v-else class="sale-history__hint">{{ t('sales.history.selectPosition') }}</div>
        </div>
        <div class="sale-history__header-actions">
          <el-button
            :icon="Refresh"
            circle
            plain
            :loading="isLoading"
            :disabled="!product"
            :aria-label="t('common.actions.refresh')"
            :title="t('common.actions.refresh')"
            @click="refresh"
          />
          <el-button text @click="isOpen = false">
            <el-icon><ArrowRight /></el-icon>
            {{ t('sales.history.hide') }}
          </el-button>
        </div>
      </header>

      <template v-if="product">
        <div class="sale-history__context">
          <span>{{ storageName || t('sales.history.anyStorage') }}</span>
          <span>{{ currencySign || t('sales.history.anyCurrency') }}</span>
        </div>

        <el-select v-model="sortBy" class="sale-history__sort" :teleported="false" @change="refresh">
          <el-option
            v-for="option in sortOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <div v-if="errorMessage" class="sale-history__state sale-history__state--error">
          <span>{{ errorMessage }}</span>
          <el-button size="small" plain @click="refresh">{{ t('common.actions.refresh') }}</el-button>
        </div>

        <div v-else-if="isLoading && history.length === 0" class="sale-history__state">
          {{ t('sales.history.loading') }}
        </div>

        <div v-else-if="history.length === 0" class="sale-history__state">
          {{ t('sales.history.empty') }}
        </div>

        <div v-else class="sale-history__list">
          <article v-for="entry in history" :key="entry.saleContentId" class="sale-history__entry">
            <div class="sale-history__entry-head">
              <strong>{{ formatMoney(entry.price) }}</strong>
              <time :datetime="entry.saleDate">{{ formatDate(entry.saleDate) }}</time>
            </div>
            <dl>
              <div>
                <dt>{{ t('sales.history.averageBuyPrice') }}</dt>
                <dd>{{ formatMoney(entry.averageBuyPrice) }}</dd>
              </div>
              <div>
                <dt>{{ t('common.labels.count') }}</dt>
                <dd>{{ entry.quantity.toLocaleString(locale) }}</dd>
              </div>
              <div>
                <dt>{{ t('sales.history.discount') }}</dt>
                <dd>{{ formatPercent(entry.discount) }}</dd>
              </div>
              <div>
                <dt>{{ t('common.labels.storage') }}</dt>
                <dd>{{ entry.storageName }}</dd>
              </div>
            </dl>
            <div class="sale-history__meta">
              <span>#{{ entry.saleContentId }}</span>
              <span v-if="entry.whoCreated">{{ shortId(entry.whoCreated) }}</span>
            </div>
          </article>
        </div>

        <el-button
          v-if="hasNext"
          class="sale-history__more"
          plain
          :loading="isLoadingMore"
          @click="loadMore"
        >
          {{ t('common.actions.loadMore') }}
        </el-button>
      </template>
    </div>
  </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, Refresh } from '@element-plus/icons-vue'
import { useZIndex } from 'element-plus'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import {
  getProductSaleHistory,
  type ProductSaleHistoryModel,
} from '@/services/api/sales.ts'
import { useI18n } from '@/i18n'

const props = defineProps<{
  product?: Pick<ProductSearchModel, 'id' | 'name' | 'sku'>
  storageName?: string
  organizationId?: string
  preferredOrganizationId?: string
  currencyId?: number
  currencySign?: string
}>()

const isOpen = defineModel<boolean>({ required: true })
const { locale, t } = useI18n()
const { nextZIndex } = useZIndex()
const panelZIndex = ref(nextZIndex())
const history = ref<ProductSaleHistoryModel[]>([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const errorMessage = ref('')
const hasNext = ref(false)
const page = ref(0)
const pageSize = 10
const sortBy = ref('saleDate_desc')
let requestId = 0

const sortOptions = computed(() => [
  { value: 'saleDate_desc', label: t('sales.history.sortNewest') },
  { value: 'saleDate_asc', label: t('sales.history.sortOldest') },
  { value: 'price_desc', label: t('sales.history.sortPriceDesc') },
  { value: 'price_asc', label: t('sales.history.sortPriceAsc') },
  { value: 'averageBuyPrice_desc', label: t('sales.history.sortBuyPriceDesc') },
  { value: 'averageBuyPrice_asc', label: t('sales.history.sortBuyPriceAsc') },
  { value: 'discount_desc', label: t('sales.history.sortDiscountDesc') },
  { value: 'discount_asc', label: t('sales.history.sortDiscountAsc') },
])

async function load(reset: boolean) {
  if (!props.product || !isOpen.value) return

  const currentRequestId = ++requestId
  if (reset) {
    page.value = 0
    history.value = []
    errorMessage.value = ''
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  try {
    const response = await getProductSaleHistory({
      productId: props.product.id,
      storageName: props.storageName,
      organizationId: props.organizationId,
      preferredOrganizationId: props.preferredOrganizationId,
      currencyId: props.currencyId,
      page: page.value,
      size: pageSize,
      sortBy: [sortBy.value],
    })
    if (currentRequestId !== requestId) return

    history.value = reset
      ? response.history
      : [...history.value, ...response.history]
    hasNext.value = response.history.length === pageSize
    page.value += 1
  } catch (error) {
    if (currentRequestId === requestId) {
      errorMessage.value = error instanceof Error ? error.message : t('sales.history.loadError')
      hasNext.value = false
    }
  } finally {
    if (currentRequestId === requestId) {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }
}

function refresh() {
  void load(true)
}

function loadMore() {
  if (!isLoadingMore.value && hasNext.value) void load(false)
}

function formatMoney(value: number) {
  const formatted = value.toLocaleString(locale.value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${formatted} ${props.currencySign ?? ''}`.trim()
}

function formatPercent(value: number) {
  return (value * 100).toLocaleString(locale.value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + '%'
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function shortId(value: string) {
  return value.length > 12 ? `${value.slice(0, 8)}…` : value
}

watch(
  () => [
    isOpen.value,
    props.product?.id,
    props.storageName,
    props.organizationId,
    props.preferredOrganizationId,
    props.currencyId,
  ],
  ([open]) => {
    if (open && props.product) {
      panelZIndex.value = nextZIndex()
      refresh()
    } else if (!props.product) {
      requestId += 1
      history.value = []
      hasNext.value = false
      errorMessage.value = ''
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.sale-history {
  position: fixed;
  top: 5vh;
  right: max(16px, calc((100vw - 1680px) / 2));
  width: 108px;
  height: 38px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
}

.sale-history--open {
  width: 360px;
  height: min(884px, 90vh);
  border-left-color: #94a3b8;
  border-radius: 0 8px 8px 0;
}

.sale-history__toggle {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: inherit;
  background: transparent;
  color: #334155;
  cursor: pointer;
  font-size: 12px;
  font-weight: 650;
}

.sale-history__toggle:hover {
  background: #f8fafc;
}

.sale-history__content {
  display: flex;
  min-width: 0;
  height: 100%;
  max-height: 100%;
  flex-direction: column;
  padding: 16px;
}

.sale-history__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sale-history__header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
}

.sale-history__header-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.sale-history__header-actions :deep(.el-button.is-text) {
  padding-right: 4px;
  padding-left: 6px;
  color: #475569;
}

.sale-history__title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.sale-history__product {
  display: grid;
  gap: 2px;
  margin-top: 6px;
}

.sale-history__product strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sale-history__product span,
.sale-history__hint {
  color: #64748b;
  font-size: 12px;
}

.sale-history__context {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  color: #64748b;
  font-size: 12px;
}

.sale-history__context span + span::before {
  margin-right: 8px;
  content: "·";
}

.sale-history__sort {
  width: 100%;
  margin-top: 10px;
}

.sale-history__list {
  display: grid;
  gap: 8px;
  min-height: 0;
  margin-top: 12px;
  overflow-y: auto;
  padding-right: 3px;
}

.sale-history__entry {
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 11px;
}

.sale-history__entry-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.sale-history__entry-head strong {
  color: #0f172a;
  font-size: 14px;
}

.sale-history__entry-head time {
  color: #64748b;
  font-size: 11px;
}

.sale-history__entry dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  margin: 10px 0 0;
}

.sale-history__entry dl div {
  min-width: 0;
}

.sale-history__entry dt {
  color: #64748b;
  font-size: 10px;
}

.sale-history__entry dd {
  margin: 2px 0 0;
  overflow: hidden;
  color: #334155;
  font-size: 12px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sale-history__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 9px;
  border-top: 1px solid #f1f5f9;
  padding-top: 7px;
  color: #94a3b8;
  font-size: 10px;
}

.sale-history__state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 150px;
  color: #64748b;
  font-size: 13px;
  text-align: center;
}

.sale-history__state--error {
  color: #b91c1c;
}

.sale-history__more {
  width: 100%;
  margin-top: 10px;
}

@media (max-width: 1180px) {
  .sale-history {
    right: 12px;
  }

  .sale-history--open {
    top: 12px;
    width: min(360px, calc(100vw - 24px));
    height: calc(100dvh - 24px);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgb(15 23 42 / 12%);
  }
}
</style>
