<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { LazyStore } from '@tauri-apps/plugin-store'
import { useElementHover } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import Button from '~/components/Button.vue'
import PictureReview from '~/components/PictureReview.vue'

const store = new LazyStore('settings.json')

const snapHoverableElement = ref()
const isHovered = useElementHover(snapHoverableElement)

const imagePath = ref('')

const appWindow = getCurrentWindow()

function dragStart() {
  appWindow.startDragging()
  // no effect
  appWindow.setCursorIcon('move')
}

async function onEdit() {
  await invoke('update_preview_window')
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

onMounted(async () => {
  const val = await store.get<{ value: string }>('screenshot_path')
  appWindow.listen<string>('image-prepared', (event: any) => {
    imagePath.value = `${val?.value}/images/${event.payload.Ok}`
  })
})
</script>

<template>
  <div ref="snapHoverableElement" class="preview cursor-move" @mousedown="dragStart">
    <div class="h-100vh flex select-none items-center justify-center rounded-md text-12">
      <!-- img -->
      <PictureReview v-if="imagePath" :image-path="imagePath" />
    </div>
    <div v-if="isHovered" class="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-around bg-#0000002F">
      <Button class="btn-solid" :anim="true" @click="onEdit">
        Edit
      </Button>
      <Button class="btn-solid" :anim="true" @click="onCopy">
        Copy
      </Button>
      <Button class="btn-solid" :anim="true" @click="onSave">
        Save
      </Button>
    </div>
  </div>
</template>
