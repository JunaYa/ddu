<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from '@tauri-apps/api/path';
import { ref } from "vue";
import DirectorySelector from "./DirectorySelector.vue";
import PictureReview from "./PictureReview.vue";

const selectedPath = ref('')
const screenshotPath = ref('')

// take screenshot
async function take_screenshot() {
  // const appDataDirPath = await appDataDir();
  const appDataDirPath = "/Users/aya/Desktop/";
  console.log(appDataDirPath);
  console.log('selectedPath:', selectedPath.value);
  const result = await invoke("take_screenshot", { 
    path: !!selectedPath.value ? `${selectedPath.value}/` : `${appDataDirPath}screenshots`,
  });
  console.log("result:", result);
  screenshotPath.value = result as string
}


</script>

<template>
    <div>
      <DirectorySelector v-model="selectedPath"/>      
      <button type="button" @click="take_screenshot">Capture Screen</button>
      <img  :src="'http://localhost//file:/Users/aya/Desktop/screenshots/2024-11-11_09-40-21.png'" alt="screenshot" />
      <PictureReview v-if="screenshotPath" :image-path="screenshotPath"/>
    </div>
</template>

<style scoped>
img {
  width: 100px;
  height: 100px;
}
</style>