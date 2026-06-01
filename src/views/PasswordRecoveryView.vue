<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
    <div class="w-full max-w-md rounded-lg bg-white px-10 py-9 shadow-lg">
      <div class="pb-8 text-center">
        <h1 class="text-2xl font-semibold text-gray-900">Восстановление пароля</h1>
        <p class="mt-2 text-sm text-gray-500">
          Укажите email. Если пользователь существует, мы отправим ссылку для смены пароля.
        </p>
      </div>

      <div class="pb-6">
        <label for="recovery-email" class="block pb-2 font-semibold text-gray-700">Email</label>
        <el-input
          id="recovery-email"
          v-model="email"
          type="email"
          placeholder="Введите email"
          :disabled="isSent"
          @keyup.enter="submitRecovery"
        />
      </div>

      <el-alert
        v-if="isSent"
        type="success"
        show-icon
        :closable="false"
        class="mb-6"
        title="Письмо отправлено"
      >
        <p class="text-sm">Проверьте почту и перейдите по ссылке из письма.</p>
      </el-alert>

      <div class="flex flex-col gap-4 pt-1">
        <el-button
          type="primary"
          size="large"
          :loading="isLoading"
          :disabled="isSent || !canSubmit"
          @click="submitRecovery"
        >
          Отправить ссылку
        </el-button>

        <RouterLink to="/auth" class="text-center text-sm font-medium text-blue-600 hover:text-blue-700">
          Вернуться ко входу
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ElNotification } from 'element-plus'
import { ApiError } from '@/models/errorModel.ts'
import { sendPasswordRecoveryEmail } from '@/services/api/authApi.ts'

const email = ref('')
const isLoading = ref(false)
const isSent = ref(false)

const canSubmit = computed(() => email.value.trim().length > 0)

async function submitRecovery() {
  if (isLoading.value || isSent.value || !canSubmit.value) return

  isLoading.value = true
  try {
    await sendPasswordRecoveryEmail({
      email: email.value.trim(),
    })
    isSent.value = true
  } catch (error) {
    ElNotification({
      title: 'Не удалось отправить письмо',
      message: error instanceof ApiError ? error.message : 'Повторите попытку позже',
      type: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>
