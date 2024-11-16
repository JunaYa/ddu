// ImageViewer.vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core';
import { exists, FileInfo, stat } from '@tauri-apps/plugin-fs';

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

    const metadata: FileInfo = await stat(props.imagePath)
    console.log('metadata:', JSON.stringify(metadata, null, 2));

    imageUrl.value = convertFileSrc(props.imagePath);

    // Convert the file path to a URL that can be used in the browser
    // imageUrl.value = convertFileSrc(props.imagePath)
  } catch (err) {
    error.value = `Failed to load image: ${err}`
  } finally {
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
      <div class="text-secondary">Loading image...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-danger">
      <div class="text-red-500">{{ error }}</div>
    </div>

    <!-- Image display -->
    <div v-else class="flex flex-center overflow-hidden w-38 h-38 rounded-md">
      <img 
        :src="imageUrl" 
        :alt="imagePath"
        class="w-full h-full rounded-md"
      />
    </div>
  </div>
</template>

<style scoped>
</style>