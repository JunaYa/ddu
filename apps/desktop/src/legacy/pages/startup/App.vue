<script setup lang="ts">
import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import logo from '~/assets/logo.png'
import Button from '~/components/Button.vue'

type PermissionKind = 'screenRecording' | 'accessibility'

interface PermissionStatus {
  screenRecording: string
  accessibility: string
}

const appVersion = ref('')
const status = ref<PermissionStatus>()
// macOS only applies a fresh Screen Recording grant to a relaunched process,
// so once the user has been sent to System Settings we offer a restart.
const screenRecordingRequested = ref(false)

const screenRecordingGranted = computed(() => status.value?.screenRecording === 'granted')
const accessibilityGranted = computed(() => status.value?.accessibility === 'granted')

async function refresh() {
  // The startup window hides instead of closing; skip polling while hidden.
  if (document.hidden)
    return
  status.value = await invoke<PermissionStatus>('permission_status')
}

async function request(kind: PermissionKind) {
  if (kind === 'screenRecording')
    screenRecordingRequested.value = true
  await invoke('permission_request', { kind })
  await refresh()
}

function restart() {
  invoke('restart_app')
}

let timer: number | undefined
onMounted(async () => {
  await refresh()
  appVersion.value = await getVersion()
  // Live-refresh while the user flips switches in System Settings.
  timer = window.setInterval(refresh, 1000)
})

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div class="startup app-shell p-6">
    <div class="mb-2 flex items-center justify-center">
      <img :src="logo" alt="logo" class="logo relative h-14 w-14">
    </div>
    <div class="text-center text-sm text-secondary">
      Ddu 版本: V{{ appVersion }}
    </div>

    <div v-if="status" class="mt-4 flex flex-col gap-2">
      <div class="permission-row">
        <div class="min-w-0">
          <div class="text-sm">
            屏幕录制 <span class="text-xs text-$c-danger">必需</span>
          </div>
          <div class="text-xs text-secondary">
            截屏功能需要
          </div>
        </div>
        <span v-if="screenRecordingGranted" class="text-xs text-$c-success">已授权</span>
        <Button v-else class-name="btn-solid" anim @click="request('screenRecording')">
          授权
        </Button>
      </div>
      <div v-if="!screenRecordingGranted && screenRecordingRequested" class="restart-hint">
        <span class="text-xs text-$c-warning">在系统设置中开启后，重启应用生效</span>
        <Button class-name="btn-solid" anim @click="restart">
          重启应用
        </Button>
      </div>

      <div class="permission-row">
        <div class="min-w-0">
          <div class="text-sm">
            辅助功能 <span class="text-xs text-secondary">推荐</span>
          </div>
          <div class="text-xs text-secondary">
            智能选区按 UI 元素捕捉需要
          </div>
        </div>
        <span v-if="accessibilityGranted" class="text-xs text-$c-success">已授权</span>
        <Button v-else class-name="btn-solid" anim @click="request('accessibility')">
          授权
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo {
  filter: drop-shadow(0 0 1em #747bff);
}

.permission-row,
.restart-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
