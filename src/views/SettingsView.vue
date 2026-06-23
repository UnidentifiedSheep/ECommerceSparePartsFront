<template>
  <div class="min-h-[calc(100vh-56px)] bg-slate-50">
    <div class="border-b border-slate-200 bg-white px-4 py-4">
      <h1 class="text-2xl font-semibold text-slate-900">{{ t('settings.title') }}</h1>
      <p class="text-sm text-slate-500">{{ t('settings.description') }}</p>
    </div>

    <div class="settings-layout">
      <aside class="settings-sidebar">
        <button
          v-for="item in settingsSections"
          :key="item.name"
          type="button"
          class="settings-nav-item"
          :class="{ 'settings-nav-item--active': activeTab === item.name }"
          @click="activeTab = item.name"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </button>
      </aside>

      <main class="settings-content">
        <section v-if="activeTab === 'security'" class="settings-panel">
          <div class="border-b border-slate-200 pb-3">
            <h2 class="text-xl font-semibold text-slate-900">{{ t('settings.security') }}</h2>
            <p class="mt-1 text-sm text-slate-500">{{ t('settings.securityHint') }}</p>
          </div>

          <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="text-base font-semibold text-slate-900">{{ t('settings.passwordTitle') }}</div>
                <div class="mt-1 text-sm text-slate-500">{{ t('settings.passwordHint') }}</div>
              </div>
              <el-button type="primary" @click="openPasswordDialog">
                {{ t('settings.changePassword') }}
              </el-button>
            </div>
          </div>
        </section>
      </main>
    </div>

    <el-dialog v-model="passwordDialogOpen" :title="t('settings.changePassword')" width="460">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top">
        <el-form-item :label="t('settings.previousPassword')" prop="previousPassword">
          <el-input v-model="passwordForm.previousPassword" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item :label="t('settings.newPassword')" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-form-item :label="t('settings.confirmPassword')" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password autocomplete="new-password" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="passwordDialogOpen = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="isChangingPassword" @click="savePassword">
          {{ t('common.actions.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Lock } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { changePassword } from '@/services/api/authApi.ts'
import { useI18n } from '@/i18n'

interface PasswordForm {
  previousPassword: string
  newPassword: string
  confirmPassword: string
}

const { t } = useI18n()
const activeTab = ref('security')
const settingsSections = computed(() => [
  {
    name: 'security',
    label: t('settings.security'),
    icon: Lock,
  },
])
const passwordDialogOpen = ref(false)
const isChangingPassword = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive<PasswordForm>({
  previousPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordRules = computed<FormRules<PasswordForm>>(() => ({
  previousPassword: [{ required: true, message: t('settings.previousPasswordRequired'), trigger: 'blur' }],
  newPassword: [{ required: true, message: t('settings.newPasswordRequired'), trigger: 'blur' }],
  confirmPassword: [
    {
      validator: (_rule, value, callback) => {
        if (!value) callback(new Error(t('settings.confirmPasswordRequired')))
        else if (value !== passwordForm.newPassword) callback(new Error(t('settings.passwordMismatch')))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}))

function openPasswordDialog() {
  passwordForm.previousPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogOpen.value = true
  passwordFormRef.value?.clearValidate()
}

async function savePassword() {
  if (!passwordFormRef.value || isChangingPassword.value) return

  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  isChangingPassword.value = true
  try {
    await changePassword({
      previousPassword: passwordForm.previousPassword,
      newPassword: passwordForm.newPassword,
    })
    passwordDialogOpen.value = false
    ElMessage.success(t('settings.passwordChanged'))
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('settings.passwordChangeError'))
  } finally {
    isChangingPassword.value = false
  }
}
</script>

<style scoped>
.settings-layout {
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(0, 1fr);
  gap: 28px;
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
}

.settings-sidebar {
  display: grid;
  align-content: start;
  gap: 4px;
  min-width: 0;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #334155;
  cursor: pointer;
  font-size: 14px;
  font-weight: 650;
  padding: 9px 12px;
  text-align: left;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.settings-nav-item:hover {
  background: #e2e8f0;
}

.settings-nav-item--active {
  background: #e2e8f0;
  color: #0f172a;
  box-shadow: inset 3px 0 0 #3b82f6;
}

.settings-content {
  min-width: 0;
  width: 100%;
}

.settings-panel {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 24px;
}

@media (max-width: 768px) {
  .settings-layout {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 16px;
  }

  .settings-sidebar {
    display: flex;
    overflow-x: auto;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
  }

  .settings-nav-item {
    flex: 0 0 auto;
  }

  .settings-nav-item--active {
    box-shadow: inset 0 -3px 0 #3b82f6;
  }

  .settings-panel {
    padding: 18px;
  }
}
</style>
