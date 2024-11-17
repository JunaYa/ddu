<script setup lang="ts">
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { onMounted, ref } from 'vue'
import Toggle from '~/components/Toggle.vue'

const isAutostartEnabled = ref(false)
const loading = ref(true)

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
  loading.value = true
  isAutostartEnabled.value = await isEnabled()
  loading.value = false
})
</script>

<template>
  <div class="flex justify-between bg-card p4">
    <div>
      <span class="text-secondary">开机自动启动</span>
    </div>
    <Toggle v-if="!loading" :value="isAutostartEnabled" @change="toggleAutostart" />
  </div>
</template>
