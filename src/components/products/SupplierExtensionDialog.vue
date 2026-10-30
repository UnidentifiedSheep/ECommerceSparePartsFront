<template>
  <el-dialog v-model="open" :title="t('products.supplierExtension.title')" width="min(640px, calc(100vw - 24px))" append-to-body class="supplier-extension-dialog">
    <p>{{ t('products.supplierExtension.description') }}</p>
    <p class="supplier-extension-meta">Chrome / Edge · v{{ manifest.version }} · etp.armtek.ru</p>
    <ol>
      <li>{{ t('products.supplierExtension.extract') }}</li>
      <li>{{ t('products.supplierExtension.extensions') }} <code>chrome://extensions</code> / <code>edge://extensions</code>.</li>
      <li>{{ t('products.supplierExtension.load') }}</li>
      <li>{{ t('products.supplierExtension.collect') }}</li>
      <li>{{ t('products.supplierExtension.import') }}</li>
    </ol>
    <el-alert :title="t('products.supplierExtension.loadedOnly')" type="info" :closable="false" show-icon />
    <p class="supplier-extension-meta">{{ t('products.supplierExtension.update') }}</p>
    <template #footer>
      <el-button @click="open = false">{{ t('common.actions.close') }}</el-button>
      <a :href="downloadUrl" download="SpareParts-supplier-import.zip" class="el-button el-button--primary">{{ t('products.supplierExtension.download') }}</a>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from '@/i18n'
import manifest from '../../../extensions/supplier-import/manifest.json'
const open = defineModel<boolean>({ required: true })
const { t } = useI18n()
const downloadUrl = `${import.meta.env.BASE_URL}downloads/supplier-import-extension.zip`
</script>

<style>
.supplier-extension-dialog { max-height: 90dvh; overflow: auto; }
.supplier-extension-dialog p { margin: 0 0 12px; }
.supplier-extension-dialog ol { list-style: decimal; padding-left: 22px; margin: 16px 0; }
.supplier-extension-dialog li { margin: 10px 0; }
.supplier-extension-meta { color: var(--el-text-color-secondary); font-size: var(--el-font-size-small); }
.supplier-extension-dialog .supplier-extension-meta:last-child { margin-top: 12px; }
.supplier-extension-dialog .el-dialog__footer { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.supplier-extension-dialog .el-dialog__footer .el-button { margin-left: 0; }
</style>
