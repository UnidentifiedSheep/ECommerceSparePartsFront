<template>
  <el-dialog
    v-model="dialogOpen"
    :title="t('transactions.createTitle')"
    width="640"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item :label="t('transactions.operationType')" prop="operationMode">
        <el-radio-group v-model="form.operationMode" class="transaction-mode-group">
          <el-radio-button label="SystemToUser">{{ t('transactions.systemToUser') }}</el-radio-button>
          <el-radio-button label="UserToSystem">{{ t('transactions.userToSystem') }}</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item :label="systemUserLabel" prop="userId">
        <UserSelector
          v-model:selected-user="systemTransactionUser"
          :place-holder="systemUserPlaceholder"
        />
      </el-form-item>

      <div v-if="systemTransactionUser" class="transaction-finances" v-loading="isFinancialInfoLoading">
        <template v-if="financialInfo">
          <div class="finance-main">
            <span>{{ t('transactions.financialBalance') }}</span>
            <strong :class="financeAmountClass(financialBalance)">
              {{ formatFinanceAmount(financialBalance, financialInfo.baseCurrency) }}
            </strong>
            <small>{{ financialBalanceHint }}</small>
          </div>
          <div v-if="financialInfo.balances.length > 0" class="finance-balances">
            <div
              v-for="balance in financialInfo.balances"
              :key="balance.currency.id"
            >
              <span>{{ balance.currency.shortName }}</span>
              <strong :class="financeAmountClass(balance.balance)">
                {{ formatFinanceAmount(balance.balance, balance.currency) }}
              </strong>
            </div>
          </div>
        </template>
        <span v-else-if="financialInfoError" class="finance-error">{{ financialInfoError }}</span>
      </div>

      <div class="transaction-form-grid">
        <el-form-item :label="t('common.labels.currency')" prop="currencyId">
          <el-select v-model="form.currencyId" filterable :placeholder="t('transactions.selectCurrency')" class="w-full">
            <el-option
              v-for="currency in currencies"
              :key="currency.id"
              :label="`${currency.shortName} (${currency.code})`"
              :value="currency.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('transactions.amount')" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            controls-position="right"
            class="w-full"
          />
        </el-form-item>
      </div>

      <el-form-item :label="t('transactions.dateTime')" prop="transactionDateTime">
        <el-date-picker
          v-model="form.transactionDateTime"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss.SSS"
          format="DD.MM.YYYY HH:mm"
          :placeholder="t('transactions.selectDateTime')"
          class="w-full"
        />
      </el-form-item>

      <el-form-item :label="t('transactions.forcePayment')">
        <div class="transaction-force-payment">
          <el-switch v-model="form.forcePayment" />
          <span>{{ t('transactions.forcePaymentHint') }}</span>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="isSubmitting" @click="submit">
        {{ t('common.actions.create') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import UserSelector from '@/components/selectors/UserSelector.vue'
import type { CurrencyModel } from '@/models/currencyModel.ts'
import type { UserModel } from '@/models/userModel.ts'
import {
  createSystemBalanceTransaction,
  type SystemTransactionDirection,
} from '@/services/api/balances.ts'
import { getUserFinancialInfo, type GetUserFinancialInfoResponse } from '@/services/api/users.ts'
import { toLocalDateTimeInputValue, toUtcDateTimeString } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

interface CreateTransactionForm {
  operationMode: SystemTransactionDirection
  userId: string
  amount: number
  currencyId: number
  transactionDateTime: string
  forcePayment: boolean
}

const props = defineProps<{
  modelValue: boolean
  currencies: CurrencyModel[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: []
}>()

const { locale, t } = useI18n()
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const formRef = ref<FormInstance>()
const systemTransactionUser = ref<UserModel>()
const isSubmitting = ref(false)
const isFinancialInfoLoading = ref(false)
const financialInfo = ref<GetUserFinancialInfoResponse | null>(null)
const financialInfoError = ref('')
let financialInfoRequestId = 0

const form = reactive<CreateTransactionForm>({
  operationMode: 'SystemToUser',
  userId: '',
  amount: 0.01,
  currencyId: 0,
  transactionDateTime: toLocalDateTimeInputValue(new Date()),
  forcePayment: false,
})

const systemUserLabel = computed(() => (
  form.operationMode === 'SystemToUser' ? t('transactions.receiver') : t('transactions.sender')
))
const systemUserPlaceholder = computed(() => (
  form.operationMode === 'SystemToUser' ? t('transactions.selectReceiver') : t('transactions.selectSender')
))
const financialBalance = computed(() => financialInfo.value?.financialProfile?.balance ?? 0)
const financialBalanceHint = computed(() => {
  if (financialBalance.value < 0) return t('transactions.userOwesUs')
  if (financialBalance.value > 0) return t('transactions.weOweUser')
  return t('transactions.noDebt')
})
const rules = computed<FormRules<CreateTransactionForm>>(() => ({
  operationMode: [{ required: true, message: t('transactions.selectOperationType'), trigger: 'change' }],
  userId: [
    {
      validator: (_rule, value, callback) => {
        if (value) callback()
        else callback(new Error(t('transactions.selectUser')))
      },
      trigger: 'change',
    },
  ],
  currencyId: [
    {
      validator: (_rule, value, callback) => {
        if (!value) callback(new Error(t('transactions.selectCurrency')))
        else callback()
      },
      trigger: 'change',
    },
  ],
  amount: [
    {
      validator: (_rule, value, callback) => {
        if (!value || value <= 0) callback(new Error(t('transactions.selectAmount')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  transactionDateTime: [{ required: true, message: t('transactions.selectDateTime'), trigger: 'change' }],
}))

watch(systemTransactionUser, (user) => {
  form.userId = user?.id ?? ''
  void loadFinancialInfo(user?.id)
})

watch(() => form.operationMode, () => {
  systemTransactionUser.value = undefined
  form.userId = ''
  formRef.value?.clearValidate(['userId'])
})

watch(dialogOpen, (open) => {
  if (open) resetForm()
})

async function submit() {
  if (!formRef.value || isSubmitting.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  isSubmitting.value = true
  try {
    await createSystemBalanceTransaction({
      userId: form.userId,
      direction: form.operationMode,
      amount: form.amount,
      currencyId: form.currencyId,
      transactionDateTime: toUtcDateTimeString(form.transactionDateTime),
      forcePayment: form.forcePayment,
    })

    ElMessage.success(t('transactions.created'))
    emit('created')
    dialogOpen.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('transactions.createError'))
  } finally {
    isSubmitting.value = false
  }
}

function resetForm() {
  systemTransactionUser.value = undefined
  financialInfo.value = null
  financialInfoError.value = ''
  form.operationMode = 'SystemToUser'
  form.userId = ''
  form.amount = 0.01
  form.currencyId = props.currencies[0]?.id ?? 0
  form.transactionDateTime = toLocalDateTimeInputValue(new Date())
  form.forcePayment = false
  formRef.value?.clearValidate()
}

async function loadFinancialInfo(userId?: string) {
  const requestId = ++financialInfoRequestId
  financialInfo.value = null
  financialInfoError.value = ''
  if (!userId) return

  isFinancialInfoLoading.value = true
  try {
    const response = await getUserFinancialInfo(userId)
    if (requestId !== financialInfoRequestId) return
    financialInfo.value = response
  } catch (error) {
    if (requestId !== financialInfoRequestId) return
    financialInfoError.value = error instanceof Error ? error.message : t('transactions.loadFinancialInfoError')
  } finally {
    if (requestId === financialInfoRequestId) {
      isFinancialInfoLoading.value = false
    }
  }
}

function formatFinanceAmount(value: number, currency: CurrencyModel) {
  return `${value.toLocaleString(locale.value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency.currencySign || currency.shortName}`.trim()
}

function financeAmountClass(value: number) {
  return {
    'finance-negative': value < 0,
    'finance-positive': value > 0,
  }
}
</script>

<style scoped>
.transaction-mode-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
}

:deep(.transaction-mode-group .el-radio-button__inner) {
  width: 100%;
}

.transaction-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 12px;
}

.transaction-finances {
  display: grid;
  gap: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 12px;
  margin-bottom: 16px;
}

.finance-main {
  display: grid;
  gap: 3px;
}

.finance-main span,
.finance-balances span {
  color: #64748b;
  font-size: 12px;
  font-weight: 650;
}

.finance-main strong {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.2;
}

.finance-main small {
  color: #64748b;
  font-size: 12px;
}

.finance-balances {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.finance-balances div {
  display: grid;
  gap: 2px;
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
}

.finance-balances strong {
  color: #0f172a;
  font-size: 13px;
}

.finance-negative {
  color: #dc2626 !important;
}

.finance-positive {
  color: #047857 !important;
}

.finance-error {
  color: #dc2626;
  font-size: 13px;
}

.transaction-force-payment {
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.3;
}

:deep(.el-select),
:deep(.el-input-number),
:deep(.el-date-editor) {
  width: 100%;
}

@media (max-width: 640px) {
  .transaction-mode-group,
  .transaction-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
