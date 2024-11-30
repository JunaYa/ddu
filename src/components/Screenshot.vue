<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs'
import { LazyStore } from '@tauri-apps/plugin-store'
import { onMounted } from 'vue'
import Button from '~/components/Button.vue'
import SnapVault from './SnapVault.vue'

const store = new LazyStore('settings.json')

const BASE_DIR = BaseDirectory.AppData

// capture_screen
async function capture_screen() {
  const result = await invoke('capture_screen', {
    path: `images`,
  })
  const val = await store.get<{ value: string }>('screenshot_path')
  await showPreviewWindow(`${val?.value}/` + `images/${result}`)
}

// capture select
async function capture_select() {
  const result = await invoke('capture_select', {
    path: `images`,
  })
  const val = await store.get<{ value: string }>('screenshot_path')
  await showPreviewWindow(`${val?.value}/` + `images/${result}`)
}

// capture window
async function capture_window() {
  const result = await invoke('capture_window', {
    path: `images`,
  })
  const val = await store.get<{ value: string }>('screenshot_path')
  await showPreviewWindow(`${val?.value}/` + `images/${result}`)
}

// take_capture_screen
async function take_capture_screen() {
  try {
    const result = await invoke('xcap_window', {
      path: `images`,
    })
    const val = await store.get<{ value: string }>('screenshot_path')
    await showPreviewWindow(`${val?.value}/` + `images/${result}`)
  }
  catch (error) {
    console.error('take_capture_screen error:', error)
  }
}

// take_capture_monitor
async function take_capture_monitor() {
  try {
    const result = await invoke('xcap_monitor', {
      path: `images`,
    })
    const val = await store.get<{ value: string }>('screenshot_path')
    await showPreviewWindow(`${val?.value}/` + `images/${result}`)
  }
  catch (error) {
    console.error('take_capture_screen error:', error)
  }
}

async function create_dir() {
  const isExists = await exists('images', {
    baseDir: BASE_DIR,
  })
  if (!isExists) {
    await mkdir('images', {
      baseDir: BASE_DIR,
    })
  }
}

async function showPreviewWindow(path: string) {
  await invoke('show_preview_window', {
    path,
  })
}

onMounted(async () => {
  await create_dir()
})
</script>

<template>
  <div>
    <div>
      <Button class-name="btn-solid" @click="capture_screen">
        Capture Screen
      </Button>
      <Button class-name="btn-solid" @click="capture_select">
        Capture Select
      </Button>
      <Button class-name="btn-solid" @click="capture_window">
        Capture Window
      </Button>
      <Button class-name="btn-solid" @click="take_capture_screen">
        Take Capture Screen
      </Button>
      <Button class-name="btn-solid" @click="take_capture_monitor">
        Take Capture Monitor
      </Button>
    </div>
    <SnapVault />
  </div>
</template>

<style scoped>
</style>
