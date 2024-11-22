<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useElementHover } from '@vueuse/core'
import { ref } from 'vue'
import Button from '~/components/Button.vue'

const snapHoverableElement = ref()
const isHovered = useElementHover(snapHoverableElement)

const imagePath = ref('')

const appWindow = getCurrentWindow()

function dragStart() {
  appWindow.startDragging()
  // no effect
  appWindow.setCursorIcon('move')
}

function onEdit() {
  appWindow.close()
}

function onSave() {
  appWindow.close()
}
</script>

<template>
  <div ref="snapHoverableElement" class="preview cursor-move" @mousedown="dragStart">
    <div class="h-100vh flex select-none items-center justify-center rounded-md bg-amber text-12">
      <!-- img -->
      <PictureReview :image-path="imagePath" />
    </div>
    <div v-if="isHovered" class="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-around bg-#0000002F">
      <Button class="btn-solid" :anim="true" @click="onEdit">
        Edit
      </Button>
      <Button class="btn-solid" :anim="true" @click="onSave">
        Save
      </Button>
    </div>
  </div>
</template>
