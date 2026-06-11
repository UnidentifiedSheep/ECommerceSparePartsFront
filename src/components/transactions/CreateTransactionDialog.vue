<template>
  <el-dialog
    v-model="dialogOpen"
    title="Создать транзакцию"
    width="640"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Тип операции" prop="operationMode">
        <el-radio-group v-model="form.operationMode" class="transaction-mode-group">
          <el-radio-button label="UserToUser">Между пользователями</el-radio-button>
          <el-radio-button label="SystemToUser">Выплата пользователю</el-radio-button>
          <el-radio-button label="UserToSystem">Платеж в систему</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.operationMode === 'UserToUser'">
        <el-form-item label="Отправитель" prop="senderId">
          <UserSelector
            v-model:selected-user="sender"
            place-holder="Выберите отправителя"
          />
        </el-form-item>

        <el-form-item label="Получатель" prop="receiverId">
          <UserSelector
            v-model:selected-user="receiver"
            place-holder="Выберите получателя"
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
        <el-form-item label="Валюта" prop="currencyId">
          <el-select v-model="form.currencyId" filterable placeholder="Выберите валюту" class="w-full">
            <el-option
              v-for="currency in currencies"
              :key="currency.id"
              :label="`${currency.shortName} (${currency.code})`"
              :value="currency.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Сумма" prop="amount">
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

      <el-form-item label="Дата и время" prop="transactionDateTime">
        <el-date-picker
          v-model="form.transactionDateTime"
          type="datetime"
          value-format="YYYY-MM-DDTHH:mm:ss.SSS"
          format="DD.MM.YYYY HH:mm"
          placeholder="Выберите дату и время"
          class="w-full"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogOpen = false">Отмена</el-button>
      <el-button type="primary" :loading="isSubmitting" @click="submit">
        Создать
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
  form.operationMode === 'SystemToUser' ? 'Получатель' : 'Отправитель'
))
const systemUserPlaceholder = computed(() => (
  form.operationMode === 'SystemToUser' ? 'Выберите получателя' : 'Выберите отправителя'
))
const rules = reactive<FormRules<CreateTransactionForm>>({
  operationMode: [{ required: true, message: 'Выберите тип операции', trigger: 'change' }],
  senderId: [
    {
      validator: (_rule, value, callback) => {
        if (form.operationMode !== 'UserToUser' || value) callback()
        else callback(new Error('Выберите отправителя'))
      },
      trigger: 'change',
    },
  ],
  receiverId: [
    {
      validator: (_rule, value, callback) => {
        if (form.operationMode !== 'UserToUser' || value) callback()
        else callback(new Error('Выберите получателя'))
      },
      trigger: 'change',
    },
  ],
  userId: [
    {
      validator: (_rule, value, callback) => {
        if (form.operationMode === 'UserToUser' || value) callback()
        else callback(new Error('Выберите пользователя'))
      },
      trigger: 'change',
    },
  ],
  currencyId: [
    {
      validator: (_rule, value, callback) => {
        if (!value) callback(new Error('Выберите валюту'))
        else callback()
      },
      trigger: 'change',
    },
  ],
  amount: [
    {
      validator: (_rule, value, callback) => {
        if (!value || value <= 0) callback(new Error('Введите сумму больше 0'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  transactionDateTime: [{ required: true, message: 'Выберите дату и время', trigger: 'change' }],
})

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
    ElMessage.warning('Отправитель и получатель должны быть разными пользователями')
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

    ElMessage.success('Транзакция создана')
    emit('created')
    dialogOpen.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось создать транзакцию')
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
