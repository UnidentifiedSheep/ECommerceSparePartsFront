<template>
  <main class="not-found-page">
    <section class="not-found-panel" aria-labelledby="not-found-title">
      <div class="not-found-heading">
        <el-icon class="not-found-heading__icon" aria-hidden="true"><Tools /></el-icon>

        <div>
          <p class="not-found-error">{{ t('notFoundPage.errorCode') }}</p>
          <h1 id="not-found-title">{{ t('notFoundPage.title') }}</h1>
          <p class="not-found-description">{{ t('notFoundPage.description') }}</p>
        </div>
      </div>

      <div class="not-found-body">
        <div class="not-found-path">
          <div>
            <span>{{ t('notFoundPage.requestedPath') }}</span>
            <code :title="route.fullPath">{{ route.fullPath }}</code>
          </div>

          <el-tooltip :content="t('notFoundPage.copyAddress')" placement="top">
            <el-button
              :aria-label="t('notFoundPage.copyAddress')"
              :icon="CopyDocument"
              class="not-found-copy"
              @click="copyAddress"
            />
          </el-tooltip>
        </div>

        <div class="not-found-suggestion">
          <el-icon aria-hidden="true"><InfoFilled /></el-icon>
          <span>{{ t('notFoundPage.suggestion', { section: t(suggestedSection.label) }) }}</span>
          <button type="button" @click="router.push(suggestedSection.to)">
            {{ t('notFoundPage.openSection') }}
          </button>
        </div>

        <div class="not-found-actions">
          <el-button :icon="Back" @click="goBack">{{ t('notFoundPage.back') }}</el-button>
          <el-button :icon="HomeFilled" type="primary" @click="router.push('/')">
            {{ t('notFoundPage.home') }}
          </el-button>
          <el-button :icon="suggestedSection.icon" @click="router.push(suggestedSection.to)">
            {{ t(suggestedSection.label) }}
          </el-button>
        </div>

        <nav class="not-found-shortcuts" :aria-label="t('notFoundPage.frequentSections')">
          <h2>{{ t('notFoundPage.frequentSections') }}</h2>
          <div class="not-found-shortcuts__grid">
            <button
              v-for="shortcut in shortcuts"
              :key="shortcut.to"
              type="button"
              @click="router.push(shortcut.to)"
            >
              <el-icon aria-hidden="true"><component :is="shortcut.icon" /></el-icon>
              <span>{{ t(shortcut.label) }}</span>
              <el-icon class="not-found-shortcuts__arrow" aria-hidden="true"><ArrowRight /></el-icon>
            </button>
          </div>
        </nav>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ArrowRight,
  Back,
  Box,
  CopyDocument,
  DataAnalysis,
  HomeFilled,
  InfoFilled,
  Key,
  Tickets,
  Tools,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const sections = {
  operations: { label: 'nav.operations', to: '/sales', icon: Tickets },
  catalog: { label: 'nav.catalog', to: '/products', icon: Box },
  admin: { label: 'nav.admin', to: '/users', icon: Key },
  control: { label: 'nav.control', to: '/jobs', icon: DataAnalysis },
}

const shortcuts = Object.values(sections)

const suggestedSection = computed(() => {
  const path = route.path.toLowerCase()

  if (/\/(sales|purchases|reservations|transactions)/.test(path)) return sections.operations
  if (/\/(users|roles|permissions|currencies|settings)/.test(path)) return sections.admin
  if (/\/(analytics|jobs)/.test(path)) return sections.control
  return sections.catalog
})

async function copyAddress() {
  await navigator.clipboard.writeText(window.location.href)
  ElMessage.success(t('notFoundPage.addressCopied'))
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.push('/')
}
</script>

<style scoped>
.not-found-page {
  display: grid;
  min-height: calc(100dvh - 56px);
  place-items: center;
  background: #f6f8f7;
  padding: 32px 24px;
}

.not-found-panel {
  width: min(100%, 760px);
  border: 1px solid #d8e0dc;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgb(15 23 42 / 5%);
  padding: 32px;
}

.not-found-heading {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 20px;
}

.not-found-heading__icon {
  width: 56px;
  height: 56px;
  color: #7b8580;
  font-size: 52px;
}

.not-found-error {
  margin: 0 0 6px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.not-found-heading h1 {
  margin: 0;
  color: #0f172a;
  font-size: 26px;
  font-weight: 720;
  line-height: 1.25;
}

.not-found-description {
  margin: 8px 0 0;
  color: #475569;
  font-size: 15px;
  line-height: 1.55;
}

.not-found-body {
  margin-left: 92px;
}

.not-found-path {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 18px;
  border: 1px solid #dfe4e1;
  border-radius: 7px;
  background: #f7f9f8;
  padding: 12px 12px 12px 14px;
}

.not-found-path > div {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 5px;
}

.not-found-path span {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.not-found-path code {
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.not-found-copy {
  flex: 0 0 auto;
}

.not-found-suggestion {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  border-left: 3px solid #168a49;
  border-radius: 4px;
  background: #edf6f0;
  color: #315746;
  padding: 11px 12px;
  font-size: 13px;
  line-height: 1.45;
}

.not-found-suggestion button {
  border: 0;
  background: transparent;
  color: #047857;
  cursor: pointer;
  font: inherit;
  font-weight: 650;
  white-space: nowrap;
}

.not-found-suggestion button:hover {
  text-decoration: underline;
}

.not-found-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.not-found-actions .el-button + .el-button {
  margin-left: 0;
}

.not-found-shortcuts {
  margin-top: 26px;
}

.not-found-shortcuts h2 {
  margin: 0 0 9px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.not-found-shortcuts__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.not-found-shortcuts__grid button {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  border: 1px solid #dfe4e1;
  border-radius: 7px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  padding: 0 12px;
  text-align: left;
  transition: border-color 140ms ease, background-color 140ms ease;
}

.not-found-shortcuts__grid button:hover {
  border-color: #aebbb4;
  background: #f7f9f8;
  color: #0f172a;
}

.not-found-shortcuts__arrow {
  color: #94a3b8;
  opacity: 0;
  transition: opacity 140ms ease;
}

.not-found-shortcuts__grid button:hover .not-found-shortcuts__arrow {
  opacity: 1;
}

@media (max-width: 680px) {
  .not-found-page {
    place-items: start stretch;
    padding: 28px 16px;
  }

  .not-found-panel {
    padding: 22px 18px;
  }

  .not-found-heading {
    grid-template-columns: 44px minmax(0, 1fr);
    gap: 12px;
  }

  .not-found-heading__icon {
    width: 38px;
    height: 38px;
    font-size: 36px;
  }

  .not-found-heading h1 {
    font-size: 23px;
  }

  .not-found-body {
    margin-left: 0;
  }

  .not-found-suggestion {
    grid-template-columns: 18px minmax(0, 1fr);
  }

  .not-found-suggestion button {
    grid-column: 2;
    justify-self: start;
    padding: 0;
  }

  .not-found-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .not-found-actions .el-button {
    width: 100%;
  }

  .not-found-actions .el-button:last-child {
    grid-column: 1 / -1;
  }

  .not-found-shortcuts__grid {
    grid-template-columns: 1fr;
  }
}
</style>
