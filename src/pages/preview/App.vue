<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { LazyStore } from '@tauri-apps/plugin-store'
import { useElementHover } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Button from '~/components/Button.vue'
import { shouldAutoHidePreview } from '~/lib/preview-lifecycle'
import PictureReview from './PictureReview.vue'
import ImageEditor from './editor/ImageEditor.vue'

const store = new LazyStore('settings.json')

const snapHoverableElement = ref()
const isHovered = useElementHover(snapHoverableElement)

const imagePath = ref('')
const imageSrc = ref('')
const isEdit = ref(false)
const copyError = ref('')

const captureInfo = ref<{
  filename: string
  fullPath: string
  width: number
  height: number
  mode: string
  capturedAt: string
} | null>(null)

const appWindow = getCurrentWindow()
let previewTimer: ReturnType<typeof setTimeout> | undefined
let unlistenImagePrepared: (() => void) | undefined

function clearPreviewTimer() {
  if (previewTimer) {
    clearTimeout(previewTimer)
    previewTimer = undefined
  }
}

function schedulePreviewHide() {
  clearPreviewTimer()
  if (!imagePath.value || !shouldAutoHidePreview({ hovered: isHovered.value, editing: isEdit.value })) return

  previewTimer = setTimeout(() => {
    invoke('hide_preview_window')
  }, 5000)
}

function dragStart() {
  if (isEdit.value) return
  appWindow.startDragging()
}

async function onEdit() {
  clearPreviewTimer()
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
  try {
    await invoke('copy_image_to_clipboard', { path: imagePath.value })
    copyError.value = ''
  }
  catch (error) {
    copyError.value = `复制失败: ${error}`
  }
}

function onSave() {
  invoke('hide_preview_window')
}

function onCloseEditor() {
  isEdit.value = false
  URL.revokeObjectURL(imageSrc.value)
  imageSrc.value = ''
}

function onEditorSaved(_path: string) {
  isEdit.value = false
  URL.revokeObjectURL(imageSrc.value)
  imageSrc.value = ''
}

watch([isHovered, isEdit, imagePath], schedulePreviewHide)

onMounted(async () => {
  const val = await store.get<{ value: string }>('screenshot_path')
  unlistenImagePrepared = await appWindow.listen<any>('image-prepared', (event: any) => {
    const payload = event.payload
    if (typeof payload === 'string') {
      imagePath.value = `${val?.value}/images/${payload}`
    } else {
      captureInfo.value = payload
      copyError.value = payload.copyError || ''
      if (payload.fullPath) {
        imagePath.value = payload.fullPath
      } else {
        imagePath.value = `${val?.value}/images/${payload.filename}`
      }
    }
  })
})

onBeforeUnmount(() => {
  clearPreviewTimer()
  unlistenImagePrepared?.()
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
      <Button class-name="btn-solid" :anim="true" aria-label="编辑截图 Edit screenshot" @click="onEdit">
        编辑 Edit
      </Button>
      <Button class-name="btn-solid" :anim="true" aria-label="复制截图 Copy screenshot" @click="onCopy">
        复制 Copy
      </Button>
      <Button class-name="btn-solid" :anim="true" aria-label="关闭预览 Close preview" @click="onSave">
        关闭 Close
      </Button>
    </div>
    <div v-if="copyError" class="absolute bottom-2 left-2 right-2 rounded bg-#7f1d1d p-2 text-center text-xs text-white">
      {{ copyError }}
      <button class="ml-2 underline" @click="onCopy">
        重试复制
      </button>
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
