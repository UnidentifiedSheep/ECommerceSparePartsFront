<template>
  <div class="h-full">
    <div class="h-full flex flex-col">

      <!-- Header -->
      <div class="flex justify-between items-center pb-3" v-if="storage">
        <span class="text-lg font-semibold">{{ t('storages.owners') }}</span>

        <el-button type="primary" @click="OpenAddOwnerDialogue">
          {{ t('storages.ownersPanel.add') }}
        </el-button>
      </div>

      <!-- List -->
      <el-scrollbar @end-reached="loadOwners(false)" class="flex-1">
        <div v-if="owners.length > 0">
          <div
            v-for="owner in owners"
            :key="owner.id"
            class="pb-3 last:pb-0"
          >
            <el-card shadow="hover">
              <div class="flex items-center justify-between">

                <!-- Left -->
                <div class="flex items-center gap-3">
                  <el-avatar :size="40">
                    {{ getInitials(owner) }}
                  </el-avatar>

                  <div class="flex flex-col">
                  <span class="font-medium text-gray-800">
                    {{ owner.surname }} {{ owner.name }}
                  </span>
                    <span class="text-sm text-gray-500">
                      ID: {{ owner.id }}
                    </span>
                  </div>
                </div>

                <!-- Right -->
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  plain
                  @click="removeOwner(owner)"
                />

              </div>
            </el-card>
          </div>
        </div>
      </el-scrollbar>

      <!-- Empty state -->
      <el-card
        v-if="!isLoading && owners.length === 0"
        class="mt-4"
      >
        <el-empty :description="t('storages.ownersPanel.empty')">
          <template #description>
            <div class="text-center">
              <p class="text-gray-500">
                {{ t('storages.ownersPanel.emptyHint') }}
              </p>
            </div>
          </template>
        </el-empty>
      </el-card>

    </div>

    <el-dialog v-model="addOwnerDialogueOpen" :title="t('storages.ownersPanel.addTitle')" width="500">
      <el-form :model="addOwnerForm">
        <el-form-item :label="t('common.labels.storage')">
          <el-input v-model="addOwnerForm!.storageName" readonly />
        </el-form-item>
        <el-form-item :label="t('common.labels.user')">
          <UserSelector v-model:selected-user="addOwnerForm!.user"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addOwnerDialogueOpen = false">{{ t('common.actions.cancel') }}</el-button>
          <el-button type="primary" @click="SaveOwner">
            {{ t('common.actions.save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

import type {StorageModel} from "@/models/storageModel.ts";
import {ref, watch} from "vue";
import type {UserModel} from "@/models/userModel.ts";
import {getStorageOwners} from "@/services/api/storages.ts";
import UserSelector from "@/components/selectors/UserSelector.vue";
import {addStorageToUser, removeStorageFromUser} from "@/services/api/users.ts";
import {ElNotification} from "element-plus";
import {Delete} from "@element-plus/icons-vue";
import { useI18n } from "@/i18n";

const { t } = useI18n()

const storage = defineModel<StorageModel | undefined>('storage')
const owners = ref<UserModel[]>([])

const addOwnerDialogueOpen = ref(false);
const addOwnerForm = ref<{
  storageName: string
  user?: UserModel
}>()

const page = ref(0)
const limit = ref(100)
const isLoading = ref(false)
const hasNextPage = ref(true)
async function loadOwners(reset: boolean) {
  if (isLoading.value || !hasNextPage.value || !storage.value) return

  try {
    isLoading.value = true
    if (reset) {
      owners.value = []
      page.value = 0
    }

    const resp = await getStorageOwners({
      storageName: storage.value.name,
      page: page.value,
      size: limit.value
    })

    owners.value.push(...resp.owners)
    hasNextPage.value = resp.owners.length === limit.value
    page.value++
  }
  finally {
    isLoading.value = false
  }
}

function OpenAddOwnerDialogue() {
  if (!storage.value) return
  addOwnerForm.value = {
    storageName: storage.value.name
  }
  addOwnerDialogueOpen.value = true
}

async function SaveOwner() {
  if (!addOwnerForm.value?.user) return
  if (!addOwnerForm.value?.storageName) return

  const user = addOwnerForm.value.user;
  const storageName = addOwnerForm.value.storageName

  await addStorageToUser({
    userId: user.id,
    storageName: storageName
  })
  owners.value.push(user)

  ElNotification({
    title: t('common.labels.success'),
    message: t('storages.ownersPanel.attached', { user: `${user.surname} ${user.name}`.trim(), storage: storageName }),
    type: 'success',
  })

  addOwnerDialogueOpen.value = false
}

async function removeOwner(user: UserModel) {
  if (!storage.value) return
  await removeStorageFromUser({
    storageName: storage.value.name,
    userId: user.id
  })

  ElNotification({
    title: t('common.labels.success'),
    message: t('storages.ownersPanel.detached', { user: `${user.surname} ${user.name}`.trim(), storage: storage.value.name }),
    type: 'success',
  })

  owners.value.splice(owners.value.indexOf(user), 1)

}

function getInitials(user: UserModel) {
  const name = user.name?.[0] ?? ''
  const surname = user.surname?.[0] ?? ''
  return (surname + name).toUpperCase()
}

watch(storage, async (newValue) => {
  hasNextPage.value = true
  if (!newValue) {
    owners.value = []
    page.value = 0
    return
  }

  await loadOwners(true)
}, { immediate: true })
</script>

<style scoped>

</style>
