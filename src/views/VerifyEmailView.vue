<template>
  <AuthShell>
    <div class="auth-form__header">
      <h1>{{ t('auth.verifyEmailTitle') }}</h1>
      <p>{{ t('auth.verifyEmailHint') }}</p>
    </div>

    <div class="auth-form">
      <el-alert
        v-if="status === 'loading'"
        type="info"
        show-icon
        :closable="false"
        :title="t('auth.verifyEmailLoading')"
      />
      <el-alert
        v-else-if="status === 'success'"
        type="success"
        show-icon
        :closable="false"
        :title="t('auth.verifyEmailDoneTitle')"
      >
        <p class="text-sm">{{ t('auth.verifyEmailDoneMessage') }}</p>
      </el-alert>
      <el-alert
        v-else
        type="error"
        show-icon
        :closable="false"
        :title="t('auth.verifyEmailErrorTitle')"
      >
        <p class="text-sm">{{ errorMessage }}</p>
      </el-alert>

      <div class="auth-form__actions">
        <div class="auth-form__secondary-action">
          <RouterLink to="/auth" class="auth-form__link">
            {{ t('auth.goToLogin') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'
import { ApiError } from '@/models/errorModel.ts'
import { verifyEmail } from '@/services/api/authApi.ts'
import { useI18n } from '@/i18n'

const route = useRoute()
const { t } = useI18n()
const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')
const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

onMounted(async () => {
  if (!token.value) {
    status.value = 'error'
    errorMessage.value = t('auth.verifyEmailInvalidLink')
    return
  }

  try {
    await verifyEmail({ token: token.value })
    status.value = 'success'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof ApiError
      ? error.message
      : t('auth.verifyEmailErrorMessage')
  }
})
</script>
