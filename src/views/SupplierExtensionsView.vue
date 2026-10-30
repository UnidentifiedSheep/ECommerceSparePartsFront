<template>
  <div class="supplier-extensions-page">
    <PageHeader :title="t('products.supplierExtension.title')" :description="t('products.supplierExtension.description')">
      <template #actions>
        <div class="supplier-extension-downloads">
          <a :href="downloadUrl" class="el-button">{{ t('products.supplierExtension.download') }}</a>
          <a :href="firefoxUrl" class="el-button el-button--primary">{{ t('products.supplierExtension.downloadFirefox') }}</a>
        </div>
      </template>
    </PageHeader>
    <main class="supplier-extensions-content">
      <section class="supplier-extensions-panel">
        <h2>{{ t('products.supplierExtension.sites') }}</h2>
        <p class="supplier-extensions-meta">Chrome / Edge / Firefox</p>
        <ul class="supplier-sites">
          <li><strong>Armtek</strong><code>etp.armtek.ru</code><span>{{ t('products.supplierExtension.armtekPages') }}</span></li>
          <li><strong>Truck Motors</strong><code>market.tmtr.ru/goods/…</code><span>{{ t('products.supplierExtension.goodsPage') }}</span></li>
          <li><strong>Favorit Parts</strong><code>lk.favorit-parts.ru/analogues/</code><span>{{ t('products.supplierExtension.goodsPage') }}</span></li>
        </ul>
        <el-alert :title="t('products.supplierExtension.loadedOnly')" type="info" :closable="false" show-icon />
      </section>
      <section class="supplier-extensions-panel">
        <h2>{{ t('products.supplierExtension.installTitle') }}</h2>
        <ol>
          <li>{{ t('products.supplierExtension.extract') }}</li>
          <li>
            {{ t('products.supplierExtension.extensions') }} <code>chrome://extensions</code> / <code>edge://extensions</code>.
            <p>Firefox: <code>about:addons</code> — {{ t('products.supplierExtension.firefoxLoad') }}</p>
          </li>
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
const { t } = useI18n()
const downloadUrl = 'https://github.com/UnidentifiedSheep/ecommerce-extensions/releases/latest/download/supplier-import-extension.zip'
const firefoxUrl = 'https://github.com/UnidentifiedSheep/ecommerce-extensions/releases/latest/download/supplier-import-firefox.xpi'
</script>

<style scoped>
.supplier-extensions-page { min-height: calc(100vh - var(--app-viewport-offset, 56px)); background: var(--app-surface-tinted); }
.supplier-extension-downloads { display: flex; flex-wrap: wrap; gap: 8px; }
.supplier-extension-downloads .el-button { margin-left: 0; }
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
