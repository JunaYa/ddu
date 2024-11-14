<script setup lang="ts">
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { onMounted, ref } from 'vue'

const isAutostartEnabled = ref(false)

async function toggleAutostart() {
  if (await isEnabled()) {
    await disable()
  }
  else {
    await enable()
  }
  isAutostartEnabled.value = await isEnabled()
}

onMounted(async () => {
  isAutostartEnabled.value = await isEnabled()
})
</script>

<template>
  <button @click="toggleAutostart">
    {{ isAutostartEnabled ? 'Disable Autostart' : 'Enable Autostart' }}
  </button>
</template>
