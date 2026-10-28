<template>
  <el-drawer v-model="isOpen" :before-close="draftGuard.beforeClose" :title="t('products.characteristicsManager.title')" direction="rtl" size="min(540px, 100vw)" :lock-scroll="false">
    <div class="characteristics-manager">
      <div class="characteristics-manager__toolbar">
        <el-input
          v-model="searchTerm"
          :prefix-icon="Search"
          :placeholder="t('products.characteristicsManager.search')"
          clearable
        />
        <el-button v-if="canEdit" :icon="Plus" type="primary" @click="openCreate">
          {{ t('common.actions.create') }}
        </el-button>
      </div>

      <form v-if="formOpen" class="characteristics-manager__form" @submit.prevent="save">
        <label>
          <span>{{ t('common.labels.name') }}</span>
          <el-input v-model="name" maxlength="128" show-word-limit autofocus />
        </label>
        <div class="characteristics-manager__form-actions">
          <el-button type="primary" native-type="submit" :loading="saving" :disabled="!canSave">
            {{ t('common.actions.save') }}
          </el-button>
          <el-button @click="draftGuard.requestClose">{{ t('common.actions.cancel') }}</el-button>
        </div>
      </form>

      <div v-loading="loading" class="characteristics-manager__list">
        <div v-for="item in items" :key="item.id" class="characteristics-manager__row">
          <span>{{ item.name }}</span>
          <el-button v-if="canEdit" :icon="Edit" text :aria-label="t('common.actions.edit')" @click="openEdit(item)" />
          <el-button v-if="canEdit" :icon="Delete" text type="danger" :aria-label="t('common.actions.delete')" @click="remove(item)" />
        </div>
        <el-empty v-if="!loading && items.length === 0" :description="t(loadError ? 'products.filterOptionsLoadError' : 'products.characteristicsManager.empty')" />
      </div>

      <div class="characteristics-manager__footer">
        <ZeroPagination v-model:page="page" v-model:size="size" :has-next="hasNext" :sizes="[20, 50, 100]" />
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { useDialogGuard } from '@/composables/useDialogGuard'
import { computed, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import ZeroPagination from '@/components/common/ZeroPagination.vue'
import { deleteCharacteristicGraphql, searchCharacteristicsGraphql, upsertCharacteristicGraphql, type Characteristic } from '@/services/graphql/products.ts'
import { useI18n } from '@/i18n'

defineProps<{ canEdit: boolean }>()
const isOpen = defineModel<boolean>({ required: true })
const { t } = useI18n()
const items = ref<Characteristic[]>([])
const searchTerm = ref('')
const page = ref(0)
const size = ref(20)
const hasNext = ref(false)
const loading = ref(false)
const loadError = ref(false)
const formOpen = ref(false)
const editing = ref<Characteristic | null>(null)
const name = ref('')
const saving = ref(false)
const canSave = computed(() => Boolean(name.value.trim()) && name.value.trim() !== editing.value?.name)
let requestId = 0

async function load() {
  if (!isOpen.value) return
  const currentRequest = ++requestId
  loading.value = true
  loadError.value = false
  try {
    const result = await searchCharacteristicsGraphql({ searchTerm: searchTerm.value.trim(), page: page.value, size: size.value })
    if (currentRequest !== requestId) return
    items.value = result
    hasNext.value = result.length === size.value
  } catch {
    if (currentRequest === requestId) {
      items.value = []
      loadError.value = true
    }
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

const debouncedSearch = useDebounceFn(() => { void load() }, 250)
watch(searchTerm, () => {
  if (page.value !== 0) page.value = 0
  else debouncedSearch()
})
watch([page, size], () => { void load() })
watch(isOpen, (open) => {
  if (open) void load()
  else {
    requestId += 1
    formOpen.value = false
    editing.value = null
    name.value = ''
  }
})

async function openCreate() {
  if (formOpen.value) { await draftGuard.requestClose(); if (formOpen.value) return }
  editing.value = null
  name.value = ''
  formOpen.value = true
}

async function openEdit(item: Characteristic) {
  if (formOpen.value) { await draftGuard.requestClose(); if (formOpen.value) return }
  editing.value = item
  name.value = item.name
  formOpen.value = true
}

async function save() {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    await upsertCharacteristicGraphql({ id: editing.value?.id, name: name.value.trim() })
    formOpen.value = false
    ElNotification({ title: t('products.characteristicsManager.saved'), type: 'success' })
    await load()
  } catch (error) {
    ElNotification({ title: t('products.characteristicsManager.saveError'), message: error instanceof Error ? error.message : undefined, type: 'error' })
  } finally {
    saving.value = false
  }
}

async function remove(item: Characteristic) {
  try {
    await ElMessageBox.confirm(t('products.characteristicsManager.deleteConfirm', { name: item.name }), t('common.actions.delete'), {
      confirmButtonText: t('common.actions.delete'),
      cancelButtonText: t('common.actions.cancel'),
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteCharacteristicGraphql(item.id)
    ElNotification({ title: t('products.characteristicsManager.deleted'), type: 'success' })
    await load()
  } catch (error) {
    ElNotification({ title: t('products.characteristicsManager.deleteError'), message: error instanceof Error ? error.message : undefined, type: 'error' })
  }
}
const draftOpen = computed({ get: () => isOpen.value && formOpen.value, set: value => { if (!value) formOpen.value = false } })
const draftGuard = useDialogGuard(draftOpen, saving, () => name.value)
</script>

<style scoped>
.characteristics-manager { display: flex; height: 100%; min-height: 0; flex-direction: column; }
.characteristics-manager__toolbar { display: flex; gap: 8px; padding: 16px; border-bottom: 1px solid #e2e8f0; }
.characteristics-manager__form { display: grid; gap: 12px; padding: 16px; border-bottom: 1px solid #e2e8f0; }
.characteristics-manager__form label { display: grid; gap: 6px; font-size: 13px; font-weight: 600; }
.characteristics-manager__form-actions { display: flex; gap: 8px; }
.characteristics-manager__list { flex: 1; min-height: 0; overflow: auto; }
.characteristics-manager__row { display: flex; align-items: center; gap: 4px; min-height: 48px; padding: 8px 16px; border-bottom: 1px solid #edf0f2; }
.characteristics-manager__row span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.characteristics-manager__footer { padding: 12px 16px; border-top: 1px solid #e2e8f0; }
</style>
