<script setup lang="ts">
import type { FileInfo } from '@tauri-apps/plugin-fs'
import { stat } from '@tauri-apps/plugin-fs'
import { onMounted, ref } from 'vue'
import { formatTime } from '~/utils/datetime'
import { FileSizeFormatter } from '~/utils/file'

const props = defineProps<{
  path: string
  className?: string
  showLabel?: boolean
}>()

const metadata = ref<FileInfo | null>(null)

onMounted(async () => {
  metadata.value = await stat(props.path)
})
</script>

<template>
  <div :class="className">
    <div class="flex flex-row justify-between">
      <span v-if="showLabel" class="text-sm text-secondary">size: </span>
      <span class="text-sm text-secondary">{{ FileSizeFormatter.format(metadata?.size || 0, { binary: false }) }}</span>
    </div>
    <div class="flex flex-row justify-between">
      <span v-if="showLabel" class="text-sm text-secondary">最近修改: </span>
      <span class="text-sm text-secondary">{{ metadata?.mtime ? formatTime(new Date(metadata.mtime), 'YYYY-MM-DD HH:mm:ss') : '' }}</span>
    </div>
    <div class="flex flex-row justify-between">
      <span v-if="showLabel" class="text-sm text-secondary">最近访问: </span>
      <span class="text-sm text-secondary">{{ metadata?.atime ? formatTime(new Date(metadata?.atime), 'YYYY-MM-DD HH:mm:ss') : '' }}</span>
    </div>
    <div class="flex flex-row justify-between">
      <span v-if="showLabel" class="text-sm text-secondary">创建时间: </span>
      <span class="text-sm text-secondary">{{ metadata?.birthtime ? formatTime(new Date(metadata?.birthtime), 'YYYY-MM-DD HH:mm:ss') : '' }}</span>
    </div>
  </div>
</template>
