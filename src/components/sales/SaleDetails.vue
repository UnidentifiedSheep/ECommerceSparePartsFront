<template>
  <div class="sale-details">
    <template v-if="sale">
      <header class="details-header">
        <div>
          <h2>Состав продажи</h2>
          <p>{{ sale.buyer.surname }} {{ sale.buyer.name }} · {{ formatDate(sale.saleDatetime) }}</p>
        </div>
        <strong>{{ formatCurrency(sale.totalSum, sale.currency.currencySign) }}</strong>
      </header>

      <section v-if="sale.comment" class="details-comment">
        {{ sale.comment }}
      </section>

      <section class="content-section">
        <div class="content-title">Позиции</div>
        <div v-loading="loading" class="content-list">
          <article v-for="row in content" :key="row.id" class="content-row">
            <div class="product-cell">
              <strong>{{ row.product.name || 'Без названия' }}</strong>
              <span>{{ row.product.sku || 'Артикул не указан' }}</span>
              <small v-if="row.product.producerName">{{ row.product.producerName }}</small>
            </div>

            <div class="amount-cell">
              <span>Кол-во</span>
              <strong>{{ row.count.toLocaleString('ru-RU') }}</strong>
            </div>

            <div class="amount-cell">
              <span>Цена</span>
              <strong>{{ formatCurrency(row.price, sale.currency.currencySign) }}</strong>
            </div>

            <div class="amount-cell">
              <span>Скидка</span>
              <strong>{{ formatPercent(row.discount) }}</strong>
            </div>

            <div class="amount-cell">
              <span>Сумма</span>
              <strong>{{ formatCurrency(row.totalSum, sale.currency.currencySign) }}</strong>
            </div>

            <div v-if="row.comment" class="row-comment">
              {{ row.comment }}
            </div>

            <el-collapse v-if="row.details.length > 0" class="row-details">
              <el-collapse-item title="Партии списания" :name="row.id">
                <div class="details-table">
                  <div class="details-table-head">
                    <el-tooltip content="Валюта партии закупки" placement="top">
                      <span>Валюта</span>
                    </el-tooltip>
                    <el-tooltip content="Взятое количество из закупки" placement="top">
                      <span>Кол-во</span>
                    </el-tooltip>
                    <el-tooltip content="Дата закупки" placement="top">
                      <span>Дата</span>
                    </el-tooltip>
                    <el-tooltip content="Цена закупки" placement="top">
                      <span>Цена</span>
                    </el-tooltip>
                  </div>

                  <div v-for="detail in row.details" :key="detail.id" class="detail-row">
                    <strong>{{ detail.currency.name }} ({{ detail.currency.currencySign }})</strong>
                    <strong>{{ detail.count.toLocaleString('ru-RU') }} шт.</strong>
                    <strong>{{ formatDate(detail.purchaseDatetime) }}</strong>
                    <strong>{{ formatCurrency(detail.buyPrice, detail.currency.currencySign) }}</strong>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </article>

          <el-empty v-if="!loading && content.length === 0" description="Позиции не найдены" />
        </div>
      </section>
    </template>

    <template v-else>
      <el-empty description="Выберите продажу слева, чтобы увидеть содержимое" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SaleContentModel, SaleModel } from '@/models/saleModel.ts'
import { formatLocalDateTime } from '@/utils/dateTime.ts'

defineProps<{
  sale?: SaleModel
  content: SaleContentModel[]
  loading: boolean
}>()

function formatDate(value?: string | null) {
  return formatLocalDateTime(value, 'Нет данных')
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString('ru-RU')} ${sign ?? ''}`.trim()
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}%`
}
</script>

<style scoped>
.sale-details {
  height: 760px;
  overflow: auto;
  padding: 16px;
}

.details-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 14px;
}

.details-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 750;
}

.details-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.details-header strong {
  color: #047857;
  font-size: 18px;
  white-space: nowrap;
}

.details-comment,
.content-section {
  margin-top: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
}

.details-comment {
  color: #334155;
  font-size: 13px;
}

.content-title {
  margin-bottom: 12px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 750;
}

.content-list {
  display: grid;
  gap: 10px;
}

.content-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 70px 100px 82px 110px;
  align-items: start;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.product-cell {
  min-width: 0;
}

.product-cell strong,
.product-cell span,
.product-cell small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-cell strong {
  color: #0f172a;
  font-size: 14px;
}

.product-cell span,
.product-cell small {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.amount-cell span,
.details-table-head span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.amount-cell strong,
.detail-row strong {
  display: block;
  overflow: hidden;
  margin-top: 4px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-details,
.row-comment {
  grid-column: 1 / -1;
}

.row-comment {
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
  color: #475569;
  font-size: 13px;
}

.row-details {
  --el-collapse-border-color: transparent;
  --el-collapse-header-height: 32px;
  border-top: 1px solid #e2e8f0;
  padding-top: 4px;
}

.row-details :deep(.el-collapse-item__header) {
  color: #334155;
  font-size: 13px;
  font-weight: 650;
}

.row-details :deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

.details-table {
  display: grid;
  gap: 6px;
}

.details-table-head,
.detail-row {
  display: grid;
  grid-template-columns: minmax(150px, 1.1fr) minmax(76px, 0.55fr) minmax(150px, 1fr) minmax(86px, 0.65fr);
  gap: 10px;
  align-items: start;
}

.details-table-head {
  padding: 0 10px;
}

.details-table-head span {
  cursor: help;
}

.detail-row {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 9px 10px;
}

.detail-row strong {
  margin-top: 0;
}

@media (max-width: 760px) {
  .sale-details {
    height: auto;
    min-height: 420px;
    padding: 14px;
  }

  .details-header {
    align-items: stretch;
    flex-direction: column;
  }

  .content-row,
  .details-table-head,
  .detail-row {
    grid-template-columns: 1fr;
  }

  .details-table-head {
    display: none;
  }

  .detail-row strong::before {
    display: block;
    margin-bottom: 2px;
    color: #64748b;
    font-size: 12px;
    font-weight: 650;
  }

  .detail-row strong:nth-child(1)::before {
    content: 'Валюта';
  }

  .detail-row strong:nth-child(2)::before {
    content: 'Кол-во';
  }

  .detail-row strong:nth-child(3)::before {
    content: 'Дата';
  }

  .detail-row strong:nth-child(4)::before {
    content: 'Цена';
  }
}
</style>
