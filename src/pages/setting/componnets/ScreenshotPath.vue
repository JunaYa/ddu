<script setup lang="ts">
import { BaseDirectory } from '@tauri-apps/plugin-fs'
import { LazyStore } from '@tauri-apps/plugin-store'
import { onMounted, ref } from 'vue'
import DirectorySelector from '~/components/DirectorySelector.vue'

const store = new LazyStore('settings.json')
const screenshotPath = ref<string>('')

async function updateScreenshotPath(path: string) {
  screenshotPath.value = path
  await store.set('screenshot_path', { value: path })
  await store.save()
}

onMounted(async () => {
  const val = await store.get<{ value: string }>('screenshot_path')
  screenshotPath.value = val?.value ?? BaseDirectory.AppData.toString()
})
</script>

<template>
  <div class="rounded-lg bg-card p-4">
    <div class="flex items-center justify-between">
      <span class="text-secondary">截图保存路径</span>
      <DirectorySelector :value="screenshotPath" @update:value="updateScreenshotPath" />
    </div>
    <div class="my-2 h-.5px w-full bg-border" />
    <div v-if="screenshotPath" class="mt-0 flex items-center justify-between">
      <span class="mr-1 text-sm text-secondary">已选择目录:</span>
      <span class="break-all text-sm text-primary text-secondary">
        {{ screenshotPath }}
      </span>
    </div>
  </div>
</template>
