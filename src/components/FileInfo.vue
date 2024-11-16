<script setup lang="ts">
import { FileInfo, stat } from '@tauri-apps/plugin-fs';
import { onMounted, ref } from 'vue';

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
    <div><span>size</span><span>{{ metadata?.size }}</span></div>
    <div><span>Last modified</span><span>{{ metadata?.mtime }}</span></div>
    <div><span>Last accessed</span><span>{{ metadata?.atime }}</span></div>
    <div><span>Creation time</span><span>{{ metadata?.birthtime }}</span></div>
    <div><span>readonly</span><span>{{ metadata?.readonly }}</span></div>
    <div><span>gid</span><span>{{ metadata?.gid }}</span></div>
    <div><span>uid</span><span>{{ metadata?.uid }}</span></div>
    <div><span>ino</span><span>{{ metadata?.ino }}</span></div>
  </div>
</template>