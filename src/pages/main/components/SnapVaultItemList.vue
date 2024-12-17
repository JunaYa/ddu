<script setup lang="ts">
import { confirm } from '@tauri-apps/plugin-dialog'
import { remove } from '@tauri-apps/plugin-fs'
import { ref } from 'vue'
import Button from '~/components/Button.vue'
import Checkbox from '~/components/Checkbox.vue'
import FileInfo from './FileInfo.vue'
import PictureReview from '~/pages/preview/PictureReview.vue'

defineProps<{
  item: { id: string, image: string, checked: boolean }
}>()

const emit = defineEmits<{
  (e: 'change', val: boolean): void
  (e: 'remove'): void
}>()

const deleteLoading = ref(false)

async function handleDelete(path: string) {
  deleteLoading.value = true
  const confirmation = await confirm(
    '是否确认删除该文件?',
    { title: '确认删除', kind: 'warning' },
  )
  if (confirmation) {
    await remove(path)
    emit('remove')
  }
  deleteLoading.value = false
}
</script>

<template>
  <div class="flex flex-row items-center justify-between gap-2 relative rounded-md bg-card p-2">
    <div class="flex flex-row items-center justify-center w-8 h-8">
      <Checkbox :checked="item.checked" @change="() => emit('change', !item.checked)" />
    </div>
    <PictureReview :image-path="item.image" :width="100" :height="60" />
    <FileInfo :path="item.image" class-name="ml-8 flex flex-1 flex-row items-center justify-between gap-2" />
    <div class="flex flex-row items-center justify-center gap-2">
      <Button class-name="btn-action-icon" anim @click="() => handleDelete(item.image)">
        <i class="h-4 w-4">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><path d="M12 12h2v12h-2z" fill="currentColor" /><path d="M18 12h2v12h-2z" fill="currentColor" /><path d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z" fill="#232323" /><path d="M12 2h8v2h-8z" fill="#232323" /></svg>
        </i>
      </Button>
    </div>
  </div>
</template>
