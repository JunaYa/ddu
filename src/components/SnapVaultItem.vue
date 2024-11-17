<script setup lang="ts">
import { remove } from "@tauri-apps/plugin-fs";
import { ref } from "vue";
import PictureReview from "./PictureReview.vue";
import FileInfo from "./FileInfo.vue";
import Button from '~/components/Button.vue'
import { confirm } from '@tauri-apps/plugin-dialog';
import { useElementHover } from '@vueuse/core'

const snapHoverableElement = ref()
const isHovered = useElementHover(snapHoverableElement)

const deleteLoading = ref(false)

const emit = defineEmits<{
  (e: 'change'): void
}>()

defineProps<{
  item: { id: string, image: string }
  change?: () => void
}>()

async function handleDelete(path: string) {
  deleteLoading.value = true
  const confirmation = await confirm(
    '是否确认删除该文件?',
    { title: '确认删除', kind: 'warning' }
  );
  if (confirmation) {
    await remove(path);
    emit('change')
  }
  deleteLoading.value = false
}

</script>

<template>
  <div class="bg-card rounded-md p-2 relative" ref="snapHoverableElement" >
    <PictureReview :image-path="item.image" />
    <!-- button group delete | rename | copy -->
    <div v-if="isHovered" class="absolute top-3 right-3 z-11 flex flex-row gap-2" >
      <Button class="btn-action-icon" anim @click="handleDelete(item.image)">
        <i class="w-4 h-4">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><path d="M12 12h2v12h-2z" fill="currentColor"></path><path d="M18 12h2v12h-2z" fill="currentColor"></path><path d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z" fill="currentColor"></path><path d="M12 2h8v2h-8z" fill="currentColor"></path></svg>
        </i>
      </Button>
    </div>
    <FileInfo :path="item.image" />
  </div>
</template>
