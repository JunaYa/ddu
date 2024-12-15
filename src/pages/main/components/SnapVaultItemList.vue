<script setup lang="ts">
import { confirm } from '@tauri-apps/plugin-dialog'
import { remove } from '@tauri-apps/plugin-fs'
import { useElementHover } from '@vueuse/core'
import { ref } from 'vue'
import Button from '~/components/Button.vue'
import FileInfo from './FileInfo.vue'
import PictureReview from '~/pages/preview/PictureReview.vue'

defineProps<{
  item: { id: string, image: string }
}>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

const snapHoverableElement = ref()
const isHovered = useElementHover(snapHoverableElement)

const deleteLoading = ref(false)

async function handleDelete(path: string) {
  deleteLoading.value = true
  const confirmation = await confirm(
    '是否确认删除该文件?',
    { title: '确认删除', kind: 'warning' },
  )
  if (confirmation) {
    await remove(path)
    emit('change')
  }
  deleteLoading.value = false
}
</script>

<template>
  <div ref="snapHoverableElement" class="flex flex-row items-center relative rounded-md bg-card p-2">
    <PictureReview :image-path="item.image" width="100" height="60" />
    <div v-if="isHovered" class="absolute right-3 top-3 z-11 flex flex-row gap-2">
      <Button class-name="btn-action-icon" anim @click="() => handleDelete(item.image)">
        <i class="h-4 w-4">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><path d="M12 12h2v12h-2z" fill="currentColor" /><path d="M18 12h2v12h-2z" fill="currentColor" /><path d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z" fill="currentColor" /><path d="M12 2h8v2h-8z" fill="currentColor" /></svg>
        </i>
      </Button>
    </div>
    <FileInfo :path="item.image" class-name="ml-8 flex flex-1 flex-row items-center justify-between gap-2" />
  </div>
</template>
