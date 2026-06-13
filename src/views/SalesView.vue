<template>
  <div class="sales-page">
    <div class="sales-header">
      <div>
        <h1>Продажи</h1>
        <p>Создание продаж со списанием товара со склада и фиксацией оплаты покупателя.</p>
      </div>
      <el-button v-if="canCreateSales" type="primary" size="large" @click="createSaleDialogOpen = true">
        Создать продажу
      </el-button>
    </div>

    <div class="sales-content">
      <section class="sales-panel">
        <div class="panel-heading">
          <div>
            <h2>Новая продажа</h2>
            <p>Выберите покупателя, склад списания, валюту и товары. Если продажа затронет резервации, система запросит подтверждение.</p>
          </div>
        </div>

        <div class="workflow-grid">
          <div>
            <span>1</span>
            <strong>Покупатель и склад</strong>
            <p>Продажа списывает товар с выбранного склада и создает операцию на покупателя.</p>
          </div>
          <div>
            <span>2</span>
            <strong>Цены и скидки</strong>
            <p>Для каждой позиции указывается базовая цена и цена со скидкой.</p>
          </div>
          <div>
            <span>3</span>
            <strong>Подтверждение</strong>
            <p>Если есть резервации по товарам, перед созданием появится отдельное подтверждение.</p>
          </div>
        </div>
      </section>

      <section v-if="lastCreatedSale" class="sales-panel last-sale-panel">
        <div class="panel-heading">
          <div>
            <h2>Последняя созданная продажа</h2>
            <p>{{ formatDate(lastCreatedSale.saleDatetime) }}</p>
          </div>
          <strong>{{ formatCurrency(lastCreatedSale.totalSum, lastCreatedSale.currency.currencySign) }}</strong>
        </div>

        <dl class="sale-summary-list">
          <div>
            <dt>Покупатель</dt>
            <dd>{{ lastCreatedSale.buyer.surname }} {{ lastCreatedSale.buyer.name }}</dd>
          </div>
          <div>
            <dt>Склад</dt>
            <dd>{{ lastCreatedSale.storage }}</dd>
          </div>
          <div v-if="lastCreatedSale.comment">
            <dt>Комментарий</dt>
            <dd>{{ lastCreatedSale.comment }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <CreateSaleDialog
      v-model="createSaleDialogOpen"
      :currencies="currencies"
      @created="onSaleCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import CreateSaleDialog from '@/components/sales/CreateSaleDialog.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { SaleModel } from '@/models/saleModel.ts'
import { getCurrencies } from '@/services/api/currencies.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { formatLocalDateTime } from '@/utils/dateTime.ts'

const { hasPermission } = usePermissions()
const canCreateSales = computed(() => hasPermission('SALES_CREATE'))
const createSaleDialogOpen = ref(false)
const currencies = ref<CurrencyModel[]>([])
const lastCreatedSale = ref<SaleModel>()

function formatDate(value?: string | null) {
  return formatLocalDateTime(value, 'Нет данных')
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString('ru-RU')} ${sign ?? ''}`.trim()
}

async function loadCurrencies() {
  try {
    const resp = await getCurrencies({ page: 0, size: 100 })
    currencies.value = resp.currencies
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось загрузить валюты')
  }
}

function onSaleCreated(sale: SaleModel) {
  lastCreatedSale.value = sale
}

onMounted(loadCurrencies)
</script>

<style scoped src="@/assets/sales-view.css"></style>
