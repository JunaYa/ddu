<script setup lang="ts">
import AutoStart from './componnets/AutoStart.vue'
import CaptureSettings from './componnets/CaptureSettings.vue'
import HistorySettings from './componnets/HistorySettings.vue'
import ScreenshotPath from './componnets/ScreenshotPath.vue'
import ShortcutSettings from './componnets/ShortcutSettings.vue'
</script>

<template>
  <div class="setting p-4 overflow-y-auto max-h-100vh">
    <AutoStart />
    <div class="my-4 h-.5px w-full bg-border" />
    <ScreenshotPath />
    <div class="my-4 h-.5px w-full bg-border" />
    <CaptureSettings />
    <div class="my-4 h-.5px w-full bg-border" />
    <ShortcutSettings />
    <div class="my-4 h-.5px w-full bg-border" />
    <HistorySettings />
  </div>
</template>
