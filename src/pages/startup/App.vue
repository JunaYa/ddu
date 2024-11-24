<script setup lang="ts">
import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { onMounted, ref } from 'vue'
import logo from '~/assets/logo.png'
import Button from '~/components/Button.vue'

const appVersion = ref('')
const hasAccessibilityPermissions = ref(false)
async function openScreenCapturePreferences() {
  await invoke('open_screen_capture_preferences')
}

async function checkAccessibilityPermissions() {
  const result = await invoke('check_accessibility_permissions')
  hasAccessibilityPermissions.value = result as boolean
}

onMounted(async () => {
  await checkAccessibilityPermissions()
  appVersion.value = await getVersion()
})
</script>

<template>
  <div class="startup p-8">
    <div class="mb-4 flex items-center justify-center">
      <img :src="logo" alt="logo" class="logo relative h-18 w-18">
    </div>
    <div class="text-center text-base">
      Ddu 版本: V{{ appVersion }}
    </div>
    <div v-if="!hasAccessibilityPermissions" class="mt-8 flex flex-col items-center justify-center gap-2">
      <div class="text-secondary text-base">
        请授予 Ddu 截屏功能权限
      </div>
      <Button class="btn-solid" anim @click="openScreenCapturePreferences">
        授权
      </Button>
    </div>
  </div>
</template>

<style scoped>
.logo {
  filter: drop-shadow(0 0 1em #747bff);
}
</style>
