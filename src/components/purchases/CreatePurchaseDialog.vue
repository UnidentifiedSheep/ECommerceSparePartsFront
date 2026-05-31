<template>
  <el-dialog
    v-model="isOpen"
    width="1280"
    top="4vh"
    class="create-purchase-dialog"
    :show-close="false"
  >
    <template #header>
      <div class="dialog-heading">
        <div class="min-w-0">
          <div class="dialog-kicker">Новая закупка</div>
          <h2>Создание закупки</h2>
          <p>Поставщик, склад, валюта и позиции документа заполняются в одном окне.</p>
        </div>
        <el-button :icon="Close" circle text @click="isOpen = false" />
      </div>
    </template>

    <div class="purchase-dialog-body">
      <aside class="purchase-summary">
        <div class="summary-total">
          <span>Итого</span>
          <strong>{{ formatCurrency(createPurchaseTotal, selectedCurrency?.currencySign) }}</strong>
        </div>

        <div class="summary-grid">
          <div>
            <span>Позиций</span>
            <strong>{{ form.items.length }}</strong>
          </div>
          <div>
            <span>Товаров</span>
            <strong>{{ totalItemCount }}</strong>
          </div>
          <div>
            <span>Оплачено</span>
            <strong>{{ formatCurrency(form.payedSum ?? 0, selectedCurrency?.currencySign) }}</strong>
          </div>
          <div>
            <span>Остаток</span>
            <strong>{{ formatCurrency(remainingPayment, selectedCurrency?.currencySign) }}</strong>
          </div>
        </div>

        <div class="summary-steps">
          <div
            v-for="step in completionSteps"
            :key="step.label"
            class="summary-step"
            :class="{ 'summary-step--done': step.done }"
          >
            <el-icon><Check /></el-icon>
            <span>{{ step.label }}</span>
          </div>
        </div>
      </aside>

      <el-form label-position="top" class="purchase-form">
        <section class="purchase-section purchase-section--main">
          <div class="section-header">
            <div>
              <div class="section-title">Параметры</div>
              <div class="section-subtitle">Основные данные документа</div>
            </div>
          </div>

          <div class="form-grid">
            <el-form-item label="Поставщик" class="span-4">
              <UserSelector
                v-model:selected-user="form.supplier"
                :roles="['Supplier']"
                place-holder="Выберите поставщика"
                :clearable="false"
              />
            </el-form-item>

            <el-form-item label="Склад прихода" class="span-4">
              <el-select v-model="form.storageName" filterable class="w-full" placeholder="Выберите склад">
                <el-option
                  v-for="storage in storages"
                  :key="storage.name"
                  :label="storage.name"
                  :value="storage.name"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Дата закупки" class="span-4">
              <el-date-picker
                v-model="form.purchaseDate"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS"
                class="w-full"
              />
            </el-form-item>

            <el-form-item label="Валюта" class="span-3">
              <el-select v-model="form.currencyId" class="w-full" placeholder="Выберите валюту">
                <el-option
                  v-for="currency in currencies"
                  :key="currency.id"
                  :label="`${currency.name} (${currency.currencySign})`"
                  :value="currency.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Оплачено" class="span-3">
              <el-input-number v-model="form.payedSum" :min="0" :precision="2" :controls="false" class="w-full" />
            </el-form-item>

            <el-form-item label="Логистика" class="span-2">
              <div class="flex h-8 items-center">
                <el-switch v-model="form.withLogistics" active-text="Да" inactive-text="Нет" />
              </div>
            </el-form-item>

            <el-form-item v-if="form.withLogistics" label="Склад отправки" class="span-4">
              <el-select v-model="form.storageFrom" filterable clearable class="w-full" placeholder="Выберите склад">
                <el-option
                  v-for="storage in storages"
                  :key="storage.name"
                  :label="storage.name"
                  :value="storage.name"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Комментарий" class="span-12">
              <el-input v-model="form.comment" type="textarea" :rows="2" placeholder="Комментарий к закупке" />
            </el-form-item>
          </div>
        </section>

        <section class="purchase-section">
          <div class="section-header">
            <div>
              <div class="section-title">Позиции</div>
              <div class="section-subtitle">{{ itemsSummary }}</div>
            </div>
            <el-button :icon="Plus" type="primary" @click="productSelectorOpen = true">
              Добавить товар
            </el-button>
          </div>

          <div v-if="form.items.length === 0" class="empty-items">
            <div class="text-base font-semibold text-slate-900">Позиции еще не добавлены</div>
            <div class="mt-1 text-sm text-slate-500">Начните с выбора товара через поиск.</div>
          </div>

          <div v-else class="items-list">
            <article
              v-for="(item, index) in form.items"
              :key="item.product?.id ?? index"
              class="purchase-item"
            >
              <div class="item-product">
                <div class="item-index">{{ index + 1 }}</div>
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-slate-950">{{ item.product?.name }}</div>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span class="sku-pill">{{ item.product?.sku || '—' }}</span>
                  </div>
                  <div v-if="form.withLogistics && item.calculateLogistics" class="item-logistics">
                    <template v-if="isCalculatingLogistics">Расчет логистики...</template>
                    <template v-else-if="item.logisticsSkipped">
                      {{ item.logisticsReasons?.join(', ') || 'Логистика не рассчитана' }}
                    </template>
                    <template v-else-if="item.logisticsCost !== undefined">
                      Логистика: {{ formatCurrency(item.logisticsCost, logisticsCurrencySign) }}
                    </template>
                  </div>
                </div>
              </div>

              <div class="item-controls">
                <label>
                  <span>Кол-во</span>
                  <el-input-number v-model="item.count" :min="1" :precision="0" :controls="false" class="w-full" />
                </label>
                <label>
                  <span>Цена</span>
                  <el-input-number v-model="item.price" :min="0" :precision="2" :controls="false" class="w-full" />
                </label>
                <label>
                  <span>Сумма</span>
                  <div class="item-sum">{{ formatCurrency(item.count * item.price, selectedCurrency?.currencySign) }}</div>
                </label>
              </div>

              <div class="item-comment">
                <el-input v-model="item.comment" placeholder="Комментарий к позиции" />
                <el-checkbox v-model="item.calculateLogistics" :disabled="!form.withLogistics">
                  Считать логистику
                </el-checkbox>
              </div>

              <el-button class="remove-item-button" :icon="Delete" text type="danger" @click="removeItem(index)" />
            </article>
          </div>
        </section>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-total">
          <span>Итоговая сумма</span>
          <strong>{{ formatCurrency(createPurchaseTotal, selectedCurrency?.currencySign) }}</strong>
        </div>
        <div class="footer-actions">
          <el-button size="large" @click="isOpen = false">Отмена</el-button>
          <el-button size="large" type="primary" :disabled="!canSave" :loading="isSaving" @click="save">
            Создать закупку
          </el-button>
        </div>
      </div>
    </template>

    <ProductSelectorDialog v-model="productSelectorOpen" @select="addProduct" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Check, Close, Delete, Plus } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import ProductSelectorDialog from '@/components/selectors/ProductSelectorDialog.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { ProductSearchModel } from '@/models/productSearchModel.ts'
import type { PurchaseModel } from '@/models/purchaseModel.ts'
import type { StorageModel } from '@/models/storageModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import { calculateDeliveryCost } from '@/services/api/logistics.ts'
import { createPurchase } from '@/services/api/purchases.ts'
import { toLocalDateTimeInputValue } from '@/utils/dateTime.ts'

interface CreatePurchaseItemForm {
  product?: ProductSearchModel
  count: number
  price: number
  calculateLogistics: boolean
  comment: string
  logisticsCost?: number
  logisticsSkipped?: boolean
  logisticsReasons?: string[] | null
}

const props = defineProps<{
  currencies: CurrencyModel[]
  storages: StorageModel[]
}>()

const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  created: [purchase: PurchaseModel]
}>()

const productSelectorOpen = ref(false)
const isSaving = ref(false)
const isCalculatingLogistics = ref(false)
const logisticsCurrencyId = ref<number>()
let logisticsRequestId = 0

const form = reactive({
  supplier: undefined as UserModel | undefined,
  currencyId: undefined as number | undefined,
  storageName: undefined as string | undefined,
  purchaseDate: toLocalDateTimeInputValue(new Date()),
  comment: '',
  payedSum: undefined as number | undefined,
  withLogistics: false,
  storageFrom: undefined as string | undefined,
  items: [] as CreatePurchaseItemForm[],
})

const selectedCurrency = computed(() => (
  props.currencies.find((currency) => currency.id === form.currencyId)
))

const logisticsCurrencySign = computed(() => (
  props.currencies.find((currency) => currency.id === logisticsCurrencyId.value)?.currencySign
  ?? selectedCurrency.value?.currencySign
))

const createPurchaseTotal = computed(() => (
  form.items.reduce((sum, item) => sum + item.count * item.price, 0)
))

const totalItemCount = computed(() => (
  form.items.reduce((sum, item) => sum + item.count, 0)
))

const remainingPayment = computed(() => (
  Math.max(createPurchaseTotal.value - (form.payedSum ?? 0), 0)
))

const completionSteps = computed(() => [
  { label: 'Поставщик', done: !!form.supplier },
  { label: 'Склад', done: !!form.storageName },
  { label: 'Валюта', done: !!form.currencyId },
  { label: 'Позиции', done: form.items.length > 0 },
  ...(form.withLogistics ? [{
    label: 'Логистика',
    done: !!form.storageFrom && !isCalculatingLogistics.value && !hasSkippedLogistics.value,
  }] : []),
])

const hasSkippedLogistics = computed(() => (
  form.withLogistics
  && form.items.some((item) => item.calculateLogistics && item.logisticsSkipped)
))

const itemsSummary = computed(() => {
  return form.items.length === 0
    ? 'Добавьте товары в закупку'
    : `${form.items.length} позиций, ${totalItemCount.value} шт.`
})

const canSave = computed(() => (
  !!form.supplier
  && !!form.currencyId
  && !!form.storageName
  && form.purchaseDate !== ''
  && form.items.length > 0
  && form.items.every((item) => item.product && item.count > 0 && item.price >= 0)
  && (!form.withLogistics || !!form.storageFrom)
  && !isCalculatingLogistics.value
  && !hasSkippedLogistics.value
))

function resetForm() {
  form.supplier = undefined
  form.currencyId = props.currencies[0]?.id
  form.storageName = undefined
  form.purchaseDate = toLocalDateTimeInputValue(new Date())
  form.comment = ''
  form.payedSum = undefined
  form.withLogistics = false
  form.storageFrom = undefined
  form.items = []
  clearLogisticsPreview()
}

function addProduct(product: ProductSearchModel) {
  form.items.push({
    product,
    count: 1,
    price: 0,
    calculateLogistics: form.withLogistics,
    comment: '',
  })
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function formatCurrency(value: number, sign?: string) {
  return `${value.toLocaleString('ru-RU')} ${sign ?? ''}`.trim()
}

function clearLogisticsPreview() {
  logisticsCurrencyId.value = undefined
  form.items.forEach((item) => {
    item.logisticsCost = undefined
    item.logisticsSkipped = undefined
    item.logisticsReasons = undefined
  })
}

const recalculateLogistics = useDebounceFn(async () => {
  const requestId = ++logisticsRequestId
  const itemsToCalculate = form.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.calculateLogistics && item.product && item.count > 0)

  form.items.forEach((item) => {
    if (!item.calculateLogistics) {
      item.logisticsCost = undefined
      item.logisticsSkipped = undefined
      item.logisticsReasons = undefined
    }
  })

  if (!form.withLogistics || !form.storageFrom || !form.storageName || itemsToCalculate.length === 0) {
    clearLogisticsPreview()
    return
  }

  isCalculatingLogistics.value = true
  try {
    const resp = await calculateDeliveryCost({
      storageFrom: form.storageFrom,
      storageTo: form.storageName,
      mode: 'Soft',
      items: itemsToCalculate.map(({ item }) => ({
        productId: item.product!.id,
        quantity: item.count,
      })),
    })

    if (requestId !== logisticsRequestId) return

    logisticsCurrencyId.value = resp.deliveryCost.currencyId
    itemsToCalculate.forEach(({ item }, index) => {
      const logisticsItem = resp.deliveryCost.items[index]
      item.logisticsCost = logisticsItem?.count ?? 0
      item.logisticsSkipped = logisticsItem?.skipped ?? true
      item.logisticsReasons = logisticsItem?.reasons ?? null
    })
  } finally {
    if (requestId === logisticsRequestId) {
      isCalculatingLogistics.value = false
    }
  }
}, 350)

async function save() {
  if (!canSave.value || !form.supplier || !form.currencyId || !form.storageName) return

  isSaving.value = true
  try {
    const resp = await createPurchase({
      supplierId: form.supplier.id,
      currencyId: form.currencyId,
      storageName: form.storageName,
      purchaseDate: form.purchaseDate,
      purchaseContent: form.items.map((item) => ({
        productId: item.product!.id,
        count: item.count,
        price: item.price,
        calculateLogistics: form.withLogistics && item.calculateLogistics,
        comment: item.comment.trim() || null,
      })),
      withLogistics: form.withLogistics,
      comment: form.comment.trim() || null,
      payedSum: form.payedSum ?? null,
      storageFrom: form.withLogistics ? form.storageFrom ?? null : null,
    })

    ElNotification({
      title: 'Успех',
      message: 'Закупка создана',
      type: 'success',
    })

    isOpen.value = false
    emit('created', resp.purchase)
  } finally {
    isSaving.value = false
  }
}

watch(isOpen, (open) => {
  if (open) resetForm()
})

watch(() => form.withLogistics, (enabled) => {
  if (!enabled) {
    form.storageFrom = undefined
    form.items.forEach((item) => {
      item.calculateLogistics = false
    })
    clearLogisticsPreview()
  }
})

watch(
  () => ({
    withLogistics: form.withLogistics,
    storageFrom: form.storageFrom,
    storageName: form.storageName,
    items: form.items.map((item) => ({
      productId: item.product?.id,
      count: item.count,
      calculateLogistics: item.calculateLogistics,
    })),
  }),
  () => recalculateLogistics(),
  { deep: true },
)
</script>

<style scoped>
.dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.dialog-kicker {
  margin-bottom: 4px;
  color: #002fa7;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.dialog-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
  font-weight: 750;
  line-height: 1.15;
}

.dialog-heading p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.purchase-dialog-body {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 20px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  border-top: 1px solid rgb(226 232 240);
  border-bottom: 1px solid rgb(226 232 240);
  background:
    linear-gradient(90deg, rgba(0, 47, 167, 0.045) 0 1px, transparent 1px 100%),
    linear-gradient(180deg, rgba(0, 47, 167, 0.035) 0 1px, transparent 1px 100%),
    #f7f7f8;
  background-size: 28px 28px;
  padding: 24px;
}

.purchase-summary {
  position: sticky;
  top: 0;
  align-self: start;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
}

.summary-total {
  border-bottom: 1px solid #e2e8f0;
  padding: 18px;
}

.summary-total span,
.summary-grid span,
.footer-total span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.summary-total strong {
  display: block;
  margin-top: 6px;
  color: #002fa7;
  font-size: 24px;
  line-height: 1.1;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-bottom: 1px solid #e2e8f0;
}

.summary-grid div {
  min-width: 0;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 12px;
}

.summary-grid div:nth-child(2n) {
  border-right: 0;
}

.summary-grid div:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.summary-grid strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 750;
}

.summary-steps {
  display: grid;
  gap: 8px;
  padding: 14px;
}

.summary-step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 650;
}

.summary-step .el-icon {
  width: 18px;
  height: 18px;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  color: transparent;
}

.summary-step--done {
  color: #0f172a;
}

.summary-step--done .el-icon {
  border-color: #002fa7;
  background: #002fa7;
  color: #ffffff;
}

.purchase-form {
  display: grid;
  gap: 16px;
  min-width: 0;
  max-width: 100%;
}

.purchase-section {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: white;
  padding: 20px;
}

.purchase-section--main {
  border-top: 3px solid #002fa7;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-title {
  color: rgb(15 23 42);
  font-size: 16px;
  font-weight: 700;
}

.section-subtitle {
  margin-top: 2px;
  color: rgb(100 116 139);
  font-size: 13px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  min-width: 0;
}

.form-grid :deep(.el-form-item) {
  min-width: 0;
}

.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: span 3;
}

.span-4 {
  grid-column: span 4;
}

.span-12 {
  grid-column: span 12;
}

.empty-items {
  border: 1px dashed rgb(203 213 225);
  border-radius: 8px;
  background: rgb(248 250 252);
  padding: 36px;
  text-align: center;
}

.items-list {
  display: grid;
  gap: 10px;
}

.purchase-item {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(390px, 430px) minmax(220px, 260px) 28px;
  align-items: start;
  gap: 12px;
  min-width: 0;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  padding: 14px;
}

.purchase-item:hover {
  border-color: #93c5fd;
}

.item-product {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  min-width: 0;
}

.item-index {
  display: flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  color: #334155;
  font-size: 12px;
  font-weight: 750;
}

.sku-pill {
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #f8fafc;
  padding: 2px 8px;
  color: #475569;
  font-weight: 650;
  text-overflow: ellipsis;
}

.item-controls {
  display: grid;
  grid-template-columns: minmax(74px, 0.75fr) minmax(118px, 1fr) minmax(128px, 1fr);
  gap: 10px;
  min-width: 0;
}

.item-controls label {
  display: block;
  min-width: 0;
}

.item-controls :deep(.el-input-number) {
  width: 100%;
  min-width: 0;
}

.item-controls :deep(.el-input) {
  min-width: 0;
}

.item-controls :deep(.el-input__wrapper) {
  padding: 0 8px;
}

.item-controls :deep(.el-input__inner) {
  text-align: right;
}

.item-controls span {
  display: block;
  margin-bottom: 5px;
  color: rgb(100 116 139);
  font-size: 12px;
  font-weight: 600;
}

.item-sum {
  display: flex;
  min-height: 32px;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  border-radius: 6px;
  background: rgb(248 250 252);
  padding: 0 10px;
  color: rgb(15 23 42);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.item-logistics {
  margin-top: 8px;
  color: #475569;
  font-size: 12px;
  line-height: 1.3;
}

.remove-item-button {
  justify-self: end;
}

.item-comment {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.item-comment :deep(.el-input) {
  min-width: 0;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
}

.footer-total strong {
  display: block;
  margin-top: 2px;
  color: #0f172a;
  font-size: 18px;
  line-height: 1.2;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

:deep(.create-purchase-dialog .el-dialog__header) {
  padding: 26px 36px 22px;
}

:deep(.create-purchase-dialog .el-dialog__body) {
  max-height: min(760px, calc(100vh - 178px));
  overflow-y: auto;
  padding: 0;
}

:deep(.create-purchase-dialog .el-dialog__footer) {
  padding: 22px 36px 28px;
}

@media (max-width: 1180px) {
  .purchase-dialog-body {
    grid-template-columns: 1fr;
  }

  .purchase-summary {
    position: static;
  }

  .purchase-item {
    grid-template-columns: minmax(0, 1fr);
  }

  .item-controls {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .span-2,
  .span-3,
  .span-4,
  .span-12 {
    grid-column: 1;
  }

  .item-controls {
    grid-template-columns: 1fr;
  }

  .dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .footer-actions {
    justify-content: flex-end;
  }
}
</style>
