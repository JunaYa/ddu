<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { ref } from 'vue'
import { diagnosticStatusLabel } from '~/lib/diagnostics-summary'
import Button from '~/components/Button.vue'

interface PlatformCapability {
  key: string
  status: string
  reason?: string
}

interface DiagnosticsBundle {
  app_version: string
  os: string
  os_version: string
  arch: string
  capabilities: PlatformCapability[]
  permissions: PlatformCapability[]
}

const diagnostics = ref<DiagnosticsBundle>()
const loading = ref(false)
const error = ref('')

async function loadDiagnostics() {
  loading.value = true
  error.value = ''
  try {
    diagnostics.value = await invoke<DiagnosticsBundle>('get_diagnostics_bundle')
  }
  catch {
    error.value = '无法读取本机诊断信息。'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="liquid-glass liquid-glass-panel p4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="text-secondary">本机诊断</div>
        <p class="mt-1 text-xs text-secondary">
          仅在此设备显示，用于检查截图能力与所需权限；不会上传任何信息。
        </p>
      </div>
      <Button class-name="btn-solid" anim :disabled="loading" @click="loadDiagnostics">
        {{ loading ? '检查中…' : '运行检查' }}
      </Button>
    </div>

    <template v-if="diagnostics">
      <div class="mt-3 text-xs text-secondary">
        DDU {{ diagnostics.app_version }} · {{ diagnostics.os }} {{ diagnostics.os_version }} · {{ diagnostics.arch }}
      </div>
      <div class="mt-3 flex flex-col gap-2">
        <div v-for="item in [...diagnostics.permissions, ...diagnostics.capabilities]" :key="item.key" class="diagnostic-row">
          <div class="min-w-0">
            <div class="text-sm">{{ item.key }}</div>
            <div v-if="item.reason" class="text-xs text-secondary">{{ item.reason }}</div>
          </div>
          <span :class="`diagnostic-status ${diagnosticStatusLabel(item.status).tone}`">
            {{ diagnosticStatusLabel(item.status).label }}
          </span>
        </div>
      </div>
    </template>
    <p v-else-if="error" class="mt-3 text-xs text-$c-danger">{{ error }}</p>
  </section>
</template>

<style scoped>
.diagnostic-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.diagnostic-status {
  flex: none;
  font-size: 12px;
}

.diagnostic-status.success { color: var(--c-success); }
.diagnostic-status.warning { color: var(--c-warning); }
.diagnostic-status.neutral { color: var(--c-secondary); }
</style>
