<script setup lang="ts">
import { FileInfo, stat } from '@tauri-apps/plugin-fs';
import { onMounted, ref } from 'vue';
import { formatTime } from '~/utils/datetime';
import { FileSizeFormatter } from '~/utils/file';
const props = defineProps<{
  path: string
}>()

const metadata = ref<FileInfo | null>(null)

onMounted(async () => {
  metadata.value = await stat(props.path)
})
</script>

<template>
  <div>
    <div class="flex flex-row justify-between">
      <span class="text-secondary text-sm">size: </span>
      <span class="text-secondary text-sm">{{ FileSizeFormatter.format(metadata?.size || 0, { binary: false }) }}</span>
    </div>
    <div class="flex flex-row justify-between">
      <span class="text-secondary text-sm">最近修改: </span>
      <span class="text-secondary text-sm">{{ metadata?.mtime ? formatTime(new Date(metadata.mtime), 'YYYY-MM-DD HH:mm:ss') : '' }}</span>
    </div>
    <div class="flex flex-row justify-between">
      <span class="text-secondary text-sm">最近访问: </span>
      <span class="text-secondary text-sm">{{ metadata?.atime ? formatTime(new Date(metadata?.atime), 'YYYY-MM-DD HH:mm:ss') : '' }}</span>
    </div>
    <div class="flex flex-row justify-between">
      <span class="text-secondary text-sm">创建时间: </span>
      <span class="text-secondary text-sm">{{ metadata?.birthtime ? formatTime(new Date(metadata?.birthtime), 'YYYY-MM-DD HH:mm:ss') : '' }}</span>
    </div>
  </div>
</template>