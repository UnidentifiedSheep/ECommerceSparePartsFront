<template>
  <div class="document-link-page">
    <PageHeader :title="t('documents.preparingTitle')" :description="t('documents.preparingDescription')" />
    <div class="document-link-panel">
      <el-icon v-if="status === 'loading'" class="is-loading" :size="30"><Loading /></el-icon>
      <el-icon v-else :size="30" color="var(--el-color-warning)"><Warning /></el-icon>
      <h2>{{ status === 'loading' ? t('documents.waiting') : status === 'pending' ? t('documents.notReady') : t('documents.linkError') }}</h2>
      <p v-if="status === 'error'">{{ errorMessage }}</p>
      <p v-else>{{ t('documents.linkHint') }}</p>
      <div class="document-link-actions">
        <el-button v-if="status !== 'loading'" type="primary" @click="resolveLink">{{ t('documents.retry') }}</el-button>
        <el-button plain @click="router.push('/documents')">{{ t('documents.backToDocuments') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading, Warning } from '@element-plus/icons-vue'
import { getDocumentLink } from '@/services/graphql/documents.ts'
import { useI18n } from '@/i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const status = ref<'loading' | 'pending' | 'error'>('loading')
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
    const url = await getDocumentLink(requestId)
    if (!active) return
    const destination = new URL(url, window.location.origin)
    if (!['https:', 'http:'].includes(destination.protocol)) throw new Error(t('documents.invalidLink'))
    window.location.replace(destination.href)
  } catch (error) {
    if (!active) return
    const gqlErrors = error && typeof error === 'object' && 'graphQLErrors' in error
      ? error.graphQLErrors as Array<{ extensions?: Record<string, unknown> }> : []
    const pending = gqlErrors.some((item) => item.extensions?.code === 'DocumentNotReadyException')
    status.value = pending ? 'pending' : 'error'
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
