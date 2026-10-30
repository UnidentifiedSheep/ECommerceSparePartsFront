<template>
  <div class="supplier-extensions-page">
    <PageHeader :title="t('products.supplierExtension.title')" :description="t('products.supplierExtension.description')">
      <template #actions><a :href="downloadUrl" download="SpareParts-supplier-import.zip" class="el-button el-button--primary">{{ t('products.supplierExtension.download') }}</a></template>
    </PageHeader>
    <main class="supplier-extensions-content">
      <section class="supplier-extensions-panel">
        <h2>{{ t('products.supplierExtension.sites') }}</h2>
        <p class="supplier-extensions-meta">Chrome / Edge · v{{ manifest.version }}</p>
        <ul class="supplier-sites">
          <li><strong>Armtek</strong><code>etp.armtek.ru</code><span>{{ t('products.supplierExtension.searchPage') }}</span></li>
          <li><strong>Truck Motors</strong><code>market.tmtr.ru/goods/…</code><span>{{ t('products.supplierExtension.goodsPage') }}</span></li>
        </ul>
        <el-alert :title="t('products.supplierExtension.loadedOnly')" type="info" :closable="false" show-icon />
      </section>
      <section class="supplier-extensions-panel">
        <h2>{{ t('products.supplierExtension.installTitle') }}</h2>
        <ol>
          <li>{{ t('products.supplierExtension.extract') }}</li>
          <li>{{ t('products.supplierExtension.extensions') }} <code>chrome://extensions</code> / <code>edge://extensions</code>.</li>
          <li>{{ t('products.supplierExtension.load') }}</li>
          <li>{{ t('products.supplierExtension.collect') }}</li>
          <li>{{ t('products.supplierExtension.import') }}</li>
        </ol>
        <p class="supplier-extensions-meta">{{ t('products.supplierExtension.update') }}</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue'
import { useI18n } from '@/i18n'
import manifest from '../../extensions/supplier-import/manifest.json'
const { t } = useI18n()
const downloadUrl = `${import.meta.env.BASE_URL}downloads/supplier-import-extension.zip?v=${manifest.version}`
</script>

<style scoped>
.supplier-extensions-page { min-height: calc(100vh - var(--app-viewport-offset, 56px)); background: var(--app-surface-tinted); }
.supplier-extensions-content { max-width: 1000px; padding: 20px; display: grid; gap: 16px; }
.supplier-extensions-panel { padding: 20px; background: var(--app-surface, #fff); border: 1px solid var(--app-border); border-radius: 8px; }
.supplier-extensions-panel h2 { margin: 0 0 12px; font-size: 18px; font-weight: 600; }
.supplier-extensions-panel ol { list-style: decimal; padding-left: 22px; margin: 16px 0; }
.supplier-extensions-panel li { margin: 10px 0; }
.supplier-extensions-panel code { overflow-wrap: anywhere; }
.supplier-sites { display: grid; gap: 8px; margin: 16px 0; }
.supplier-sites li { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 0; }
.supplier-sites strong { min-width: 110px; }
.supplier-extensions-meta, .supplier-sites span { color: var(--el-text-color-secondary); font-size: var(--el-font-size-small); }
@media(max-width: 600px) { .supplier-extensions-content { padding: 12px; } .supplier-extensions-panel { padding: 16px; } }
</style>
