<template>
  <el-drawer
    v-model="isOpen"
    :title="t('productGroups.title')"
    direction="rtl"
    size="min(540px, 100vw)"
    class="product-groups-drawer"
    :lock-scroll="false"
  >
    <div class="product-groups-manager">
      <div class="product-groups-manager__toolbar">
        <el-input
          v-model="searchTerm"
          :prefix-icon="Search"
          :placeholder="t('productGroups.searchPlaceholder')"
          :aria-label="t('productGroups.searchPlaceholder')"
          clearable
        />
        <el-button :icon="Plus" type="primary" @click="openCreateForm">
          {{ t('common.actions.create') }}
        </el-button>
      </div>

      <form v-if="formOpen" class="product-groups-manager__form" @submit.prevent="saveGroup">
        <div class="product-groups-manager__form-heading">
          <strong>{{ editingGroup ? t('productGroups.edit') : t('productGroups.create') }}</strong>
          <el-button text size="small" @click="closeForm">{{ t('common.actions.cancel') }}</el-button>
        </div>
        <label class="product-groups-manager__field">
          <span>{{ t('common.labels.name') }}</span>
          <el-input
            v-model="groupName"
            :placeholder="t('productGroups.namePlaceholder')"
            maxlength="255"
            show-word-limit
            autofocus
          />
        </label>
        <p v-if="editingGroup" class="product-groups-manager__normalized">
          {{ t('productGroups.normalizedName') }}: {{ editingGroup.normalizedName }}
        </p>
        <el-button type="primary" native-type="submit" :loading="saving" :disabled="!canSave">
          {{ t('common.actions.save') }}
        </el-button>
      </form>

      <div v-loading="loading" class="product-groups-manager__list">
        <ul v-if="groups.length" class="product-groups-manager__rows">
          <li v-for="group in groups" :key="group.id" class="product-groups-manager__row">
            <div class="product-groups-manager__row-text">
              <strong>{{ group.name }}</strong>
              <span>{{ group.normalizedName }}</span>
            </div>
            <span class="product-groups-manager__id">#{{ group.id }}</span>
            <ActionIconButton :label="t('common.actions.edit')" :icon="Edit" @click="openEditForm(group)" />
          </li>
        </ul>
        <div v-else-if="!loading" class="product-groups-manager__empty">
          <span>{{ t(loadError ? 'productGroups.loadError' : 'productGroups.empty') }}</span>
          <el-button v-if="loadError" text type="primary" @click="loadGroups">
            {{ t('common.actions.refresh') }}
          </el-button>
        </div>
      </div>

      <div class="product-groups-manager__footer">
        <span>{{ t('productGroups.onPage', { count: groups.length }) }}</span>
        <ZeroPagination v-model:page="page" v-model:size="pageSize" :has-next="hasNext" />
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Edit, Plus, Search } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import { useI18n } from '@/i18n'
import { searchProductGroups } from '@/services/api/search.ts'
import { upsertProductGroupGraphql, type ProductGroup } from '@/services/graphql/products.ts'

const isOpen = defineModel<boolean>({ required: true })
const emit = defineEmits<{ saved: [group: ProductGroup] }>()
const { t } = useI18n()
const groups = ref<ProductGroup[]>([])
const searchTerm = ref('')
const page = ref(0)
const pageSize = ref(20)
const hasNext = ref(false)
const loading = ref(false)
const loadError = ref(false)
const formOpen = ref(false)
const editingGroup = ref<ProductGroup | null>(null)
const groupName = ref('')
const saving = ref(false)
let loadId = 0

const canSave = computed(() => {
  const name = groupName.value.trim()
  return name.length > 0 && name !== editingGroup.value?.name
})

async function loadGroups() {
  if (!isOpen.value) return
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

function openCreateForm() {
  editingGroup.value = null
  groupName.value = ''
  formOpen.value = true
}

function openEditForm(group: ProductGroup) {
  editingGroup.value = group
  groupName.value = group.name
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingGroup.value = null
  groupName.value = ''
}

async function saveGroup() {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    const saved = await upsertProductGroupGraphql({
      id: editingGroup.value?.id,
      name: groupName.value.trim(),
    })
    ElNotification({ title: t('productGroups.saved'), type: 'success' })
    closeForm()
    emit('saved', saved)
    await loadGroups()
  } catch {
    ElNotification({ title: t('productGroups.saveError'), type: 'error' })
  } finally {
    saving.value = false
  }
}

watch(isOpen, (open) => {
  if (open) void loadGroups()
  else {
    loadId += 1
    loading.value = false
    closeForm()
  }
})
watch(searchTerm, () => { if (isOpen.value) void debouncedSearch() })
watch(page, () => { if (isOpen.value) void loadGroups() })
watch(pageSize, () => {
  if (!isOpen.value) return
  if (page.value !== 0) page.value = 0
  else void loadGroups()
})
</script>

<style>
.product-groups-drawer .el-drawer__header {
  margin-bottom: 0;
  border-bottom: 1px solid #dfe3e8;
  padding: 18px 20px;
}
.product-groups-drawer .el-drawer__body { min-height: 0; padding: 0; }
</style>

<style scoped>
.product-groups-manager { display: flex; height: 100%; min-height: 0; flex-direction: column; }
.product-groups-manager__toolbar { display: flex; flex: 0 0 auto; gap: 8px; border-bottom: 1px solid #e2e8f0; padding: 16px 20px; }
.product-groups-manager__form { display: grid; flex: 0 0 auto; gap: 12px; border-bottom: 1px solid #e2e8f0; background: #fafcfb; padding: 16px 20px; }
.product-groups-manager__form-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.product-groups-manager__form-heading strong { color: #0f172a; font-size: 14px; }
.product-groups-manager__field { display: grid; gap: 6px; color: #475569; font-size: 13px; font-weight: 600; }
.product-groups-manager__normalized { margin: 0; color: #64748b; font-size: 12px; }
.product-groups-manager__form > .el-button { justify-self: start; }
.product-groups-manager__list { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; }
.product-groups-manager__rows { margin: 0; padding: 0; list-style: none; }
.product-groups-manager__row { display: flex; min-height: 66px; align-items: center; gap: 12px; border-bottom: 1px solid #edf0f2; padding: 10px 20px; }
.product-groups-manager__row-text { display: grid; min-width: 0; flex: 1; gap: 3px; }
.product-groups-manager__row-text strong { overflow: hidden; color: #0f172a; font-size: 14px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.product-groups-manager__row-text span { overflow: hidden; color: #64748b; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.product-groups-manager__id { flex: 0 0 auto; color: #94a3b8; font-size: 12px; }
.product-groups-manager__empty { display: flex; min-height: 160px; align-items: center; justify-content: center; gap: 8px; color: #64748b; font-size: 14px; }
.product-groups-manager__footer { display: grid; flex: 0 0 auto; gap: 10px; border-top: 1px solid #dfe3e8; padding: 12px 20px; color: #64748b; font-size: 12px; }
@media (max-width: 540px) {
  .product-groups-manager__toolbar { padding: 12px 16px; }
  .product-groups-manager__form { padding: 16px; }
  .product-groups-manager__row { padding: 10px 16px; }
  .product-groups-manager__footer { padding: 12px 16px; }
}
</style>
