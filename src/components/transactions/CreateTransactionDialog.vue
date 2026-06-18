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
          <el-radio-button label="UserToUser">{{ t('transactions.userToUser') }}</el-radio-button>
          <el-radio-button label="SystemToUser">{{ t('transactions.systemToUser') }}</el-radio-button>
          <el-radio-button label="UserToSystem">{{ t('transactions.userToSystem') }}</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.operationMode === 'UserToUser'">
        <el-form-item :label="t('transactions.sender')" prop="senderId">
          <UserSelector
            v-model:selected-user="sender"
            :place-holder="t('transactions.selectSender')"
          />
        </el-form-item>

        <el-form-item :label="t('transactions.receiver')" prop="receiverId">
          <UserSelector
            v-model:selected-user="receiver"
            :place-holder="t('transactions.selectReceiver')"
          />
        </el-form-item>
      </template>

      <el-form-item v-else :label="systemUserLabel" prop="userId">
        <UserSelector
          v-model:selected-user="systemTransactionUser"
          :place-holder="systemUserPlaceholder"
        />
      </el-form-item>

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
  createBalanceTransaction,
  createSystemBalanceTransaction,
  type SystemTransactionDirection,
} from '@/services/api/balances.ts'
import { toLocalDateTimeInputValue, toUtcDateTimeString } from '@/utils/dateTime.ts'
import { useI18n } from '@/i18n'

type TransactionOperationMode = 'UserToUser' | SystemTransactionDirection

interface CreateTransactionForm {
  operationMode: TransactionOperationMode
  senderId: string
  receiverId: string
  userId: string
  amount: number
  currencyId: number
  transactionDateTime: string
}

const props = defineProps<{
  modelValue: boolean
  currencies: CurrencyModel[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: []
}>()

const { t } = useI18n()
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const formRef = ref<FormInstance>()
const sender = ref<UserModel>()
const receiver = ref<UserModel>()
const systemTransactionUser = ref<UserModel>()
const isSubmitting = ref(false)

const form = reactive<CreateTransactionForm>({
  operationMode: 'UserToUser',
  senderId: '',
  receiverId: '',
  userId: '',
  amount: 0.01,
  currencyId: 0,
  transactionDateTime: toLocalDateTimeInputValue(new Date()),
})

const systemUserLabel = computed(() => (
  form.operationMode === 'SystemToUser' ? t('transactions.receiver') : t('transactions.sender')
))
const systemUserPlaceholder = computed(() => (
  form.operationMode === 'SystemToUser' ? t('transactions.selectReceiver') : t('transactions.selectSender')
))
const rules = computed<FormRules<CreateTransactionForm>>(() => ({
  operationMode: [{ required: true, message: t('transactions.selectOperationType'), trigger: 'change' }],
  senderId: [
    {
      validator: (_rule, value, callback) => {
        if (form.operationMode !== 'UserToUser' || value) callback()
        else callback(new Error(t('transactions.selectSender')))
      },
      trigger: 'change',
    },
  ],
  receiverId: [
    {
      validator: (_rule, value, callback) => {
        if (form.operationMode !== 'UserToUser' || value) callback()
        else callback(new Error(t('transactions.selectReceiver')))
      },
      trigger: 'change',
    },
  ],
  userId: [
    {
      validator: (_rule, value, callback) => {
        if (form.operationMode === 'UserToUser' || value) callback()
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

watch(sender, (user) => {
  form.senderId = user?.id ?? ''
})

watch(receiver, (user) => {
  form.receiverId = user?.id ?? ''
})

watch(systemTransactionUser, (user) => {
  form.userId = user?.id ?? ''
})

watch(() => form.operationMode, () => {
  sender.value = undefined
  receiver.value = undefined
  systemTransactionUser.value = undefined
  form.senderId = ''
  form.receiverId = ''
  form.userId = ''
  formRef.value?.clearValidate(['senderId', 'receiverId', 'userId'])
})

watch(dialogOpen, (open) => {
  if (open) resetForm()
})

async function submit() {
  if (!formRef.value || isSubmitting.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (form.operationMode === 'UserToUser' && form.senderId === form.receiverId) {
    ElMessage.warning(t('transactions.sameUsers'))
    return
  }

  isSubmitting.value = true
  try {
    if (form.operationMode === 'UserToUser') {
      await createBalanceTransaction({
        senderId: form.senderId,
        receiverId: form.receiverId,
        amount: form.amount,
        currencyId: form.currencyId,
        transactionDateTime: toUtcDateTimeString(form.transactionDateTime),
      })
    } else {
      await createSystemBalanceTransaction({
        userId: form.userId,
        direction: form.operationMode,
        amount: form.amount,
        currencyId: form.currencyId,
        transactionDateTime: toUtcDateTimeString(form.transactionDateTime),
      })
    }

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
  sender.value = undefined
  receiver.value = undefined
  systemTransactionUser.value = undefined
  form.operationMode = 'UserToUser'
  form.senderId = ''
  form.receiverId = ''
  form.userId = ''
  form.amount = 0.01
  form.currencyId = props.currencies[0]?.id ?? 0
  form.transactionDateTime = toLocalDateTimeInputValue(new Date())
  formRef.value?.clearValidate()
}
</script>

<style scoped>
.transaction-mode-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
