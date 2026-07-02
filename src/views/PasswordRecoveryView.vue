<template>
  <AuthShell>
    <div class="auth-form__header">
      <h1>{{ t('auth.recoveryTitle') }}</h1>
      <p>{{ t('auth.recoveryHint') }}</p>
    </div>

    <form class="auth-form" @submit.prevent="submitRecovery">
      <div class="auth-field">
        <label for="recovery-email" class="auth-field__label">Email</label>
        <el-input
          id="recovery-email"
          v-model="email"
          type="email"
          :placeholder="t('auth.recoveryEmailPlaceholder')"
          :disabled="isSent"
          required
          size="large"
          autocomplete="email"
        />
      </div>

      <el-alert
        v-if="isSent"
        type="success"
        show-icon
        :closable="false"
        :title="t('auth.recoverySentTitle')"
      >
        <p class="text-sm">{{ t('auth.recoverySentMessage') }}</p>
      </el-alert>

      <div class="auth-form__actions">
        <el-button
          native-type="submit"
          type="primary"
          size="large"
          class="auth-form__submit"
          :loading="isLoading"
          :disabled="isSent || !canSubmit"
        >
          {{ t('auth.sendRecoveryLink') }}
        </el-button>

        <div class="auth-form__secondary-action">
          <RouterLink to="/auth" class="auth-form__link">
            {{ t('auth.backToLogin') }}
          </RouterLink>
        </div>
      </div>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ElNotification } from 'element-plus'
import { ApiError } from '@/models/errorModel.ts'
import { sendPasswordRecoveryEmail } from '@/services/api/authApi.ts'
import { useI18n } from '@/i18n'
import AuthShell from '@/components/auth/AuthShell.vue'

const { t } = useI18n()
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
      title: t('auth.recoveryErrorTitle'),
      message: error instanceof ApiError ? error.message : t('auth.recoveryErrorMessage'),
      type: 'error',
    })
  } finally {
    isLoading.value = false
  }
}
</script>
