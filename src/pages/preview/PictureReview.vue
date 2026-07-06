// ImageViewer.vue
<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
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

function mimeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  return 'image/png'
}

async function loadImage() {
  try {
    isLoading.value = true
    error.value = ''

    // Read through the backend so custom save paths (outside $APPDATA) work and
    // the fs/asset scopes can stay tightened. The command also guards the path.
    const b64 = await invoke<string>('get_image_base64', { path: props.imagePath })
    imageUrl.value = `data:${mimeFor(props.imagePath)};base64,${b64}`
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
  background-image: url('/mac_os_bg.jpg');
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
