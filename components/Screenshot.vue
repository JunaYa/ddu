<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { ref } from 'vue'
import DirectorySelector from './DirectorySelector.vue'
import PictureReview from './PictureReview.vue'

const selectedPath = ref('')
const screenshotPath = ref('')
const appDataDirPath = '/Users/aya/Desktop/'

// take screenshot
async function take_screenshot() {
  const result = await invoke('take_screenshot', {
    path: selectedPath.value ? `${selectedPath.value}/` : `${appDataDirPath}screenshots`,
  })
  screenshotPath.value = result as string
}

// capture_screen
async function capture_screen() {
  const result = await invoke('capture_screen', {
    path: selectedPath.value ? `${selectedPath.value}/` : `${appDataDirPath}screenshots`,
  })
  screenshotPath.value = result as string
}

// capture select
async function capture_select() {
  const result = await invoke('capture_select', {
    path: selectedPath.value ? `${selectedPath.value}/` : `${appDataDirPath}screenshots`,
  })
  screenshotPath.value = result as string
}

// capture window
async function capture_window() {
  const result = await invoke('capture_window', {
    path: selectedPath.value ? `${selectedPath.value}/` : `${appDataDirPath}screenshots`,
  })
  screenshotPath.value = result as string
}

// take_capture_screen
async function take_capture_screen() {
  try {
    const result = await invoke('take_capture_screen', {
      path: selectedPath.value ? `${selectedPath.value}/` : `${appDataDirPath}screenshots`,
    })
    screenshotPath.value = result as string
  }
  catch (error) {
    console.error('take_capture_screen error:', error)
  }
}
</script>

<template>
  <div>
    <DirectorySelector v-model="selectedPath" />
    <div>
      <button type="button" @click="take_screenshot">
        take screenshot
      </button>
      <button type="button" @click="capture_screen">
        Capture Screen
      </button>
      <button type="button" @click="capture_select">
        Capture Select
      </button>
      <button type="button" @click="capture_window">
        Capture Window
      </button>
      <button type="button" @click="take_capture_screen">
        Take Capture Screen
      </button>
    </div>
    <img :src="screenshotPath" alt="screenshot">
    <PictureReview v-if="screenshotPath" :image-path="screenshotPath" />
  </div>
</template>

<style scoped>
img {
  width: 100px;
  height: 100px;
}
</style>
