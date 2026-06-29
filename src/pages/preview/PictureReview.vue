// ImageViewer.vue
<script setup lang="ts">
import { convertFileSrc } from '@tauri-apps/api/core'
import { exists } from '@tauri-apps/plugin-fs'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  imagePath: string
  width?: number
  height?: number
  showBackground?: boolean
  variant?: 'frame' | 'masonry'
}>()

const imageUrl = ref<string>('')
const error = ref<string>('')
const isLoading = ref(true)
const isMasonry = computed(() => props.variant === 'masonry')
const showFrameBackground = computed(() => props.showBackground !== false)
const containerStyle = computed(() => {
  if (isMasonry.value) return undefined

  return {
    width: props.width ? `${props.width}px` : 'auto',
    height: props.height ? `${props.height}px` : 'auto',
  }
})

async function loadImage() {
  try {
    isLoading.value = true
    error.value = ''

    // Check if file exists
    const fileExists = await exists(props.imagePath)
    if (!fileExists) {
      error.value = 'Image file not found'
      return
    }

    imageUrl.value = convertFileSrc(props.imagePath)
  }
  catch (err) {
    error.value = `Failed to load image: ${err}`
  }
  finally {
    isLoading.value = false
  }
}

// Watch for changes to the image path
watch(() => props.imagePath, loadImage)

onMounted(loadImage)
</script>

<template>
  <div class="">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="text-secondary">
        Loading image...
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-danger">
      <div class="text-red-500">
        {{ error }}
      </div>
    </div>

    <!-- Image display -->
    <div
      v-else
      class="picture-review relative flex flex-center overflow-hidden rounded-md"
      :class="{
        'mac_os_bg h-48 w-58': showFrameBackground,
        'h-48 w-58': !showFrameBackground && !isMasonry,
        'picture-review-masonry': isMasonry,
      }"
      :style="containerStyle"
    >
      <div class="picture-review-inner" :class="showFrameBackground ? 'h-full w-full px-4 py-8' : 'h-full w-full'">
        <img
          :src="imageUrl"
          :alt="imagePath"
          :width="width"
          :height="height"
          class="rounded-md object-contain"
          :class="isMasonry ? 'h-auto w-full' : 'h-full w-full'"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.mac_os_bg {
  background-image: url(./mac_os_bg.jpg);
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.picture-review-masonry {
  width: 100%;
  height: auto;
}

.picture-review-masonry .picture-review-inner,
.picture-review-masonry img {
  display: block;
  width: 100%;
  height: auto;
}
</style>
