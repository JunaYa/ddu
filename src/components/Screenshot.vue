<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { onMounted, ref } from "vue";
import Button from '~/components/Button.vue'
import PictureReview from "./PictureReview.vue";
import { BaseDirectory, exists, mkdir, readFile } from "@tauri-apps/plugin-fs";

const screenshotPath = ref('')
const animate = ref(false)

// take screenshot
async function take_screenshot() {
  const result = await invoke("take_screenshot", { 
    path: `images`,
  });
  console.log("take_screenshot result:", result);
  screenshotPath.value = `images/${result}`

  // 15/images/2024-11-15_00-24-34.png convert to /images/2024-11-15_00-24-34.png
  // remove the first /
  const isExists = await exists(screenshotPath.value, { baseDir: BaseDirectory.AppData });
  console.log('isExists:', isExists);

  if (!isExists) {
    return
  }

  const contents = await readFile(screenshotPath.value, {
    baseDir: BaseDirectory.AppData,
  });
  console.log('contents:', contents);
}

// capture_screen
async function capture_screen() {
  const result = await invoke("capture_screen", { 
    path: `${BaseDirectory.AppData}/images`,
  });
  console.log("capture_screen result:", result);
  screenshotPath.value = result as string
}

// capture select
async function capture_select() {
  const result = await invoke("capture_select", { 
    path: `${BaseDirectory.AppData}/images`,
  });
  console.log("capture_select result:", result);
  screenshotPath.value = result as string
}

// capture window
async function capture_window() {
  const result = await invoke("capture_window", { 
    path: `${BaseDirectory.AppData}/images`,
  });
  console.log("capture_window result:", result);
  screenshotPath.value = result as string
}

// take_capture_screen
async function take_capture_screen() {
  try {
    const result = await invoke("scrap_capture_screen", { 
      path: `${BaseDirectory.AppData}/images`,
    });
    console.log("take_capture_screen result:", result);
    screenshotPath.value = result as string
  } catch (error) {
    console.error("take_capture_screen error:", error);
  }
}

async function create_dir() {
  const isExists = await exists('images', {
    baseDir: BaseDirectory.AppData,
  });
  if (!isExists) {
    await mkdir('images', {
      baseDir: BaseDirectory.AppData,
    });
  }
}

onMounted(async () => {
  await create_dir()
  // 2024-11-15_00-32-57.png
  // const isExists = await exists('2024-11-15_00-32-57.png', { baseDir: BaseDirectory.AppData });
  // console.log('isExists:', isExists);
  // const isExists = await exists('images/tauri.jpeg', {
  //   baseDir: BaseDirectory.AppData,
  // });
  // console.log('isExists:', isExists);
  // if (isExists) {
  //   const contents = await readFile('images/tauri.jpeg', { baseDir: BaseDirectory.AppData });
  //   console.log('contents:', contents);
  // }
})

</script>

<template>
    <div>
      <!-- <DirectorySelector v-model="selectedPath"/>       -->
      <div>
        <button class="btn-solid" type="button" @click="take_screenshot">take screenshot</button>
        <Button text="Capture Screen" @click="take_screenshot"/>
        <button class="btn-solid"type="button" @click="capture_screen">Capture Screen</button>
        <button class="btn-solid"type="button" @click="capture_select">Capture Select</button>
        <button class="btn-solid"type="button" @click="capture_window">Capture Window</button>
        <Button text="Take Capture Screen" @click="take_capture_screen"/>
        <Button text="Button Text" anim class="btn-text"/>
        <Button text="Button Solid" anim class="btn-solid box-shadow-primary "/>
        <Button text="Button outline" class="btn-outline "/>
      </div>
      <PictureReview v-if="screenshotPath" :image-path="screenshotPath"/>
    </div> 
</template>

<style scoped>
img {
  width: 100px;
  height: 100px;
}
</style>