<script setup lang="ts">
import { getEditorDefaults } from '@pqina/pintura'
import { PinturaEditor } from '@pqina/vue-pintura'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { readFile } from '@tauri-apps/plugin-fs'
import { LazyStore } from '@tauri-apps/plugin-store'
import { useElementHover } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import Button from '~/components/Button.vue'
import PictureReview from './PictureReview.vue'
// Import Pintura styles
import '@pqina/pintura/pintura.css'
import { getChatCompletion } from '~/api'

const store = new LazyStore('settings.json')

const snapHoverableElement = ref()
const isHovered = useElementHover(snapHoverableElement)

const imagePath = ref('')
const imageSrc = ref('')

const appWindow = getCurrentWindow()

const isEdit = ref(false)

function dragStart() {
  if (isEdit.value)
    return

  appWindow.startDragging()
  // no effect
  appWindow.setCursorIcon('move')
}

async function onEdit() {
  await invoke('update_preview_window')
  const content = await readFile(imagePath.value)
  const blob = new Blob([content], { type: 'image/png' })
  imageSrc.value = URL.createObjectURL(blob)
  isEdit.value = true
  // appWindow.close()
}

async function onCopy() {
  await invoke('copy_image_to_clipboard', {
    path: imagePath.value,
  })
}

function onSave() {
  appWindow.close()
}

async function getImageAnalysis() {
  // get image base64
  const imageBase64 = await invoke('get_image_base64', {
    path: imagePath.value,
  })
  console.log("imageBase64", imageBase64)
  const imageUrl = `data:image/jpeg;base64,${imageBase64}`
  const response = await getChatCompletion(imageUrl)
  console.log('response', response)
}

onMounted(async () => {
  const val = await store.get<{ value: string }>('screenshot_path')
  appWindow.listen<string>('image-prepared', (event: any) => {
    imagePath.value = `${val?.value}/images/${event.payload.Ok}`
    getImageAnalysis()
  })
})
</script>

<template>
  <div ref="snapHoverableElement" :class="`preview ${!isEdit ? 'cursor-move' : ''}`" @mousedown="dragStart">
    <div v-if="isEdit && imagePath" style="height: 70vh">
      <PinturaEditor
        v-bind="getEditorDefaults()"
        :src="imageSrc"
        :imageCropAspectRatio="1"
      />
    </div>
    <div v-if="!isEdit" class="h-100vh flex select-none items-center justify-center rounded-md text-12">
      <!-- img -->
      <PictureReview v-if="imagePath" :image-path="imagePath" />
    </div>
    <div v-if="isHovered && !isEdit" class="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-around bg-#0000002F">
      <Button class-name="btn-solid" :anim="true" @click="onEdit">
        Edit
      </Button>
      <Button class-name="btn-solid" :anim="true" @click="onCopy">
        Copy
      </Button>
      <Button class-name="btn-solid" :anim="true" @click="onSave">
        Save
      </Button>
      <Button class-name="btn-solid" :anim="true" @click="getImageAnalysis">
        Fetch
      </Button>
    </div>
  </div>
</template>

<style>
:root {
  background-color: transparent !important;
}
/* bright / dark mode */
.pintura-editor {
  --color-background: 255, 255, 255;
  --color-foreground: 10, 10, 10;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  html {
    color: #fff;
    background: #111;
  }

  .pintura-editor {
    --color-background: 10, 10, 10;
    --color-foreground: 255, 255, 255;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
  }
}
</style>
