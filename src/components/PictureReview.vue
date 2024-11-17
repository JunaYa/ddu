// ImageViewer.vue
<script setup lang="ts">
import { convertFileSrc } from '@tauri-apps/api/core'
import { exists } from '@tauri-apps/plugin-fs'
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  imagePath: string
}>()

const imageUrl = ref<string>('')
const error = ref<string>('')
const isLoading = ref(true)

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
    <div v-else class="h-48 w-58 flex flex-center overflow-hidden rounded-md">
      <img
        :src="imageUrl"
        :alt="imagePath"
        class="h-full w-full rounded-md"
      >
    </div>
  </div>
</template>

<style scoped>
</style>
