<script setup lang="ts">
import { restoreStateCurrent, saveWindowState, StateFlags } from '@tauri-apps/plugin-window-state'
import Button from '~/components/Button.vue'
async function onSaveWindowState() {
  await saveWindowState(StateFlags.SIZE)
}

async function onRestoreWindowState() {
  await restoreStateCurrent(StateFlags.SIZE)
}
</script>

<template>
  <div class="flex-row-start gap-2">
    <Button class-name="btn-solid" :anim="true" @click="onSaveWindowState">Save Window State</Button>
    <Button class-name="btn-solid" :anim="true" @click="onRestoreWindowState">Restore Window State</Button>
  </div>
</template>

