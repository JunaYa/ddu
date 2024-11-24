<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core';
import Button from '~/components/Button.vue';

// open_screen_capture_preferences
async function open_screen_capture_preferences() {
  await invoke('open_screen_capture_preferences')
}

</script>

<template>
  <div class="startup">
    <Button class="btn-solid" @click="open_screen_capture_preferences">
      Open Screen Capture Preferences
    </Button>
  </div>
</template>
