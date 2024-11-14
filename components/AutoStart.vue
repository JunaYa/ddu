<script setup lang="ts">
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart'
import { NSwitch } from 'naive-ui'
import { onMounted, ref } from 'vue'

const isAutostartEnabled = ref(false)
const loading = ref(false)

async function toggleAutostart(value: boolean) {
  
  if(loading.value) return

  loading.value = true

  if (value) {
    await disable()
  }
  else {
    await enable()
  }
  isAutostartEnabled.value = value
  loading.value = false
}

onMounted(async () => {
  isAutostartEnabled.value = await isEnabled()
})
</script>

<template>
  <div class="flex justify-between">
    开机是否自动启动
    <NSwitch :value="isAutostartEnabled" size="medium" @update:value="toggleAutostart" />
  </div>
</template>
