<template>
  <div class="h-full">
    <el-card :shadow="shadow" class="h-full">
      <el-table
        ref="tableRef"
        :data="storages"
        class="w-full"
        highlight-current-row
        @current-change="handleCurrentChange"
      >
        <el-table-column prop="code" :label="t('common.labels.code')" min-width="180" />
        <el-table-column prop="description" :label="t('common.labels.description')" min-width="220" />
        <el-table-column prop="location" :label="t('storages.location')" min-width="180" />
        <el-table-column :label="t('common.labels.type')" min-width="160">
          <template #default="scope">
            <el-tag :type="scope.row.type === StorageType.Warehouse ? 'primary' : 'warning'">
              {{ toText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="canEdit || canDelete" fixed="right" width="64" align="center">
          <template #header><span class="sr-only">{{ t('common.labels.actions') }}</span></template>
          <template #default="scope">
            <div @click.stop>
              <RowActionsMenu
                :can-edit="canEdit"
                :can-delete="canDelete"
                :busy="deletion.isPending(scope.row.code)"
                @edit="openEditDialog(scope.row)"
                @delete="removeStorage(scope.row)"
              />
            </div>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="flex justify-between gap-4">
          <ZeroPagination v-model:page="page" v-model:size="limit" :has-next="hasNext" />

          <el-button v-if="canCreate" type="success" plain @click="createDialogOpen = true">
            <el-icon size="14">
              <Plus />
            </el-icon>
            <span class="pl-1">{{ t('storages.createStorage') }}</span>
          </el-button>
        </div>
      </template>
    </el-card>

    <CreateStorageDialogue v-model:is-open="createDialogOpen" @created="loadStorages(true)" />
    <EditStorageDialog
      v-model:is-open="editDialogOpen"
      :storage="editingStorage"
      @updated="loadStorages(false)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { usePermissions } from '@/composables/usePermissions.ts'
import { useConfirmedDelete } from '@/composables/useConfirmedDelete.ts'
import { useDebounceFn } from '@vueuse/core'
import { ElNotification, type TableInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { StorageModel } from '@/models/storageModel.ts'
import RowActionsMenu from '@/components/common/RowActionsMenu.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import CreateStorageDialogue from '@/components/storages/CreateStorageDialogue.vue'
import EditStorageDialog from '@/components/storages/EditStorageDialog.vue'
import { deleteStorage, getStorages } from '@/services/api/storages.ts'
import { StorageType, toText } from '@/enums/storageType.ts'
import { useI18n } from '@/i18n'

const props = withDefaults(
  defineProps<{
    searchField?: string
    storageType?: StorageType
    shadow?: string
    allowDelete?: boolean
    allowEdit?: boolean
  }>(),
  {
    allowDelete: true,
    allowEdit: true,
  },
)

const { t } = useI18n()
const { hasPermission } = usePermissions()
const canCreate = computed(() => hasPermission('STORAGES_CREATE'))
const canEdit = computed(() => props.allowEdit && hasPermission('STORAGES_EDIT'))
const canDelete = computed(() => props.allowDelete && hasPermission('STORAGES_DELETE'))
const deletion = useConfirmedDelete()
const updateDebounce = useDebounceFn(async () => {
  await loadStorages(true)
}, 300)

const tableRef = ref<TableInstance>()
const storages = ref<StorageModel[]>([])
const selectedStorage = defineModel<StorageModel | undefined>('selected-storage')
const editingStorage = ref<StorageModel>()
const page = ref(0)
const limit = ref(20)
const hasNext = ref(false)
const isLoading = ref(false)
const createDialogOpen = ref(false)
const editDialogOpen = ref(false)

function handleCurrentChange(val: StorageModel | undefined) {
  selectedStorage.value = val
}

async function loadStorages(resetPages: boolean) {
  if (isLoading.value) return

  isLoading.value = true
  try {
    if (resetPages) {
      page.value = 0
    }

    hasNext.value = false
    storages.value = []

    const resp = await getStorages({
      page: page.value,
      limit: limit.value,
      type: props.storageType,
      searchTerm: props.searchField,
    })

    storages.value = resp.storages
    hasNext.value = resp.storages.length === limit.value
    selectedStorage.value = undefined
    tableRef.value?.setCurrentRow(undefined)
  } finally {
    isLoading.value = false
  }
}

function openEditDialog(storage: StorageModel) {
  if (!canEdit.value || deletion.isPending(storage.code)) return
  editingStorage.value = storage
  editDialogOpen.value = true
}

async function removeStorage(storage: StorageModel) {
  if (!canDelete.value) return
  await deletion.remove(storage.code, storage.code, async () => {
    await deleteStorage({ code: storage.code })
    storages.value = storages.value.filter((item) => item.code !== storage.code)

    ElNotification({
      title: t('common.labels.success'),
      message: t('storages.removed', { name: storage.code }),
      type: 'success',
    })

    await loadStorages(false)
  })
}

onMounted(async () => loadStorages(true))
watch(limit, async () => loadStorages(true))
watch(page, async () => loadStorages(false))
watch(() => props.searchField, () => updateDebounce())
watch(() => props.storageType, async () => loadStorages(true))
</script>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
