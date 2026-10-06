<template>
  <div class="sale-details">
    <template v-if="sale">
      <header class="details-header">
        <h2>{{ t('sales.detailsTitle') }}</h2>
        <span>{{ t('sales.positions') }}: {{ content.length }}</span>
      </header>

      <div class="details-scroll">
        <div class="content-columns" aria-hidden="true">
          <span></span>
          <span>{{ t('common.labels.count') }}</span>
          <span>{{ t('common.labels.price') }}</span>
          <span>{{ t('sales.discount') }}</span>
          <span>{{ t('sales.amount') }}</span>
        </div>
        <div v-loading="loading" class="content-list">
          <article v-for="row in content" :key="row.id" class="content-row">
            <div class="product-cell" :title="[row.product.sku, row.product.producerName, row.product.name, row.comment].filter(Boolean).join(' · ')">
              <div class="product-heading">
                <RouterLink v-if="row.product.id" :to="{ name: 'product-details', params: { id: row.product.id } }" class="product-link">
                  {{ row.product.sku || row.product.name || t('sales.unnamed') }}<span v-if="row.product.producerName"> • {{ row.product.producerName }}</span>
                </RouterLink>
                <strong v-else class="product-link">
                  {{ row.product.sku || row.product.name || t('sales.unnamed') }}<span v-if="row.product.producerName"> • {{ row.product.producerName }}</span>
                </strong>
              </div>
              <span v-if="row.product.name && row.product.name !== row.product.sku" class="product-meta">{{ row.product.name }}</span>
            </div>
            <span class="content-value content-value--count">{{ row.count.toLocaleString(locale) }}</span>
            <span class="content-value" :title="formatCurrency(row.price, sale.currency.currencySign)">{{ formatCurrency(row.price, sale.currency.currencySign) }}</span>
            <span class="content-value">{{ formatPercent(row.discount) }}</span>
            <strong class="content-value content-value--total" :title="formatCurrency(row.totalSum, sale.currency.currencySign)">{{ formatCurrency(row.totalSum, sale.currency.currencySign) }}</strong>
          </article>
          <el-empty v-if="!loading && content.length === 0" :description="t('sales.notFound')" />
        </div>
      </div>
    </template>

    <div v-else class="sale-details-empty">
      <h2>{{ t('sales.detailsTitle') }}</h2>
      <p>{{ t('sales.selectToView') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SaleContentModel, SaleModel } from '@/models/saleModel.ts'
import { useI18n } from '@/i18n'

const { locale, t } = useI18n()

defineProps<{
  sale?: SaleModel
  content: SaleContentModel[]
  loading: boolean
}>()

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString(locale.value)} ${sign ?? ''}`.trim()
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString(locale.value, { maximumFractionDigits: 2 })}%`
}
</script>

<style scoped>
.sale-details {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.details-header {
  flex: none;
  padding: 14px 14px 10px;
}

.details-header h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}

.details-header span {
  display: block;
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.details-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.content-columns,
.content-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(44px, 8%) minmax(64px, 14%) minmax(54px, 11%) minmax(78px, 16%);
  gap: 5px;
  align-items: center;
  padding-right: 12px;
  padding-left: 12px;
}

.content-columns {
  position: sticky;
  z-index: 1;
  top: 0;
  min-height: 32px;
  background: var(--app-surface-muted, #f7f9fa);
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.content-columns span:not(:first-child) { text-align: right; }
.content-columns span:nth-child(2) { text-align: center; }

.content-row {
  min-height: 66px;
  border-bottom: 1px solid var(--app-border);
  padding-top: 9px;
  padding-bottom: 9px;
}

.content-row:last-child { border-bottom: 0; }
.product-cell { min-width: 0; }

.product-heading {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-link {
  color: var(--app-text);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  text-decoration: none;
}

a.product-link:hover { color: var(--app-primary); text-decoration: underline; }

.product-meta {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 3px;
  color: #475569;
  font-size: 12px;
  line-height: 1.3;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.content-value {
  min-width: 0;
  overflow: hidden;
  color: var(--app-text);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-value--count { text-align: center; }
.content-value--total { font-weight: 700; }

.sale-details-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.sale-details-empty h2 { margin: 0; color: var(--app-text); font-size: 16px; }
.sale-details-empty p { margin: 7px 0 0; color: var(--app-text-muted); font-size: 13px; }
</style>
