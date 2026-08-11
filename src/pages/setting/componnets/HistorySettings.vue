<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { confirm } from '@tauri-apps/plugin-dialog'
import { LazyStore } from '@tauri-apps/plugin-store'
import { onMounted, ref } from 'vue'
import Toggle from '~/components/Toggle.vue'

const store = new LazyStore('settings.json')

const retentionDays = ref(30)
const cleanupEnabled = ref(false)

const retentionOptions = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: 'Forever', value: -1 },
]

async function loadSettings() {
  const days = await store.get<{ value: number }>('history_retention_days')
  if (days?.value !== undefined) retentionDays.value = days.value

  const enabled = await store.get<{ value: boolean }>('history_cleanup_enabled')
  if (enabled?.value !== undefined) cleanupEnabled.value = enabled.value
}

async function saveRetention(val: number) {
  retentionDays.value = val
  await store.set('history_retention_days', { value: val })
  await store.save()
}

// Opt-in gate for retention auto-deletion. Default off — the backend never
// prunes until the user explicitly enables this.
async function saveCleanupEnabled(val: boolean) {
  cleanupEnabled.value = val
  await store.set('history_cleanup_enabled', { value: val })
  await store.save()
}

async function clearHistory() {
  const ok = await confirm('这会将所有 DDU 截图移到废纸篓；你可以从 macOS 废纸篓恢复它们。', {
    title: '清空历史',
    kind: 'warning',
  })
  if (!ok) return

  const items = await invoke<any[]>('list_history_items', { path: 'images' })
  if (items.length > 0) {
    const paths = items.map((item: any) => item.full_path)
    await invoke('delete_history_items', { paths })
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="liquid-glass liquid-glass-panel p-4">
    <div class="mb-3 text-base font-bold">
      截图历史
    </div>

    <div class="setting-row">
      <span class="setting-label">保留期限</span>
      <select
        class="liquid-glass-control select-settings w-36"
        :value="retentionDays"
        @change="saveRetention(Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="opt in retentionOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div class="setting-row">
      <div>
        <div class="setting-label">自动清理过期截图</div>
        <div class="text-xs text-secondary">开启后会永久删除超过期限的 DDU 截图。</div>
      </div>
      <Toggle :key="`cleanup-${cleanupEnabled}`" :value="cleanupEnabled" @change="saveCleanupEnabled(!cleanupEnabled)" />
    </div>

    <div class="setting-row">
      <span class="setting-label">清空全部历史</span>
      <button class="liquid-glass-control danger-btn" @click="clearHistory">
        移到废纸篓
      </button>
    </div>
  </div>
</template>

<style scoped>
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}

.setting-label {
  font-size: 14px;
  color: var(--c-text-secondary, #666);
}

.danger-btn {
  padding: 4px 16px;
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.danger-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}
</style>
