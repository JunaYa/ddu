<script setup lang="ts">
import { BaseDirectory } from '@tauri-apps/plugin-fs';
import { LazyStore, load } from '@tauri-apps/plugin-store';
import { onMounted, ref } from 'vue';
import DirectorySelector from '~/components/DirectorySelector.vue';
const store = new LazyStore('settings.json');
const screenshotPath = ref<string>('');

const updateScreenshotPath = async () => {
  await store.set('screenshot_path', { value: BaseDirectory.AppData });
  await store.save();
}

onMounted(async () => {
  console.log('screenshot');
  const val = await store.get<{ value: string }>('screenshot_path');
  console.log('val', val);
  screenshotPath.value = val?.value ?? BaseDirectory.AppData.toString();
})
</script>

<template>
  <div class="bg-card rounded-lg p-4">
    <div class="flex items-center justify-between">
      <span class="text-secondary">截图保存路径</span>
      <DirectorySelector v-model="screenshotPath" />
    </div>
    <div class="my-2 h-.5px w-full bg-border" />
    <div v-if="screenshotPath" class="flex items-center justify-between mt-0">
      <span class="text-secondary text-sm mr-1">已选择目录:</span>
      <span class="text-secondary text-primary text-sm break-all">
        {{ screenshotPath }}
      </span>
    </div>
  </div>
</template>
