<template>
  <section class="document-requests" :aria-label="t('documents.history')">
    <div class="document-requests__toolbar">
      <div>
        <h2>{{ t('documents.history') }}</h2>
        <p>{{ t('documents.historyHint') }}</p>
      </div>
      <div class="document-requests__filters">
        <el-select v-model="documentSystemName" clearable :placeholder="t('documents.allTemplates')" :aria-label="t('documents.allTemplates')">
          <el-option v-for="definition in definitions" :key="definition.systemName" :label="definition.name" :value="definition.systemName" />
        </el-select>
        <el-button plain :loading="loading" @click="loadRequests(true)">{{ t('common.actions.refresh') }}</el-button>
      </div>
    </div>

    <el-alert v-if="error" type="error" :title="error" show-icon :closable="false" class="document-requests__error" />

    <div class="document-requests__table">
      <div class="document-requests__header">
        <SortableColumnHeader :label="t('documents.documentColumn')" field="documentSystemName" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSort" />
        <SortableColumnHeader :label="t('documents.createdAt')" field="createdAt" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSort" />
        <SortableColumnHeader :label="t('documents.status')" field="status" :sort-by="sortBy" :title="t('products.multiSortHint')" @toggle="handleSort" />
        <span>{{ t('documents.actions') }}</span>
      </div>
      <div v-loading="loading && !requests.length" class="document-requests__rows">
        <el-empty v-if="!loading && !requests.length" :description="t('documents.historyEmpty')" />
        <div v-for="request in requests" :key="request.requestId" class="document-requests__row">
          <strong>{{ documentName(request.documentSystemName) }}</strong>
          <time :datetime="request.createdAt">{{ formatDate(request.createdAt) }}</time>
          <span class="document-requests__status" :class="`document-requests__status--${request.status.toLowerCase()}`">{{ t(`documents.statuses.${request.status}`) }}</span>
          <RouterLink :to="{ name: 'document-link', params: { requestId: request.requestId } }">
            {{ request.fileLink ? t('documents.download') : t('documents.viewRequest') }}
          </RouterLink>
        </div>
      </div>
    </div>

    <div class="document-requests__footer">
      <span>{{ t('documents.loadedCount', { count: requests.length }) }}</span>
      <el-button v-if="hasMore" plain :loading="loading" @click="loadRequests(false)">{{ t('common.actions.loadMore') }}</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from '@/i18n'
import { useMultiSort, sortField } from '@/composables/useMultiSort.ts'
import SortableColumnHeader from '@/components/common/SortableColumnHeader.vue'
import { searchDocuments, type DocumentDefinition, type DocumentRequest } from '@/services/graphql/documents.ts'

const props = defineProps<{ definitions: DocumentDefinition[]; newRequest?: DocumentRequest | null }>()
const { t, locale } = useI18n()
const { sortBy, toggleSort } = useMultiSort(['-createdAt'])
const documentSystemName = ref('')
const requests = ref<DocumentRequest[]>(props.newRequest ? [props.newRequest] : [])
const loading = ref(false)
const hasMore = ref(false)
const error = ref('')
const page = ref(0)
const pageSize = 20
let requestVersion = 0

function documentName(systemName: string) {
  return props.definitions.find((definition) => definition.systemName === systemName)?.name ?? systemName
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function handleSort(field: string, event: MouseEvent) {
  toggleSort(field, event)
  void loadRequests(true)
}

async function loadRequests(reset: boolean) {
  if (loading.value && !reset) return
  const version = ++requestVersion
  const nextPage = reset ? 0 : page.value + 1
  loading.value = true
  error.value = ''
  try {
    const result = await searchDocuments({
      documentSystemName: documentSystemName.value || undefined,
      pagination: { page: nextPage, size: pageSize },
      sortBy: sortBy.value.map((value) => ({ field: sortField(value), isDescending: value.startsWith('-') })),
    })
    if (version !== requestVersion) return
    if (reset) {
      const created = props.newRequest && !documentSystemName.value && sortBy.value.length === 1 && sortBy.value[0] === '-createdAt'
        && !result.some((item) => item.requestId === props.newRequest?.requestId)
        ? [props.newRequest] : []
      requests.value = [...created, ...result]
    } else {
      requests.value = [...requests.value, ...result.filter((item) => !requests.value.some((existing) => existing.requestId === item.requestId))]
    }
    page.value = nextPage
    hasMore.value = result.length === pageSize
  } catch (cause) {
    if (version === requestVersion) error.value = cause instanceof Error ? cause.message : t('documents.historyLoadError')
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

onMounted(() => { void loadRequests(true) })
watch(documentSystemName, () => { void loadRequests(true) })
</script>

<style scoped>
.document-requests { display: flex; flex: 1; min-height: 0; flex-direction: column; overflow: hidden; margin: 0 24px 24px; border: 1px solid var(--app-border); border-radius: 8px; background: var(--app-surface); }
.document-requests__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 20px; border-bottom: 1px solid var(--app-border); }
.document-requests__toolbar h2 { margin: 0; color: var(--app-text); font-size: 18px; }
.document-requests__toolbar p { margin: 3px 0 0; color: var(--app-text-muted); font-size: 13px; }
.document-requests__filters { display: flex; align-items: center; gap: 8px; }
.document-requests__filters .el-select { width: 220px; }
.document-requests__error { margin: 12px 20px 0; width: auto; }
.document-requests__table { display: grid; flex: 1; min-height: 0; grid-template-rows: auto minmax(0, 1fr); }
.document-requests__header, .document-requests__row { display: grid; grid-template-columns: minmax(200px, 2fr) minmax(170px, 1.3fr) minmax(120px, 1fr) 120px; align-items: center; gap: 16px; padding: 12px 20px; }
.document-requests__header { border-bottom: 1px solid var(--app-border); background: var(--app-bg-soft); color: var(--app-text-muted); font-size: 13px; font-weight: 650; }
.document-requests__rows { min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.document-requests__row { border-bottom: 1px solid var(--app-border); font-size: 13px; }
.document-requests__row strong { overflow: hidden; color: var(--app-text); text-overflow: ellipsis; white-space: nowrap; }
.document-requests__row time { color: var(--app-text-muted); font-variant-numeric: tabular-nums; }
.document-requests__row a { justify-self: start; color: var(--app-primary); text-decoration: underline; text-underline-offset: 2px; }
.document-requests__row a:focus-visible { outline: 2px solid var(--app-primary); outline-offset: 2px; }
.document-requests__status { color: var(--app-text-muted); }
.document-requests__status--succeeded { color: var(--app-primary); }
.document-requests__status--failed, .document-requests__status--cancelled { color: var(--el-color-danger); }
.document-requests__footer { display: flex; align-items: center; justify-content: space-between; min-height: 56px; border-top: 1px solid var(--app-border); padding: 10px 20px; color: var(--app-text-muted); font-size: 13px; }
@media (max-width: 850px) {
  .document-requests__header, .document-requests__row { grid-template-columns: minmax(160px, 2fr) minmax(135px, 1fr) minmax(100px, 1fr) 100px; gap: 10px; }
}
@media (max-width: 680px) {
  .document-requests { min-height: 420px; overflow: visible; margin: 0 16px 18px; }
  .document-requests__toolbar { align-items: stretch; flex-direction: column; }
  .document-requests__filters .el-select { flex: 1; min-width: 0; }
  .document-requests__header { display: none; }
  .document-requests__rows { max-height: 60vh; }
  .document-requests__row { grid-template-columns: 1fr auto; gap: 5px 12px; }
  .document-requests__row strong { grid-column: 1; }
  .document-requests__row time { grid-column: 1; grid-row: 2; }
  .document-requests__row .document-requests__status { grid-column: 2; grid-row: 1; }
  .document-requests__row a { grid-column: 2; grid-row: 2; }
}
</style>
