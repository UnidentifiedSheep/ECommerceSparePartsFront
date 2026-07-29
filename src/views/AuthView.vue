<template>
  <AuthShell>
    <div class="auth-form__header">
      <h1>{{ t('auth.welcome') }}</h1>
      <p>{{ t('auth.hint') }}</p>
    </div>

    <form class="auth-form" @submit.prevent="handleLogin">
      <div class="auth-field">
        <label for="login" class="auth-field__label">{{ t('auth.loginLabel') }}</label>
        <el-input
          id="login"
          v-model="loginValue"
          type="text"
          :placeholder="t('auth.loginPlaceholder')"
          required
          size="large"
          autocomplete="username"
        />
      </div>

      <div class="auth-field">
        <div class="auth-field__row">
          <label for="password" class="auth-field__label">{{ t('auth.password') }}</label>
          <RouterLink to="/recovery" class="auth-form__link">
            {{ t('auth.forgotPassword') }}
          </RouterLink>
        </div>
        <el-input
          id="password"
          v-model="password"
          type="password"
          :placeholder="t('auth.passwordPlaceholder')"
          required
          size="large"
          show-password
          autocomplete="current-password"
        />
      </div>

      <div class="auth-form__actions">
        <el-button
          native-type="submit"
          type="primary"
          class="auth-form__submit"
          size="large"
          :loading="loading"
        >
          {{ t('auth.login') }}
        </el-button>
      </div>
    </form>
  </AuthShell>
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
import AuthShell from '@/components/auth/AuthShell.vue'

const authStore = useAuthStore()
const { t } = useI18n()
const loginValue = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()

async function handleLogin() {
  if (loading.value) return

  try {
    loading.value = true
    const resp = await login({
      login: loginValue.value.trim(),
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
