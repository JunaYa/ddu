<script setup lang="ts">
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { onMounted, ref } from 'vue';
import Toggle from '~/components/Toggle.vue'

const isAutostartEnabled = ref(false);
const loading = ref(true);

const toggleAutostart = async () => {
  if (await isEnabled()) {
    await disable();
  } else {
    await enable();
  }
  isAutostartEnabled.value = await isEnabled();     
};

onMounted(async () => {
  loading.value = true;
  isAutostartEnabled.value = await isEnabled();
  loading.value = false;
  console.log('isAutostartEnabled', isAutostartEnabled.value)
});

</script>

<template>
  <div class="w-full flex justify-between bg-gray-100 p2">
    <div>
      
    <span class="text-secondary">开机自动启动</span>
  </div>
    <Toggle v-if="!loading" :value="isAutostartEnabled" @change="toggleAutostart" />
  </div>
</template>
