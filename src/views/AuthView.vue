<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-10 rounded-lg shadow-lg w-full max-w-sm">
      <div class="text-center pb-8">
        <h2 class="text-3xl font-bold text-gray-800">Добро пожаловать</h2>
        <p class="text-gray-500">Пожалуйста, войдите в свой аккаунт</p>
      </div>

      <div>
        <div class="pb-6">
          <label for="email" class="block text-gray-700 font-semibold">Email</label>
          <el-input
            v-model="email"
            type="email"
            id="email"
            placeholder="Введите ваш email"
            required
          />
        </div>

        <div class="pb-3">
          <div class="flex items-center justify-between gap-3">
            <label for="password" class="block text-gray-700 font-semibold">Пароль</label>
            <RouterLink to="/recovery" class="text-sm text-blue-600 hover:text-blue-700">
              Забыли пароль?
            </RouterLink>
          </div>
          <el-input
            v-model="password"
            type="password"
            id="password"
            placeholder="Введите ваш пароль"
            required
            show-password
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="flex justify-center pt-5">
          <el-button
            @click="handleLogin"
            type="primary"
            class="w-100"
            size="large"
            :loading="loading"
          >
            Войти
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { login } from '@/services/api/authApi.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import { ApiError } from '@/models/errorModel.ts'

const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()

async function handleLogin() {
  if (loading.value) return

  try {
    loading.value = true
    const resp = await login({
      email: email.value,
      password: password.value,
    })
    authStore.login(resp.token, resp.refreshToken, resp.deviceId)
    await router.push('/storages')
  } catch (error) {
    ElNotification({
      title: 'Ошибка авторизации',
      message: error instanceof ApiError ? error.message : 'Не удалось выполнить вход',
      type: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
