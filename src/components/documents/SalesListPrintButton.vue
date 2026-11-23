<template>
  <el-button plain :loading="busy" :disabled="disabled" :title="t('documents.salesListHint')" @click="generate">{{ t('documents.printSalesList') }}</el-button>
  <el-dialog v-model="open" :title="t('documents.printSalesList')" width="min(480px, 94vw)">
    <p>{{ t('documents.salesListHint') }}</p>
    <p>{{ t('documents.requestSubmitted') }}</p>
    <template #footer><el-button @click="open = false">{{ t('common.actions.close') }}</el-button><RouterLink v-if="created" :to="{ name: 'document-link', params: { requestId: created.requestId } }"><el-button type="primary">{{ t('documents.viewRequest') }}</el-button></RouterLink></template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from '@/i18n'
import { usePermissions } from '@/composables/usePermissions'
import { createSalesListDocumentRequest, type DocumentRequest, type SalesListFilters } from '@/services/graphql/documents'
const props = defineProps<{ filters: SalesListFilters; disabled?: boolean }>()
const { t } = useI18n()
const { hasPermission } = usePermissions()
const busy = ref(false), open = ref(false), created = ref<DocumentRequest>()
async function generate() {
  if (busy.value || props.disabled || !hasPermission('SALES_GET') || !hasPermission('DOCUMENTS_ME', 'DOCUMENTS_ALL')) return
  const filters = JSON.parse(JSON.stringify(props.filters)) as SalesListFilters
  busy.value = true
  try { created.value = await createSalesListDocumentRequest(filters); open.value = true }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : t('documents.generateError')) }
  finally { busy.value = false }
}
</script>
