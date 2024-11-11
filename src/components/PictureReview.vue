// ImageViewer.vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core';
import { exists } from '@tauri-apps/plugin-fs';

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
    console.log('fileExists:', fileExists);
    if (!fileExists) {
      error.value = 'Image file not found'
      return
    }

    // Convert the file path to a URL that can be used in the browser
    imageUrl.value = convertFileSrc(props.imagePath)
    console.log('imageUrl:', imageUrl.value);
  } catch (err) {
    error.value = `Failed to load image: ${err}`
    console.error('Image loading error:', err)
  } finally {
    isLoading.value = false
  }
}

// Watch for changes to the image path
watch(() => props.imagePath, loadImage)

onMounted(loadImage)
</script>

<template>
  <div class="image-viewer">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="text-gray-600">Loading image...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error">
      <div class="text-red-500">{{ error }}</div>
    </div>

    <!-- Image display -->
    <div v-else class="image-container">
      <img 
        :src="imagePath" 
        :alt="imagePath"
        class="max-w-full h-auto rounded shadow-lg"
        @error="error = 'Failed to display image'"
      />
      
      <!-- Image path display -->
      <div class="mt-2 text-sm text-gray-600 break-all">
        {{ imagePath }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-viewer {
  padding: 1rem;
}

.loading, .error {
  padding: 2rem;
  text-align: center;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.image-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>