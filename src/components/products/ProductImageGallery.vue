<template>
  <section class="product-gallery-panel">
    <div class="product-gallery-panel__header">
      <div class="text-sm font-semibold text-slate-900">{{ t('products.details.images') }}</div>
      <div class="flex items-center gap-2">
        <span v-if="images.length" class="text-xs text-slate-500">
          {{ images.length }} {{ t('products.details.photo') }}
        </span>
        <el-button
          v-if="canAdd"
          :icon="Upload"
          :loading="uploading"
          size="small"
          plain
          @click="imageInput?.click()"
        >
          {{ t('common.actions.add') }}
        </el-button>
        <input
          ref="imageInput"
          type="file"
          multiple
          accept=".png,.jpeg,.jpg,.gif,.bmp,.webp,.tiff,image/png,image/jpeg,image/gif,image/bmp,image/webp,image/tiff"
          class="hidden"
          @change="selectImages"
        />
      </div>
    </div>

    <el-carousel
      v-if="images.length"
      ref="gallery"
      arrow="always"
      trigger="click"
      height="300px"
      :autoplay="false"
      indicator-position="none"
      @change="activeIndex = $event"
    >
      <el-carousel-item v-for="(image, index) in images" :key="`${image}-${index}`">
        <div class="relative h-full w-full">
          <el-image
            :src="image"
            :preview-src-list="images"
            :initial-index="index"
            fit="contain"
            show-progress
            hide-on-click-modal
            preview-teleported
            class="h-full w-full bg-white"
          >
            <template #error>
              <div class="flex h-full items-center justify-center text-sm text-slate-500">
                {{ t('products.details.imageUnavailable') }}
              </div>
            </template>
          </el-image>
          <el-button
            v-if="canDelete"
            :icon="Delete"
            :loading="deletingImage === image"
            :aria-label="t('products.details.deleteImageTitle')"
            circle
            type="danger"
            class="absolute right-3 top-3"
            @click.stop="emit('delete', image, index)"
          />
        </div>
      </el-carousel-item>
    </el-carousel>

    <div v-if="images.length > 1" class="product-gallery-panel__thumbs">
      <button
        v-for="(image, index) in images"
        :key="`thumb-${image}-${index}`"
        :class="[
          'product-gallery-panel__thumb',
          { 'product-gallery-panel__thumb--active': activeIndex === index },
        ]"
        type="button"
        @click="showImage(index)"
      >
        <el-image :src="image" fit="contain" class="h-full w-full" />
      </button>
    </div>

    <el-empty v-else :description="t('products.details.noImages')" class="h-[250px]" />
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Delete, Upload } from '@element-plus/icons-vue'
import type { CarouselInstance } from 'element-plus'
import { useI18n } from '@/i18n'

const props = defineProps<{
  images: string[]
  canAdd: boolean
  canDelete: boolean
  uploading: boolean
  deletingImage: string | null
}>()

const emit = defineEmits<{
  upload: [files: File[]]
  delete: [image: string, index: number]
}>()

const { t } = useI18n()
const gallery = ref<CarouselInstance>()
const imageInput = ref<HTMLInputElement>()
const activeIndex = ref(0)

function showImage(index: number) {
  activeIndex.value = index
  gallery.value?.setActiveItem(index)
}

function selectImages(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length) emit('upload', files)
}

watch(() => props.images, (images) => {
  activeIndex.value = Math.max(0, Math.min(activeIndex.value, images.length - 1))
  gallery.value?.setActiveItem(activeIndex.value)
})
</script>

<style scoped>
.product-gallery-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 8px;
  background: white;
}

.product-gallery-panel__header {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid rgb(226 232 240);
}

.product-gallery-panel__thumbs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
  border-top: 1px solid rgb(226 232 240);
}

.product-gallery-panel__thumb {
  height: 52px;
  overflow: hidden;
  padding: 2px;
  border: 1px solid rgb(226 232 240);
  border-radius: 6px;
  background: white;
}

.product-gallery-panel__thumb--active {
  border-color: rgb(15 23 42);
}

@media (max-width: 640px) {
  .product-gallery-panel__thumbs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
