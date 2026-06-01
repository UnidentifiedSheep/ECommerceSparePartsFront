<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
    <div class="w-full max-w-md rounded-lg bg-white px-10 py-9 shadow-lg">
      <div class="pb-8 text-center">
        <h1 class="text-2xl font-semibold text-gray-900">Новый пароль</h1>
        <p class="mt-2 text-sm text-gray-500">
          Введите новый пароль для аккаунта.
        </p>
      </div>

      <el-alert
        v-if="!token"
        type="error"
        show-icon
        :closable="false"
        class="mb-6"
        title="Ссылка недействительна"
      >
        <p class="text-sm">В ссылке отсутствует токен восстановления.</p>
      </el-alert>

      <template v-else>
        <div class="pb-5">
          <label for="new-password" class="block pb-2 font-semibold text-gray-700">Новый пароль</label>
          <el-input
            id="new-password"
            v-model="newPassword"
            type="password"
            placeholder="Введите новый пароль"
            show-password
            :disabled="isDone"
          />
        </div>

        <div class="pb-6">
          <label for="confirm-password" class="block pb-2 font-semibold text-gray-700">Повторите пароль</label>
          <el-input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            placeholder="Повторите новый пароль"
            show-password
            :disabled="isDone"
            @keyup.enter="submitReset"
          />
          <p v-if="passwordMismatch" class="mt-3 text-sm text-red-600">
            Пароли не совпадают.
          </p>
        </div>

        <el-alert
          v-if="isDone"
        type="success"
        show-icon
        :closable="false"
        class="mb-6"
        title="Пароль изменен"
      >
        <p class="text-sm">Теперь можно войти с новым паролем.</p>
      </el-alert>
      </template>

      <div class="flex flex-col gap-4 pt-1">
        <el-button
          v-if="token && !isDone"
          type="primary"
          size="large"
          :loading="isLoading"
          :disabled="!canSubmit"
          @click="submitReset"
        >
          Сохранить пароль
        </el-button>

        <RouterLink to="/auth" class="text-center text-sm font-medium text-blue-600 hover:text-blue-700">
          Перейти ко входу
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ElNotification } from 'element-plus'
import { ApiError } from '@/models/errorModel.ts'
import { resetPassword } from '@/services/api/authApi.ts'

const route = useRoute()
const token = computed(() => {
  const rawToken = route.query.token
  return typeof rawToken === 'string' ? rawToken : ''
})

const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const isDone = ref(false)

const passwordMismatch = computed(() => (
  confirmPassword.value.length > 0
  && newPassword.value !== confirmPassword.value
))

const canSubmit = computed(() => (
  token.value.length > 0
  && newPassword.value.length > 0
  && confirmPassword.value.length > 0
  && !passwordMismatch.value
))

async function submitReset() {
  if (isLoading.value || isDone.value || !canSubmit.value) return

  isLoading.value = true
  try {
    await resetPassword({
      token: token.value,
      newPassword: newPassword.value,
    })
    isDone.value = true
  } catch (error) {
    ElNotification({
      title: 'Не удалось изменить пароль',
      message: error instanceof ApiError ? error.message : 'Ссылка устарела или пароль не подходит',
      type: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>
