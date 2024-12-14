<script setup lang="ts">
import AutoStart from './componnets/AutoStart.vue'
import ScreenshotPath from './componnets/ScreenshotPath.vue'
import WindowState from './componnets/WindowState.vue'
</script>

<template>
  <div class="setting p-4">
    <AutoStart />
    <div class="my-4 h-.5px w-full bg-border" />
    <ScreenshotPath />
    <div class="my-4 h-.5px w-full bg-border" />
    <WindowState />
  </div>
</template>
