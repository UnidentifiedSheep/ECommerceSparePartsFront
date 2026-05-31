<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <div class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Валюты</h1>
        <p class="text-sm text-slate-500">Справочник валют, доступных в системе.</p>
      </div>
    </div>

    <div class="grid items-start gap-4 p-4 xl:grid-cols-[minmax(420px,48%)_minmax(0,52%)]">
      <el-card shadow="hover" class="min-w-0">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-slate-900">Список валют</h2>
              <p class="text-sm text-slate-500">Данные из GET /main/currencies</p>
            </div>
            <div class="flex min-w-0 flex-1 justify-end gap-2">
              <el-input
                v-model="searchTerm"
                clearable
                placeholder="Поиск по названию, коду или символу"
                class="max-w-xs"
              />
              <el-button
                v-if="canCreateCurrencies"
                :icon="Refresh"
                :loading="isUpdatingRates"
                plain
                @click="submitUpdateRates"
              >
                Обновить курсы
              </el-button>
              <el-button v-if="canCreateCurrencies" :icon="Plus" type="primary" @click="openCreateDialog">
                Создать
              </el-button>
            </div>
          </div>
        </template>

        <el-table v-loading="isLoading" :data="filteredCurrencies" stripe>
          <el-table-column prop="id" label="ID" min-width="90" />
          <el-table-column prop="name" label="Название" min-width="220" />
          <el-table-column prop="shortName" label="Короткое имя" min-width="160" />
          <el-table-column prop="code" label="Код" min-width="120" />
          <el-table-column prop="currencySign" label="Символ" min-width="120" />
        </el-table>

        <template #footer>
          <div class="flex justify-start">
            <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />
          </div>
        </template>
      </el-card>

      <section class="min-h-[420px] min-w-0 rounded-md border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-4 py-3">
          <h2 class="text-lg font-semibold text-slate-900">История</h2>
          <p class="text-sm text-slate-500">Здесь будет история валют и курсов.</p>
        </div>
        <div class="p-4">
          <el-empty description="История пока не подключена" />
        </div>
      </section>
    </div>

    <el-dialog v-model="createDialogOpen" title="Создать валюту" width="480">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <el-form-item label="Название" prop="name">
          <el-input v-model="createForm.name" placeholder="Например: Российский рубль" />
        </el-form-item>

        <el-form-item label="Короткое имя" prop="shortName">
          <el-input v-model="createForm.shortName" placeholder="Например: Руб." />
        </el-form-item>

        <div class="grid grid-cols-2 gap-3">
          <el-form-item label="Код" prop="code">
            <el-input v-model="createForm.code" placeholder="RUB" />
          </el-form-item>

          <el-form-item label="Символ" prop="currencySign">
            <el-input v-model="createForm.currencySign" placeholder="₽" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="createDialogOpen = false">Отмена</el-button>
        <el-button type="primary" :loading="isCreating" @click="submitCreate">Создать</el-button>
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
  updateCurrencyRates,
  type CreateCurrencyRequest,
} from '@/services/api/currencies.ts'
import { usePermissions } from '@/composables/usePermissions.ts'

const currencies = ref<CurrencyModel[]>([])
const searchTerm = ref('')
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const isLoading = ref(false)
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

const createRules = reactive<FormRules<CreateCurrencyRequest>>({
  name: [
    { required: true, message: 'Название обязательно', trigger: 'blur' },
    { min: 3, max: 128, message: 'Название должно содержать от 3 до 128 символов', trigger: 'blur' },
  ],
  shortName: [
    { required: true, message: 'Короткое имя обязательно', trigger: 'blur' },
    { min: 2, max: 5, message: 'Короткое имя должно содержать от 2 до 5 символов', trigger: 'blur' },
  ],
  code: [
    { required: true, message: 'Код обязателен', trigger: 'blur' },
    { min: 2, max: 26, message: 'Код должен содержать от 2 до 26 символов', trigger: 'blur' },
  ],
  currencySign: [
    { required: true, message: 'Символ обязателен', trigger: 'blur' },
    { min: 1, max: 3, message: 'Символ должен содержать от 1 до 3 символов', trigger: 'blur' },
  ],
})

const filteredCurrencies = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return currencies.value

  return currencies.value.filter((currency) => {
    return [currency.name, currency.shortName, currency.code, currency.currencySign]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  })
})

async function loadCurrencies(resetPage: boolean) {
  if (isLoading.value) return

  isLoading.value = true
  try {
    if (resetPage) page.value = 0

    const resp = await getCurrencies({
      page: page.value,
      size: limit.value,
    })

    currencies.value = resp.currencies
    hasNext.value = resp.currencies.length === limit.value
  } finally {
    isLoading.value = false
  }
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
      title: 'Валюта создана',
      message: `ID: ${resp.id}`,
      type: 'success',
    })

    createDialogOpen.value = false
    await loadCurrencies(true)
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
      title: 'Курсы валют обновлены',
      message: 'Список валют перезагружен.',
      type: 'success',
    })
    await loadCurrencies(false)
  } finally {
    isUpdatingRates.value = false
  }
}

watch(limit, async () => loadCurrencies(true))
watch(page, async () => loadCurrencies(false))
onMounted(async () => loadCurrencies(true))
</script>

<style scoped>
</style>
