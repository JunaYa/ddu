<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { LazyStore } from '@tauri-apps/plugin-store'
import { useElementHover } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import Button from '~/components/Button.vue'
import PictureReview from './PictureReview.vue'
import ImageEditor from './editor/ImageEditor.vue'

const store = new LazyStore('settings.json')

const snapHoverableElement = ref()
const isHovered = useElementHover(snapHoverableElement)

const imagePath = ref('')
const imageSrc = ref('')
const isEdit = ref(false)

const captureInfo = ref<{
  filename: string
  fullPath: string
  width: number
  height: number
  mode: string
  capturedAt: string
} | null>(null)

const appWindow = getCurrentWindow()

function dragStart() {
  if (isEdit.value) return
  appWindow.startDragging()
}

async function onEdit() {
  await invoke('update_preview_window')
  // Load the bitmap through the backend (path-guarded, works for custom save
  // paths) rather than plugin-fs readFile, then build a blob URL for the editor.
  const b64 = await invoke<string>('get_image_base64', { path: imagePath.value })
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: 'image/png' })
  imageSrc.value = URL.createObjectURL(blob)
  isEdit.value = true
}

async function onCopy() {
  await invoke('copy_image_to_clipboard', { path: imagePath.value })
}

function onSave() {
  appWindow.close()
}

function onCloseEditor() {
  isEdit.value = false
  imageSrc.value = ''
}

function onEditorSaved(_path: string) {
  isEdit.value = false
  imageSrc.value = ''
}

onMounted(async () => {
  const val = await store.get<{ value: string }>('screenshot_path')
  appWindow.listen<any>('image-prepared', (event: any) => {
    const payload = event.payload
    if (typeof payload === 'string') {
      imagePath.value = `${val?.value}/images/${payload}`
    } else {
      captureInfo.value = payload
      if (payload.fullPath) {
        imagePath.value = payload.fullPath
      } else {
        imagePath.value = `${val?.value}/images/${payload.filename}`
      }
    }
  })
})
</script>

<template>
  <div v-if="isEdit && imageSrc" class="editor-fullscreen">
    <ImageEditor
      :image-src="imageSrc"
      :image-path="imagePath"
      @close="onCloseEditor"
      @saved="onEditorSaved"
    />
  </div>
  <div v-else ref="snapHoverableElement" class="preview cursor-move" @mousedown="dragStart">
    <div class="h-100vh flex select-none items-center justify-center rounded-md text-12">
      <PictureReview v-if="imagePath" :image-path="imagePath" />
    </div>
    <div v-if="isHovered" class="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-around bg-#0000002F">
      <Button class-name="btn-solid" :anim="true" @click="onEdit">
        Edit
      </Button>
      <Button class-name="btn-solid" :anim="true" @click="onCopy">
        Copy
      </Button>
      <Button class-name="btn-solid" :anim="true" @click="onSave">
        Close
      </Button>
    </div>
  </div>
</template>

<style>
:root {
  background-color: transparent !important;
}

.editor-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: #1a1a1a;
}

@media (prefers-color-scheme: dark) {
  html {
    color: #fff;
    background: #111;
  }
}
</style>
