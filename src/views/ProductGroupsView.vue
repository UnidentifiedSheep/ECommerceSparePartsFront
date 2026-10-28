<template>
  <div class="product-groups-page">
    <PageHeader :title="t('productGroups.title')" :description="t('productGroups.description')">
      <template #actions>
        <el-button v-if="canEdit" :icon="Plus" type="primary" @click="openCreateDialog">
          {{ t('productGroups.create') }}
        </el-button>
      </template>
    </PageHeader>

    <div class="product-groups-page__content">
      <el-card shadow="never" class="product-groups-card">
        <div class="product-groups-toolbar">
          <el-input
            v-model="searchTerm"
            :prefix-icon="Search"
            :placeholder="t('productGroups.searchPlaceholder')"
            clearable
            class="product-groups-toolbar__search"
            :aria-label="t('productGroups.searchPlaceholder')"
          />
          <el-button :icon="Refresh" :loading="loading" plain @click="loadGroups">
            {{ t('common.actions.refresh') }}
          </el-button>
        </div>

        <el-table
          v-loading="loading"
          :data="groups"
          :empty-text="loadError ? t('productGroups.loadError') : t('productGroups.empty')"
          row-key="id"
          class="product-groups-table"
        >
          <el-table-column prop="name" :label="t('common.labels.name')" min-width="240">
            <template #default="{ row }">
              <span class="product-groups-table__name">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="normalizedName" :label="t('productGroups.normalizedName')" min-width="220" />
          <el-table-column prop="id" label="ID" width="90" />
          <el-table-column width="64" align="right">
            <template #header><span class="sr-only">{{ t('common.labels.actions') }}</span></template>
            <template #default="{ row }">
              <ActionIconButton v-if="canEdit" :label="t('common.actions.edit')" :icon="Edit" @click="openEditDialog(row)" />
            </template>
          </el-table-column>
        </el-table>

        <div class="product-groups-pagination">
          <span>{{ t('productGroups.onPage', { count: groups.length }) }}</span>
          <ZeroPagination v-model:page="page" v-model:size="pageSize" :has-next="hasNext" />
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="dialogOpen" :before-close="draftGuard0.beforeClose"
      :title="editingGroup ? t('productGroups.edit') : t('productGroups.create')"
      width="440"
      @closed="resetDialog"
    >
      <el-form label-position="top" @submit.prevent="saveGroup">
        <el-form-item :label="t('common.labels.name')" required>
          <el-input
            v-model="groupName"
            :placeholder="t('productGroups.namePlaceholder')"
            maxlength="255"
            show-word-limit
            autofocus
          />
        </el-form-item>
        <p v-if="editingGroup" class="product-groups-dialog__normalized">
          {{ t('productGroups.normalizedName') }}: {{ editingGroup.normalizedName }}
        </p>
      </el-form>
      <template #footer>
        <el-button @click="draftGuard0.requestClose">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" :disabled="!canSave" @click="saveGroup">
          {{ t('common.actions.save') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useDialogGuard } from '@/composables/useDialogGuard'
import { computed, onMounted, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import { useI18n } from '@/i18n'
import { searchProductGroups } from '@/services/api/search.ts'
import { upsertProductGroupGraphql, type ProductGroup } from '@/services/graphql/products.ts'
import { usePermissions } from '@/composables/usePermissions.ts'

const { t } = useI18n()
const { hasPermission } = usePermissions()
const canEdit = computed(() => hasPermission('ARTICLES_DETAILS_EDIT'))
const groups = ref<ProductGroup[]>([])
const searchTerm = ref('')
const page = ref(0)
const pageSize = ref(20)
const hasNext = ref(false)
const loading = ref(false)
const loadError = ref(false)
const dialogOpen = ref(false)
const editingGroup = ref<ProductGroup | null>(null)
const groupName = ref('')
const saving = ref(false)
let loadId = 0

const canSave = computed(() => {
  const name = groupName.value.trim()
  return name.length > 0 && name !== editingGroup.value?.name
})

async function loadGroups() {
  const currentLoad = ++loadId
  loading.value = true
  loadError.value = false
  try {
    const result = await searchProductGroups({
      searchTerm: searchTerm.value.trim() || undefined,
      page: page.value,
      size: pageSize.value,
    })
    if (currentLoad !== loadId) return
    groups.value = result
    hasNext.value = result.length === pageSize.value
  } catch {
    if (currentLoad !== loadId) return
    groups.value = []
    hasNext.value = false
    loadError.value = true
  } finally {
    if (currentLoad === loadId) loading.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  if (page.value !== 0) page.value = 0
  else void loadGroups()
}, 300)

function openCreateDialog() {
  editingGroup.value = null
  groupName.value = ''
  dialogOpen.value = true
}

function openEditDialog(group: ProductGroup) {
  editingGroup.value = group
  groupName.value = group.name
  dialogOpen.value = true
}

function resetDialog() {
  editingGroup.value = null
  groupName.value = ''
}

async function saveGroup() {
  if (!canEdit.value || !canSave.value || saving.value) return
  saving.value = true
  try {
    await upsertProductGroupGraphql({
      id: editingGroup.value?.id,
      name: groupName.value.trim(),
    })
    ElNotification({
      title: t('productGroups.saved'),
      type: 'success',
    })
    dialogOpen.value = false
    await loadGroups()
  } catch {
    ElNotification({ title: t('productGroups.saveError'), type: 'error' })
  } finally {
    saving.value = false
  }
}

watch(searchTerm, () => { void debouncedSearch() })
watch([page, pageSize], () => { void loadGroups() })
onMounted(() => { void loadGroups() })

const draftGuard0 = useDialogGuard(dialogOpen, computed(() => saving.value), () => groupName.value)
</script>

<style scoped>
.product-groups-page { min-height: calc(100vh - 56px); background: #f8faf9; }
.product-groups-page__content { padding: 16px; }
.product-groups-card { max-width: 1100px; }
.product-groups-toolbar { display: flex; align-items: center; gap: 10px; padding-bottom: 16px; }
.product-groups-toolbar__search { max-width: 360px; }
.product-groups-table__name { font-weight: 600; color: #0f172a; }
.product-groups-pagination { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px; color: #64748b; font-size: 13px; }
.product-groups-dialog__normalized { margin: 0; color: #64748b; font-size: 13px; }
@media (max-width: 640px) {
  .product-groups-pagination { align-items: flex-start; flex-direction: column; }
}
</style>
