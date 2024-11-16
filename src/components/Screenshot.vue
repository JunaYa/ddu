<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { onMounted, ref } from "vue";
import Button from '~/components/Button.vue'
import PictureReview from "./PictureReview.vue";
import { BaseDirectory, exists, mkdir } from "@tauri-apps/plugin-fs";
import { LazyStore } from "@tauri-apps/plugin-store";
import SnapVault from "./SnapVault.vue";
const store = new LazyStore('settings.json');

const screenshotPath = ref('')
const BASE_DIR = BaseDirectory.AppData

// take screenshot
async function take_screenshot() {
  const result = await invoke("take_screenshot", { 
    path: `images`,
  });
  const val = await store.get<{ value: string }>('screenshot_path');
  screenshotPath.value = val?.value + '/' + `images/${result}`
}

// capture_screen
async function capture_screen() {
  const result = await invoke("capture_screen", { 
    path: `images`,
  });
  console.log("capture_screen result:", result);
  screenshotPath.value = result as string
}

// capture select
async function capture_select() {
  const result = await invoke("capture_select", { 
    path: `images`,
  });
  console.log("capture_select result:", result);
  screenshotPath.value = result as string
}

// capture window
async function capture_window() {
  const result = await invoke("capture_window", { 
    path: `images`,
  });
  console.log("capture_window result:", result);
  screenshotPath.value = result as string
}

// take_capture_screen
async function take_capture_screen() {
  try {
    const result = await invoke("scrap_capture_screen", { 
      path: `images`,
    });
    console.log("take_capture_screen result:", result);
    screenshotPath.value = result as string
  } catch (error) {
    console.error("take_capture_screen error:", error);
  }
}

async function create_dir() {
  const isExists = await exists('images', {
    baseDir: BASE_DIR,
  });
  if (!isExists) {
    await mkdir('images', {
      baseDir: BASE_DIR,
    });
  }
}

onMounted(async () => {
  await create_dir()
})

</script>

<template>
  <div>
    <div>
      <Button class="btn-solid"  @click="take_screenshot">take screenshot</Button>
      <Button @click="take_screenshot" class="btn-solid">Capture Screen</Button>
      <Button class="btn-solid"type="button" @click="capture_screen">Capture Screen</Button>
      <Button class="btn-solid"type="button" @click="capture_select">Capture Select</Button>
      <Button class="btn-solid"type="button" @click="capture_window">Capture Window</Button>
      <Button @click="take_capture_screen" class="btn-solid">Take Capture Screen</Button>
    </div>
    <PictureReview v-if="screenshotPath" :image-path="screenshotPath"/>
    <SnapVault />
  </div> 
</template>

<style scoped>
</style>