<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ t('currencies.title') }}</h1>
        <p class="text-sm text-slate-500">{{ t('currencies.description') }}</p>
      </div>
    </div>

    <div class="grid items-start gap-4 p-4 xl:grid-cols-[minmax(420px,48%)_minmax(0,52%)]">
      <el-card shadow="hover" class="min-w-0">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-slate-900">{{ t('currencies.listTitle') }}</h2>
              <p class="text-sm text-slate-500">{{ t('currencies.sourceHint') }}</p>
            </div>
            <div class="flex min-w-0 flex-1 justify-end gap-2">
              <el-input
                v-model="searchTerm"
                clearable
                :placeholder="t('currencies.searchPlaceholder')"
                class="max-w-xs"
              />
              <el-button
                v-if="canCreateCurrencies"
                :icon="Refresh"
                :loading="isUpdatingRates"
                plain
                @click="submitUpdateRates"
              >
                {{ t('currencies.updateRates') }}
              </el-button>
              <el-button v-if="canCreateCurrencies" :icon="Plus" type="primary" @click="openCreateDialog">
                {{ t('common.actions.create') }}
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          v-loading="isLoading"
          :data="filteredCurrencies"
          stripe
          highlight-current-row
          row-key="id"
          :current-row-key="selectedCurrency?.id"
          class="currencies-table"
          @row-click="selectCurrency"
        >
          <el-table-column prop="name" :label="t('common.labels.name')" min-width="220" />
          <el-table-column prop="shortName" :label="t('common.labels.shortName')" min-width="160" />
          <el-table-column prop="code" :label="t('common.labels.code')" min-width="120" />
          <el-table-column prop="currencySign" :label="t('common.labels.symbol')" min-width="120" />
        </el-table>

      </el-card>

      <section class="min-h-[420px] min-w-0 rounded-md border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">{{ t('currencies.historyTitle') }}</h2>
            <p class="text-sm text-slate-500">
              {{ selectedCurrency ? selectedCurrency.name : t('currencies.selectCurrencyInList') }}
            </p>
          </div>
          <el-tag v-if="selectedCurrency" effect="plain">
            {{ selectedCurrency.code }}
          </el-tag>
        </div>
        <div class="p-4">
          <el-table
            v-if="selectedCurrency"
            v-loading="isHistoryLoading"
            :data="currencyHistory"
            :empty-text="t('currencies.emptyHistory')"
            class="currency-history-table"
          >
            <el-table-column :label="t('common.labels.pair')" min-width="180">
              <template #default="{ row }">
                <span class="font-medium text-slate-800">{{ currencyPairLabel(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.labels.before')" min-width="130">
              <template #default="{ row }">
                <span class="tabular-nums text-slate-600">{{ formatRate(row.prevRate) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.labels.after')" min-width="130">
              <template #default="{ row }">
                <span class="tabular-nums text-slate-900">{{ formatRate(row.newRate) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.labels.change')" min-width="130">
              <template #default="{ row }">
                <span :class="rateDeltaClass(row)">
                  {{ formatRateDelta(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="t('common.labels.date')" min-width="170">
              <template #default="{ row }">
                <span class="text-slate-600">{{ formatDate(row.createdAt) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else :description="t('currencies.selectCurrency')" />
        </div>

        <div v-if="selectedCurrency" class="border-t border-slate-200 px-4 py-3">
          <ZeroPagination v-model:page="historyPage" v-model:size="historyLimit" :has-next="historyHasNext" />
        </div>
      </section>
    </div>

    <el-dialog v-model="createDialogOpen" :title="t('currencies.createTitle')" width="480">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <el-form-item :label="t('common.labels.name')" prop="name">
          <el-input v-model="createForm.name" :placeholder="t('currencies.namePlaceholder')" />
        </el-form-item>

        <el-form-item :label="t('common.labels.shortName')" prop="shortName">
          <el-input v-model="createForm.shortName" :placeholder="t('currencies.shortNamePlaceholder')" />
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item :label="t('common.labels.code')" prop="code">
            <el-input v-model="createForm.code" placeholder="RUB" />
          </el-form-item>

          <el-form-item :label="t('common.labels.symbol')" prop="currencySign">
            <el-input v-model="createForm.currencySign" placeholder="₽" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="createDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="isCreating" @click="submitCreate">{{ t('common.actions.create') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElNotification, type FormInstance, type FormRules } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import {
  createCurrency,
  getCurrencies,
  getCurrencyHistory,
  updateCurrencyRates,
  type CreateCurrencyRequest,
  type CurrencyRateHistoryModel,
} from '@/services/api/currencies.ts'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useI18n } from '@/i18n'

const { locale, t } = useI18n()
const currencies = ref<CurrencyModel[]>([])
const currencyHistory = ref<CurrencyRateHistoryModel[]>([])
const selectedCurrency = ref<CurrencyModel>()
const searchTerm = ref('')
const historyPage = ref(0)
const historyLimit = ref(20)
const historyHasNext = ref(false)
const isLoading = ref(false)
const isHistoryLoading = ref(false)
const isCreating = ref(false)
const isUpdatingRates = ref(false)
const createDialogOpen = ref(false)
const createFormRef = ref<FormInstance>()
const { hasPermission } = usePermissions()
const canCreateCurrencies = computed(() => hasPermission('CURRENCIES_CREATE'))

const createForm = reactive<CreateCurrencyRequest>({
  name: '',
  shortName: '',
  code: '',
  currencySign: '',
})

const createRules = computed<FormRules<CreateCurrencyRequest>>(() => ({
  name: [
    { required: true, message: t('currencies.validation.nameRequired'), trigger: 'blur' },
    { min: 3, max: 128, message: t('currencies.validation.nameLength'), trigger: 'blur' },
  ],
  shortName: [
    { required: true, message: t('currencies.validation.shortNameRequired'), trigger: 'blur' },
    { min: 2, max: 5, message: t('currencies.validation.shortNameLength'), trigger: 'blur' },
  ],
  code: [
    { required: true, message: t('currencies.validation.codeRequired'), trigger: 'blur' },
    { min: 2, max: 26, message: t('currencies.validation.codeLength'), trigger: 'blur' },
  ],
  currencySign: [
    { required: true, message: t('currencies.validation.signRequired'), trigger: 'blur' },
    { min: 1, max: 3, message: t('currencies.validation.signLength'), trigger: 'blur' },
  ],
}))

const filteredCurrencies = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return currencies.value

  return currencies.value.filter((currency) => {
    return [currency.name, currency.shortName, currency.code, currency.currencySign]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  })
})

async function loadCurrencies() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const resp = await getCurrencies()

    currencies.value = resp.currencies
    if (!selectedCurrency.value && resp.currencies.length > 0) {
      await selectCurrency(resp.currencies[0] as CurrencyModel)
    }
  } finally {
    isLoading.value = false
  }
}

async function loadCurrencyHistory(resetPage: boolean) {
  if (!selectedCurrency.value || isHistoryLoading.value) return

  isHistoryLoading.value = true
  try {
    if (resetPage) historyPage.value = 0

    const resp = await getCurrencyHistory({
      currencyId: selectedCurrency.value.id,
      page: historyPage.value,
      size: historyLimit.value,
    })
    currencyHistory.value = resp.history
    historyHasNext.value = resp.history.length === historyLimit.value
  } finally {
    isHistoryLoading.value = false
  }
}

async function selectCurrency(currency: CurrencyModel) {
  selectedCurrency.value = currency
  await loadCurrencyHistory(true)
}

function currencyLabel(currencyId: number) {
  const currency = currencies.value.find((item) => item.id === currencyId)
  return currency ? `${currency.shortName} (${currency.code})` : t('currencies.unknownCurrency')
}

function currencyPairLabel(history: CurrencyRateHistoryModel) {
  return `${currencyLabel(history.fromCurrencyId)} → ${currencyLabel(history.toCurrencyId)}`
}

function formatRate(value: number) {
  return value.toLocaleString(locale.value, {
    maximumFractionDigits: 8,
  })
}

function formatRateDelta(history: CurrencyRateHistoryModel) {
  const delta = history.newRate - history.prevRate
  const sign = delta > 0 ? '+' : ''
  return `${sign}${formatRate(delta)}`
}

function rateDeltaClass(history: CurrencyRateHistoryModel) {
  const delta = history.newRate - history.prevRate
  if (delta > 0) return 'tabular-nums font-medium text-emerald-600'
  if (delta < 0) return 'tabular-nums font-medium text-red-600'
  return 'tabular-nums text-slate-500'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(locale.value)
}

function openCreateDialog() {
  createForm.name = ''
  createForm.shortName = ''
  createForm.code = ''
  createForm.currencySign = ''
  createDialogOpen.value = true
}

async function submitCreate() {
  if (!createFormRef.value) return

  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return

  isCreating.value = true
  try {
    const resp = await createCurrency({
      name: createForm.name.trim(),
      shortName: createForm.shortName.trim(),
      code: createForm.code.trim(),
      currencySign: createForm.currencySign.trim(),
    })

    ElNotification({
      title: t('currencies.createdTitle'),
      message: `ID: ${resp.id}`,
      type: 'success',
    })

    createDialogOpen.value = false
    await loadCurrencies()
  } finally {
    isCreating.value = false
  }
}

async function submitUpdateRates() {
  if (isUpdatingRates.value) return

  isUpdatingRates.value = true
  try {
    await updateCurrencyRates()
    ElNotification({
      title: t('currencies.ratesUpdatedTitle'),
      message: t('currencies.ratesUpdatedMessage'),
      type: 'success',
    })
    await loadCurrencies()
    await loadCurrencyHistory(false)
  } finally {
    isUpdatingRates.value = false
  }
}

watch(historyLimit, async () => loadCurrencyHistory(true))
watch(historyPage, async () => loadCurrencyHistory(false))
onMounted(async () => loadCurrencies())
</script>

<style scoped>
</style>
