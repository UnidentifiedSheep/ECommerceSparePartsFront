<template>
  <div class="relative flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
    <div class="absolute right-5 top-5">
      <LocaleSwitcher variant="light" />
    </div>

    <div class="bg-white p-10 rounded-lg shadow-lg w-full max-w-sm">
      <div class="text-center pb-8">
        <h2 class="text-3xl font-bold text-gray-800">{{ t('auth.welcome') }}</h2>
        <p class="text-gray-500">{{ t('auth.hint') }}</p>
      </div>

      <div>
        <div class="pb-6">
          <label for="email" class="block text-gray-700 font-semibold">Email</label>
          <el-input
            v-model="email"
            type="email"
            id="email"
            :placeholder="t('auth.emailPlaceholder')"
            required
          />
        </div>

        <div class="pb-3">
          <div class="flex items-center justify-between gap-3">
            <label for="password" class="block text-gray-700 font-semibold">{{ t('auth.password') }}</label>
            <RouterLink to="/recovery" class="text-sm text-blue-600 hover:text-blue-700">
              {{ t('auth.forgotPassword') }}
            </RouterLink>
          </div>
          <el-input
            v-model="password"
            type="password"
            id="password"
            :placeholder="t('auth.passwordPlaceholder')"
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
            {{ t('auth.login') }}
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
import { useI18n } from '@/i18n'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'

const authStore = useAuthStore()
const { t } = useI18n()
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
      title: t('auth.errorTitle'),
      message: error instanceof ApiError ? error.message : t('auth.errorMessage'),
      type: 'error',
    })
  } finally {
    loading.value = false
  }
}
</script>
