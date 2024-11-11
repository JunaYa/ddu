<script setup lang="ts">
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { onMounted, ref } from 'vue';

const isAutostartEnabled = ref(false);

const toggleAutostart = async () => {
  if (await isEnabled()) {
    await disable();
  } else {
    await enable();
  }
  isAutostartEnabled.value = await isEnabled();     
};

onMounted(async () => {
  isAutostartEnabled.value = await isEnabled();
});

</script>

<template>
  <button @click="toggleAutostart">{{ isAutostartEnabled ? 'Disable Autostart' : 'Enable Autostart' }}  </button>
</template>
