<template>
  <div class="document-link-page">
    <PageHeader :title="t('documents.preparingTitle')" :description="status === 'started' ? t('documents.downloadStartedHint') : t('documents.preparingDescription')" />
    <div class="document-link-panel">
      <el-icon v-if="status === 'loading'" class="is-loading" :size="30"><Loading /></el-icon>
      <el-icon v-else-if="status === 'started'" :size="30" color="var(--el-color-success)"><CircleCheck /></el-icon>
      <el-icon v-else :size="30" color="var(--el-color-warning)"><Warning /></el-icon>
      <h2>{{ status === 'loading' ? t('documents.waiting') : status === 'started' ? t('documents.downloadStarted') : status === 'pending' ? t('documents.notReady') : t('documents.linkError') }}</h2>
      <p v-if="status === 'error'">{{ errorMessage }}</p>
      <p v-else-if="status === 'started'">{{ t('documents.downloadStartedHint') }}</p>
      <p v-else>{{ t('documents.linkHint') }}</p>
      <div class="document-link-actions">
        <el-button v-if="status !== 'loading'" type="primary" @click="resolveLink">{{ status === 'started' ? t('documents.downloadAgain') : t('documents.retry') }}</el-button>
        <el-button plain @click="router.push('/documents')">{{ t('documents.backToDocuments') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleCheck, Loading, Warning } from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { getDocumentById } from '@/services/graphql/documents.ts'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const status = ref<'loading' | 'pending' | 'error' | 'started'>('loading')
const errorMessage = ref('')
let active = true

async function resolveLink() {
  if (!active) return
  const requestId = String(route.params.requestId ?? '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
    status.value = 'error'
    errorMessage.value = t('documents.invalidRequestId')
    return
  }
  status.value = 'loading'
  try {
    const document = await getDocumentById(requestId)
    if (!active) return
    if (!document) throw new Error(t('documents.requestNotFound'))
    if (!document.fileLink) {
      if (document.status === 'FAILED' || document.status === 'CANCELLED') {
        throw new Error(t('documents.generationFailed'))
      }
      if (document.status === 'SUCCEEDED') throw new Error(t('documents.linkUnavailable'))
      status.value = 'pending'
      return
    }
    const destination = new URL(document.fileLink.url, window.location.origin)
    if (!['https:', 'http:'].includes(destination.protocol)) throw new Error(t('documents.invalidLink'))
    status.value = 'started'
    window.location.replace(destination.href)
  } catch (error) {
    if (!active) return
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : t('documents.linkError')
  }
}

watch(() => route.params.requestId, () => { void resolveLink() })
onMounted(() => { void resolveLink() })
onBeforeUnmount(() => { active = false })
</script>

<style scoped>
.document-link-panel { max-width: 490px; margin: 60px auto; padding: 32px; text-align: center; border: 1px solid var(--el-border-color-light); border-radius: 8px; background: var(--el-bg-color); }
.document-link-panel h2 { margin: 14px 0 8px; font-size: 18px; }
.document-link-panel p { color: var(--el-text-color-secondary); line-height: 1.5; }
.document-link-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
</style>
