<template>
  <div v-loading="loading">
    <OrganizationSelector
      v-if="entity === 'Organization'"
      :model-value="organization"
      organization-only
      :member-required="false"
      :placeholder="placeholder"
      @update:model-value="selectOrganization"
    />
    <UserSelector v-else :selected-user="user" :place-holder="placeholder" @update:selected-user="selectUser" />
  </div>
</template>

<script setup lang="ts">
import { onScopeDispose, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import OrganizationSelector from '@/components/selectors/OrganizationSelector.vue'
import UserSelector from '@/components/selectors/UserSelector.vue'
import type { OrganizationSelection } from '@/models/organizationModel'
import type { UserModel } from '@/models/userModel'
import { getOrganizationById } from '@/services/api/organizations'
import { getUsers } from '@/services/api/users'
import { useI18n } from '@/i18n'

const props = defineProps<{ entity: 'Organization' | 'User'; modelValue?: string | null; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()
const { t } = useI18n()
const organization = ref<OrganizationSelection>()
const user = ref<UserModel>()
const loading = ref(false)
let requestId = 0
onScopeDispose(() => { ++requestId })

function selectOrganization(value?: OrganizationSelection) {
  organization.value = value
  emit('update:modelValue', value?.organization.id ?? null)
}
function selectUser(value?: UserModel) {
  user.value = value
  emit('update:modelValue', value?.id ?? null)
}

watch(() => [props.entity, props.modelValue] as const, async ([entity, id]) => {
  const request = ++requestId
  loading.value = false
  if (id && (entity === 'Organization' ? organization.value?.organization.id : user.value?.id) === id) return
  organization.value = undefined
  user.value = undefined
  if (!id) return
  loading.value = true
  try {
    if (entity === 'Organization') {
      const result = await getOrganizationById(id)
      if (request === requestId && result) organization.value = { organization: result }
    } else {
      const result = await getUsers({ id, page: 0, limit: 1 })
      if (request === requestId) user.value = result.users[0]
    }
  } catch (error) {
    if (request === requestId) ElMessage.error(error instanceof Error ? error.message : t('schemaInputs.loadPartyError'))
  } finally { if (request === requestId) loading.value = false }
}, { immediate: true })
</script>
