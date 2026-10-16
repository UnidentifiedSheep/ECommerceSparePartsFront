<template>
  <section class="product-filter-section">
    <button
      type="button"
      class="product-filter-section__toggle"
      :aria-expanded="open"
      :aria-controls="contentId"
      @click="open = !open"
    >
      <span>{{ title }}</span>
      <el-icon :class="{ 'is-open': open }"><ArrowDown /></el-icon>
    </button>
    <div :id="contentId" v-show="open" class="product-filter-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { useId } from 'vue'

defineProps<{ title: string }>()
const open = defineModel<boolean>('open', { required: true })
const contentId = useId()
</script>

<style scoped>
.product-filter-section {
  margin-top: 8px;
  overflow: hidden;
  border: 1px solid #dfe3e8;
  border-radius: 7px;
  background: #fff;
}

.product-filter-section__toggle {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 0;
  background: transparent;
  padding: 9px 12px;
  color: #334155;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
}

.product-filter-section__toggle:hover { background: #f8fafc; }
.product-filter-section__toggle:focus-visible { outline: 2px solid #86bda4; outline-offset: -2px; }
.product-filter-section__toggle .el-icon { flex: 0 0 auto; color: #64748b; transition: transform 150ms ease; }
.product-filter-section__toggle .el-icon.is-open { transform: rotate(180deg); }
.product-filter-section__body { border-top: 1px solid #edf0f2; padding: 12px; }
</style>
