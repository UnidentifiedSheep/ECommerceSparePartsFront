<template>
  <el-dialog
    :model-value="modelValue"
    width="min(1080px, calc(100vw - 24px))"
    top="4vh"
    class="price-offers-dialog"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="price-offers-dialog__header">
        <div class="min-w-0">
          <h2>{{ t('priceOffers.title') }}</h2>
          <p>{{ productLabel || t('priceOffers.productFallback', { id: productId }) }}</p>
        </div>
      </div>
    </template>

    <div class="price-offers-dialog__body">
      <section class="price-offers-context">
        <div class="price-offers-context__fields">
          <el-form-item :label="t('common.labels.currency')">
            <el-select
              v-model="selectedCurrencyId"
              :disabled="lockContext"
              :loading="isCurrenciesLoading"
              filterable
              class="w-full"
              :placeholder="t('currencies.selectCurrency')"
            >
              <el-option
                v-for="currency in currencies"
                :key="currency.id"
                :label="currencyLabel(currency)"
                :value="currency.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('common.labels.storage')">
            <el-select
              v-model="selectedStorageName"
              :disabled="lockContext"
              :loading="isStoragesLoading"
              filterable
              class="w-full"
              :placeholder="t('storages.selectStorage')"
            >
              <el-option
                v-for="storage in storages"
                :key="storage.name"
                :label="storage.name"
                :value="storage.name"
              >
                <div class="flex min-w-0 flex-col py-1">
                  <span class="truncate">{{ storage.name }}</span>
                  <span class="truncate text-xs text-slate-500">
                    {{ storage.location || storage.description || t('priceOffers.noStorageDescription') }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item :label="t('priceOffers.source')">
            <el-select
              v-model="selectedSources"
              multiple
              collapse-tags
              collapse-tags-tooltip
              filterable
              class="w-full"
              :placeholder="t('priceOffers.allSources')"
            >
              <el-option
                v-for="source in sourceOptions"
                :key="source"
                :label="sourceLabel(source)"
                :value="source"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-button :icon="Refresh" :loading="isLoading" type="primary" plain @click="reloadOffers">
          {{ t('common.actions.refresh') }}
        </el-button>
      </section>

      <el-alert
        v-if="!canLoadOffers"
        type="info"
        show-icon
        :closable="false"
        :title="t('priceOffers.selectContext')"
      />

      <div v-loading="isLoading" class="price-offers-list">
        <div v-if="offers.length > 0" class="price-offers-table">
          <div class="price-offers-table__header">
            <div></div>
            <HeaderTooltip :short-label="t('priceOffers.supplier')" :full-label="t('priceOffers.supplier')" />
            <HeaderTooltip :short-label="t('priceOffers.purchasePriceShort')" :full-label="t('priceOffers.purchasePrice')" />
            <HeaderTooltip :short-label="t('priceOffers.markupShort')" :full-label="t('priceOffers.markup')" />
            <HeaderTooltip :short-label="t('priceOffers.availableShort')" :full-label="t('priceOffers.available')" />
            <HeaderTooltip :short-label="t('priceOffers.minQuantityShort')" :full-label="t('priceOffers.minQuantity')" />
            <HeaderTooltip :short-label="t('priceOffers.delivery')" :full-label="t('priceOffers.delivery')" />
            <HeaderTooltip :short-label="t('priceOffers.guaranteedShort')" :full-label="t('priceOffers.guaranteedDelivery')" />
            <HeaderTooltip :short-label="t('priceOffers.probabilityShort')" :full-label="t('priceOffers.probability')" />
            <HeaderTooltip :short-label="t('priceOffers.orderTillShort')" :full-label="t('priceOffers.orderTill')" />
            <HeaderTooltip
              class="price-offers-table__right"
              :short-label="t('priceOffers.recommendedShort')"
              :full-label="t('priceOffers.recommended')"
            />
          </div>

          <article
            v-for="(option, index) in offers"
            :key="option.priceOfferId"
            class="price-offer-row"
            :class="{ 'price-offer-row--best': index === 0 }"
          >
            <div class="price-offer-row__rank">
              <span>{{ index + 1 + page * size }}</span>
            </div>

            <div class="price-offer-source">
              <strong>{{ sourceLabel(option.offer.source) }}</strong>
              <span>{{ option.offer.offerForStorage }}</span>
              <em>{{ shortId(option.priceOfferId) }}</em>
            </div>

            <div class="price-offer-cell" :data-label="t('priceOffers.purchasePrice')">
              {{ formatMoney(option.offer.purchasePrice, offerCurrency(option)?.currencySign) }}
            </div>
            <div class="price-offer-cell" :data-label="t('priceOffers.markup')">
              {{ formatPercent(option.markup) }}
            </div>
            <div class="price-offer-cell" :data-label="t('priceOffers.available')">
              {{ option.offer.availableQuantity.toLocaleString(locale) }}
            </div>
            <div class="price-offer-cell" :data-label="t('priceOffers.minQuantity')">
              {{ option.offer.minimumPurchaseQuantity.toLocaleString(locale) }}
            </div>
            <div class="price-offer-cell" :data-label="t('priceOffers.delivery')">
              {{ formatShortDate(option.offer.deliveryDate) }}
            </div>
            <div class="price-offer-cell" :data-label="t('priceOffers.guaranteedDelivery')">
              {{ formatShortDate(option.offer.guaranteedDeliveryDate) }}
            </div>
            <div class="price-offer-cell price-offer-cell--success" :data-label="t('priceOffers.probability')">
              {{ option.deliveryProbability.toLocaleString(locale) }}%
            </div>
            <div class="price-offer-cell" :data-label="t('priceOffers.orderTill')">
              {{ formatShortDateTime(option.offer.orderTill) }}
            </div>
            <div class="price-offer-cell price-offer-cell--recommended" :data-label="t('priceOffers.recommended')">
              {{ formatMoney(option.sellPrice, selectedCurrency?.currencySign) }}
            </div>
          </article>
        </div>

        <el-empty
          v-if="canLoadOffers && !isLoading && offers.length === 0"
          :description="t('priceOffers.empty')"
          :image-size="72"
        />
      </div>
    </div>

    <template #footer>
      <div class="price-offers-footer">
        <ZeroPagination
          v-model:page="page"
          v-model:size="size"
          :has-next="hasNext"
          :sizes="[10, 20, 50]"
        />
        <el-button @click="emit('update:modelValue', false)">{{ t('common.actions.close') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElTooltip } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { PriceOptionModel } from '@/models/priceOfferModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { getPriceOffersForProduct } from '@/services/api/priceOffers.ts'
import { getStorages } from '@/services/api/storages.ts'
import { useI18n } from '@/i18n'

const props = withDefaults(defineProps<{
  modelValue: boolean
  productId: number
  productLabel?: string
  currencyId?: number | null
  storageName?: string | null
  lockContext?: boolean
}>(), {
  productLabel: '',
  currencyId: null,
  storageName: null,
  lockContext: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { locale, t } = useI18n()

const HeaderTooltip = defineComponent({
  props: {
    shortLabel: {
      type: String,
      required: true,
    },
    fullLabel: {
      type: String,
      required: true,
    },
  },
  setup(props, { attrs }) {
    return () => h(ElTooltip, {
      content: props.fullLabel,
      placement: 'top',
      showAfter: 250,
    }, {
      default: () => h('div', {
        ...attrs,
        class: ['price-offers-header-cell', attrs.class],
      }, props.shortLabel),
    })
  },
})

const offers = ref<PriceOptionModel[]>([])
const currencies = ref<CurrencyModel[]>([])
const storages = ref<StorageModel[]>([])
const selectedSources = ref<string[]>([])
const selectedCurrencyId = ref<number>()
const selectedStorageName = ref('')
const page = ref(0)
const size = ref(10)
const hasNext = ref(false)
const isLoading = ref(false)
const isCurrenciesLoading = ref(false)
const isStoragesLoading = ref(false)
let isPreparingContext = false
let requestId = 0

const selectedCurrency = computed(() => currencies.value.find((currency) => currency.id === selectedCurrencyId.value))
const canLoadOffers = computed(() => Boolean(props.productId && selectedCurrencyId.value && selectedStorageName.value))
const sourceOptions = ['OurWarehouse', 'Armtek', 'FavoriteParts']

function currencyLabel(currency: CurrencyModel) {
  return `${currency.name} (${currency.currencySign})`
}

function offerCurrency(option: PriceOptionModel) {
  return currencies.value.find((currency) => currency.id === option.offer.currencyId)
}

function sourceLabel(source: string) {
  return t(`priceOffers.sources.${source}`)
}

function formatNumber(value: number | string, maximumFractionDigits = 2) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return String(value)

  return numericValue.toLocaleString(locale.value, {
    maximumFractionDigits,
  })
}

function formatMoney(value: number | string, sign?: string) {
  return `${formatNumber(value)} ${sign ?? ''}`.trim()
}

function formatPercent(value: number | string) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return String(value)

  return `${(numericValue * 100).toLocaleString(locale.value, {
    maximumFractionDigits: 2,
  })}%`
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(locale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString(locale.value, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(locale.value, {
    day: '2-digit',
    month: 'short',
  })
}

function formatShortDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString(locale.value, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortId(id: string) {
  return id.length > 8 ? `${id.slice(0, 8)}...` : id
}

async function loadDictionaries() {
  await Promise.all([
    loadCurrencies(),
    loadStorages(),
  ])
}

async function loadCurrencies() {
  if (currencies.value.length > 0 || isCurrenciesLoading.value) return

  isCurrenciesLoading.value = true
  try {
    const resp = await getCurrencies()
    currencies.value = resp.currencies
    selectedCurrencyId.value = props.currencyId ?? selectedCurrencyId.value ?? resp.currencies[0]?.id
  } finally {
    isCurrenciesLoading.value = false
  }
}

async function loadStorages() {
  if (storages.value.length > 0 || isStoragesLoading.value) return

  isStoragesLoading.value = true
  try {
    const resp = await getStorages({
      page: 0,
      limit: 100,
    })
    storages.value = resp.storages
    selectedStorageName.value = props.storageName || selectedStorageName.value || resp.storages[0]?.name || ''
  } finally {
    isStoragesLoading.value = false
  }
}

async function reloadOffers() {
  page.value = 0
  await loadOffers()
}

async function prepareContextAndLoadOffers() {
  isPreparingContext = true
  try {
    selectedCurrencyId.value = props.currencyId ?? selectedCurrencyId.value
    selectedStorageName.value = props.storageName ?? selectedStorageName.value
    await loadDictionaries()
  } finally {
    isPreparingContext = false
  }

  await loadOffers()
}

async function loadOffers() {
  if (!canLoadOffers.value) {
    offers.value = []
    hasNext.value = false
    return
  }

  const currentRequestId = ++requestId
  isLoading.value = true
  try {
    const resp = await getPriceOffersForProduct({
      productId: props.productId,
      currencyId: selectedCurrencyId.value!,
      sources: selectedSources.value,
      storageName: selectedStorageName.value,
      page: page.value,
      size: size.value,
      sortBy: 'score_desc',
    })

    if (currentRequestId !== requestId) return
    offers.value = resp.priceOptions
    hasNext.value = resp.priceOptions.length === size.value
  } finally {
    if (currentRequestId === requestId) {
      isLoading.value = false
    }
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) return

    await prepareContextAndLoadOffers()
  },
  { immediate: true },
)

watch(
  () => props.productId,
  async () => {
    if (!props.modelValue) return

    page.value = 0
    await prepareContextAndLoadOffers()
  },
)

watch(
  () => [props.currencyId, props.storageName],
  () => {
    if (props.currencyId) selectedCurrencyId.value = props.currencyId
    if (props.storageName) selectedStorageName.value = props.storageName
  },
)

watch([selectedCurrencyId, selectedStorageName, selectedSources], async () => {
  if (!props.modelValue || isPreparingContext) return
  page.value = 0
  await loadOffers()
})

watch(page, async () => {
  if (!props.modelValue) return
  await loadOffers()
})

watch(size, async () => {
  if (!props.modelValue) return
  page.value = 0
  await loadOffers()
})
</script>

<style>
.price-offers-dialog {
  display: flex;
  max-height: calc(100vh - 8vh);
  flex-direction: column;
}

.price-offers-dialog .el-dialog__body {
  flex: 1;
  max-height: calc(100vh - 360px);
  overflow: auto;
}

.price-offers-dialog .el-dialog__footer {
  flex-shrink: 0;
}
</style>

<style scoped>
.price-offers-dialog__header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 700;
}

.price-offers-dialog__header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

.price-offers-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-offers-context {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px 12px;
}

.price-offers-context__fields {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(170px, 0.9fr) minmax(170px, 0.9fr) minmax(190px, 1fr);
  gap: 12px;
}

.price-offers-context :deep(.el-form-item) {
  margin-bottom: 0;
}

.price-offers-list {
  min-height: 220px;
}

.price-offers-table {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.price-offers-table__header,
.price-offer-row {
  display: grid;
  grid-template-columns:
    34px minmax(116px, 1.35fr) minmax(88px, 0.95fr) 72px 56px 48px
    minmax(72px, 0.8fr) minmax(72px, 0.8fr) 66px minmax(88px, 0.9fr)
    minmax(92px, 0.95fr);
  align-items: center;
  gap: 8px;
}

.price-offers-table__header {
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 9px 12px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
}

.price-offers-table__right {
  text-align: right;
}

.price-offers-header-cell {
  min-width: 0;
  overflow: hidden;
  cursor: help;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-offer-row {
  min-height: 56px;
  border-bottom: 1px solid #eef2f7;
  padding: 8px 12px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.price-offer-row:last-child {
  border-bottom: 0;
}

.price-offer-row--best {
  background: #f7fef9;
}

.price-offer-row__rank span {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.price-offer-row--best .price-offer-row__rank span {
  background: #16a34a;
  color: #ffffff;
}

.price-offer-source {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.price-offer-source strong,
.price-offer-source em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-offer-source span {
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #86efac;
  border-radius: 6px;
  padding: 1px 5px;
  color: #047857;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-offer-source em {
  color: #64748b;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
}

.price-offer-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price-offer-cell--success {
  color: #059669;
}

.price-offer-cell--recommended {
  text-align: right;
  font-size: 15px;
}

.price-offers-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 900px) {
  .price-offers-context,
  .price-offers-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .price-offers-context__fields {
    grid-template-columns: 1fr;
  }

  .price-offers-table__header {
    display: none;
  }

  .price-offer-row {
    grid-template-columns: 28px minmax(0, 1fr);
    align-items: flex-start;
  }

  .price-offer-source,
  .price-offer-cell {
    grid-column: 2;
  }

  .price-offer-cell {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    border-top: 1px solid #eef2f7;
    padding-top: 6px;
  }

  .price-offer-cell::before {
    content: attr(data-label);
    color: #64748b;
    font-weight: 600;
  }

  .price-offer-cell--recommended {
    text-align: left;
  }
}
</style>
