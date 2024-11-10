<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from '@tauri-apps/api/path';

// take screenshot
async function take_screenshot() {
  const appDataDirPath = await appDataDir();
  console.log(appDataDirPath);
  await invoke("take_screenshot", { 
    path: `${appDataDirPath}screenshots`,
  });
}


</script>

<template>
    <button type="button" @click="take_screenshot">Capture Screen</button>
</template>
