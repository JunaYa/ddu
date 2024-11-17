<script setup lang="ts">
import { remove } from "@tauri-apps/plugin-fs";
import { ref } from "vue";
import PictureReview from "./PictureReview.vue";
import FileInfo from "./FileInfo.vue";
import Button from '~/components/Button.vue'

const deleteLoading = ref(false)

const emit = defineEmits<{
  (e: 'change'): void
}>()

const props = defineProps<{
  item: { id: string, image: string }
  change?: () => void
}>()

async function handleDelete(path: string) {
  deleteLoading.value = true
  await remove(path);
  emit('change')
  deleteLoading.value = false
}

function handleRename(id: string) {
  console.log(id);
}

function handleCopy(id: string) {
  console.log(id);
}

</script>

<template>
  <div class="bg-card rounded-md p-2">
    <PictureReview :image-path="item.image" />
    <!-- button group delete | rename | copy -->
    <div class="flex flex-row gap-2">
      <Button class="btn-text" @click="handleDelete(item.image)">delete</Button>
      <Button class="btn-text" @click="handleRename(item.image)">rename</Button>
      <Button class="btn-text" @click="handleCopy(item.image)">copy</Button>
    </div>
    <FileInfo :path="item.image" />
  </div>
</template>
