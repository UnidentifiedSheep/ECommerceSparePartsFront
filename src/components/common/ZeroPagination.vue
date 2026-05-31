<template>
  <div class="flex flex-wrap items-center gap-3">
    <el-select v-model="size" class="page-size-select" placeholder="Размер">
      <el-option v-for="option in sizes" :key="option" :label="option" :value="option" />
    </el-select>

    <el-button :disabled="page <= 0" @click="page -= 1">Назад</el-button>
    <span class="min-w-24 text-center text-sm text-slate-600">Страница {{ page + 1 }}</span>
    <el-button :disabled="!hasNext" @click="page += 1">Вперёд</el-button>
  </div>
</template>

<script setup lang="ts">
const page = defineModel<number>('page', { required: true })
const size = defineModel<number>('size', { required: true })

withDefaults(
  defineProps<{
    hasNext: boolean
    sizes?: number[]
  }>(),
  {
    sizes: () => [10, 20, 30, 40, 50, 100],
  },
)
</script>

<style scoped>
.page-size-select {
  flex: 0 0 96px;
  width: 96px;
}
</style>
