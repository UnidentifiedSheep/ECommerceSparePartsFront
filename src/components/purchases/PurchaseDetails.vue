<template>
  <div class="purchase-details">
    <template v-if="purchase">
      <header class="details-header">
        <div>
          <h2>Состав закупки</h2>
          <p>{{ purchase.supplier.surname }} {{ purchase.supplier.name }} · {{ formatDate(purchase.purchaseDatetime) }}</p>
        </div>
        <strong>{{ formatCurrency(purchase.totalSum, purchase.currency.currencySign) }}</strong>
      </header>

      <section v-if="purchase.comment" class="details-comment">
        {{ purchase.comment }}
      </section>

      <el-collapse v-if="purchase.logistics" class="logistics-summary">
        <el-collapse-item name="purchase-logistics">
          <template #title>
            <div class="summary-collapse-title">
              <span>Логистика</span>
              <strong>{{ pricingTypeToText(purchase.logistics.pricingModel) }}</strong>
            </div>
          </template>

          <div class="summary-grid">
            <div>
              <span>Тип маршрута</span>
              <strong>{{ routeTypeToText(purchase.logistics.routeType) }}</strong>
            </div>
            <div>
              <span>Тарификация</span>
              <strong>{{ pricingTypeToText(purchase.logistics.pricingModel) }}</strong>
            </div>
            <div>
              <span>За кг</span>
              <strong>{{ formatCurrency(purchase.logistics.priceKg, purchase.logistics.currency.currencySign) }}</strong>
            </div>
            <div>
              <span>За м³</span>
              <strong>{{ formatCurrency(purchase.logistics.pricePerM3, purchase.logistics.currency.currencySign) }}</strong>
            </div>
            <div>
              <span>За заказ</span>
              <strong>{{ formatCurrency(purchase.logistics.pricePerOrder, purchase.logistics.currency.currencySign) }}</strong>
            </div>
            <div>
              <span>Мин. цена</span>
              <strong>{{ purchase.logistics.minimumPrice ? formatCurrency(purchase.logistics.minimumPrice, purchase.logistics.currency.currencySign) : 'Не задана' }}</strong>
            </div>
          </div>
          <el-tag v-if="purchase.logistics.minimumPriceApplied" class="mt-3" type="warning" effect="light">
            Применена минимальная цена
          </el-tag>
        </el-collapse-item>
      </el-collapse>

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
              <strong>{{ formatCurrency(row.price, purchase.currency.currencySign) }}</strong>
            </div>

            <div class="amount-cell">
              <span>Сумма</span>
              <strong>{{ formatCurrency(row.totalSum, purchase.currency.currencySign) }}</strong>
            </div>

            <div v-if="row.comment" class="row-comment">
              {{ row.comment }}
            </div>

            <el-collapse v-if="row.logistics" class="row-logistics">
              <el-collapse-item title="Логистика" :name="row.id">
                <div class="logistics-row-grid">
                  <div>
                    <span>Стоимость</span>
                    <strong>{{ formatCurrency(row.logistics.price, purchase.logistics?.currency.currencySign) }}</strong>
                  </div>
                  <div>
                    <span>Вес</span>
                    <strong>{{ row.logistics.weightKg.toLocaleString('ru-RU') }} кг</strong>
                  </div>
                  <div>
                    <span>Объем</span>
                    <strong>{{ row.logistics.areaM3.toLocaleString('ru-RU') }} м³</strong>
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
      <el-empty description="Выберите закупку слева, чтобы увидеть содержимое" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PurchaseContentModel, PurchaseModel } from '@/models/purchaseModel.ts'
import { pricingTypeToText } from '@/enums/logisticPricingType.ts'
import { routeTypeToText } from '@/enums/routeType.ts'
import { formatLocalDateTime } from '@/utils/dateTime.ts'

defineProps<{
  purchase?: PurchaseModel
  content: PurchaseContentModel[]
  loading: boolean
}>()

function formatDate(value?: string | null) {
  return formatLocalDateTime(value, 'Нет данных')
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString('ru-RU')} ${sign ?? ''}`.trim()
}
</script>

<style scoped>
.purchase-details {
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
  color: #002fa7;
  font-size: 18px;
  white-space: nowrap;
}

.details-comment,
.logistics-summary,
.content-section {
  margin-top: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
}

.logistics-summary {
  --el-collapse-border-color: transparent;
  --el-collapse-header-height: 32px;
}

.logistics-summary :deep(.el-collapse-item__header) {
  color: #0f172a;
  font-size: 15px;
  font-weight: 750;
}

.logistics-summary :deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

.summary-collapse-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding-right: 12px;
}

.summary-collapse-title strong {
  color: #64748b;
  font-size: 13px;
  font-weight: 650;
}

.details-comment {
  color: #334155;
  font-size: 13px;
}

.summary-title,
.content-title {
  margin-bottom: 12px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 750;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.summary-grid div {
  min-width: 0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 10px;
}

.summary-grid div:nth-child(3n) {
  border-right: 0;
}

.summary-grid div:nth-last-child(-n + 3) {
  border-bottom: 0;
}

.summary-grid span,
.amount-cell span,
.row-logistics span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.summary-grid strong,
.amount-cell strong,
.row-logistics strong {
  display: block;
  overflow: hidden;
  margin-top: 4px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-list {
  display: grid;
  gap: 10px;
}

.content-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 70px 100px 110px;
  gap: 12px;
  align-items: start;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.product-cell {
  min-width: 0;
}

.product-cell strong,
.product-cell span,
.product-cell small,
.row-logistics small {
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
.product-cell small,
.row-logistics small {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
}

.row-logistics,
.row-comment {
  grid-column: 1 / -1;
}

.row-comment {
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
  color: #475569;
  font-size: 13px;
}

.row-logistics {
  --el-collapse-border-color: transparent;
  --el-collapse-header-height: 32px;
  border-top: 1px solid #e2e8f0;
  padding-top: 4px;
}

.row-logistics :deep(.el-collapse-item__header) {
  color: #334155;
  font-size: 13px;
  font-weight: 650;
}

.row-logistics :deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

.logistics-row-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.logistics-row-grid div {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
}

.logistics-row-grid span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.logistics-row-grid strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 750;
}

@media (max-width: 760px) {
  .summary-grid,
  .content-row {
    grid-template-columns: 1fr;
  }
}
</style>
