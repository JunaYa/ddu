<script setup lang="ts">
import { LazyStore } from '@tauri-apps/plugin-store'
import { onMounted, ref } from 'vue'

const store = new LazyStore('settings.json')

interface ShortcutItem {
  id: string
  label: string
  key: string
  default: string
}

const shortcuts = ref<ShortcutItem[]>([
  { id: 'hotkey_fullscreen', label: 'Full Screen Capture', key: 'CmdOrCtrl+Shift+A', default: 'CmdOrCtrl+Shift+A' },
  { id: 'hotkey_region', label: 'Region Capture', key: 'CmdOrCtrl+Shift+S', default: 'CmdOrCtrl+Shift+S' },
  { id: 'hotkey_window', label: 'Window Capture', key: 'CmdOrCtrl+Shift+W', default: 'CmdOrCtrl+Shift+W' },
])

const recording = ref<string | null>(null)
const recordedKeys = ref('')

async function loadShortcuts() {
  for (const sc of shortcuts.value) {
    const saved = await store.get<{ value: string }>(sc.id)
    if (saved?.value) sc.key = saved.value
  }
}

function startRecording(id: string) {
  recording.value = id
  recordedKeys.value = ''
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
}

function onKeyDown(e: KeyboardEvent) {
  e.preventDefault()
  e.stopPropagation()

  const parts: string[] = []
  if (e.metaKey || e.ctrlKey) parts.push('CmdOrCtrl')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')

  const key = e.key
  if (!['Meta', 'Control', 'Shift', 'Alt'].includes(key)) {
    parts.push(key.toUpperCase())
    recordedKeys.value = parts.join('+')
  }
}

async function onKeyUp(_e: KeyboardEvent) {
  if (!recordedKeys.value || !recording.value) return

  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)

  const sc = shortcuts.value.find(s => s.id === recording.value)
  if (sc) {
    sc.key = recordedKeys.value
    await store.set(sc.id, { value: recordedKeys.value })
    await store.save()
  }

  recording.value = null
  recordedKeys.value = ''
}

async function resetShortcut(sc: ShortcutItem) {
  sc.key = sc.default
  await store.set(sc.id, { value: sc.default })
  await store.save()
}

onMounted(loadShortcuts)
</script>

<template>
  <div>
    <div class="mb-3 text-base font-bold">
      Shortcuts
    </div>

    <div v-for="sc in shortcuts" :key="sc.id" class="shortcut-row">
      <span class="shortcut-label">{{ sc.label }}</span>
      <div class="shortcut-controls">
        <button
          :class="['shortcut-key', { recording: recording === sc.id }]"
          @click="startRecording(sc.id)"
        >
          {{ recording === sc.id ? (recordedKeys || 'Press keys...') : sc.key }}
        </button>
        <button class="reset-btn" title="Reset to default" @click="resetShortcut(sc)">
          ↺
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.shortcut-label {
  font-size: 14px;
  color: var(--c-text-secondary, #666);
}

.shortcut-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortcut-key {
  padding: 4px 16px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.1);
  color: inherit;
  font-size: 13px;
  font-family: monospace;
  cursor: pointer;
  min-width: 180px;
  text-align: center;
  transition: all 0.15s;
}

.shortcut-key:hover { border-color: rgba(59, 130, 246, 0.5); }

.shortcut-key.recording {
  border-color: rgba(59, 130, 246, 0.8);
  background: rgba(59, 130, 246, 0.1);
  animation: pulse 1s infinite;
}

.reset-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #999;
  font-size: 16px;
  cursor: pointer;
}
.reset-btn:hover { background: rgba(128, 128, 128, 0.2); color: inherit; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
