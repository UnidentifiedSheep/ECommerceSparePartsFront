<template>
  <AuthShell>
    <div class="auth-form__header">
      <h1>{{ t('auth.resetTitle') }}</h1>
      <p>{{ t('auth.resetHint') }}</p>
    </div>

    <form class="auth-form" @submit.prevent="submitReset">
      <el-alert
        v-if="!token"
        type="error"
        show-icon
        :closable="false"
        :title="t('auth.invalidResetLinkTitle')"
      >
        <p class="text-sm">{{ t('auth.invalidResetLinkMessage') }}</p>
      </el-alert>

      <template v-else>
        <div class="auth-field">
          <label for="new-password" class="auth-field__label">{{ t('auth.newPassword') }}</label>
          <el-input
            id="new-password"
            v-model="newPassword"
            type="password"
            :placeholder="t('auth.newPasswordPlaceholder')"
            show-password
            :disabled="isDone"
            required
            size="large"
            autocomplete="new-password"
          />
        </div>

        <div class="auth-field">
          <label for="confirm-password" class="auth-field__label">{{ t('auth.confirmPassword') }}</label>
          <el-input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            :placeholder="t('auth.confirmPasswordPlaceholder')"
            show-password
            :disabled="isDone"
            required
            size="large"
            autocomplete="new-password"
          />
          <p v-if="passwordMismatch" class="auth-form__message">
            {{ t('auth.passwordMismatch') }}
          </p>
        </div>

        <el-alert
          v-if="isDone"
          type="success"
          show-icon
          :closable="false"
          :title="t('auth.resetDoneTitle')"
        >
          <p class="text-sm">{{ t('auth.resetDoneMessage') }}</p>
        </el-alert>
      </template>

      <div class="auth-form__actions">
        <el-button
          v-if="token && !isDone"
          native-type="submit"
          type="primary"
          size="large"
          class="auth-form__submit"
          :loading="isLoading"
          :disabled="!canSubmit"
        >
          {{ t('auth.savePassword') }}
        </el-button>

        <div class="auth-form__secondary-action">
          <RouterLink to="/auth" class="auth-form__link">
            {{ t('auth.goToLogin') }}
          </RouterLink>
        </div>
      </div>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ElNotification } from 'element-plus'
import { ApiError } from '@/models/errorModel.ts'
import { resetPassword } from '@/services/api/authApi.ts'
import { useI18n } from '@/i18n'
import AuthShell from '@/components/auth/AuthShell.vue'

const route = useRoute()
const { t } = useI18n()
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
      title: t('auth.resetErrorTitle'),
      message: error instanceof ApiError ? error.message : t('auth.resetErrorMessage'),
      type: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>
