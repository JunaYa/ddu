<script setup lang="ts">
import { LazyStore } from '@tauri-apps/plugin-store'
import { onMounted, ref } from 'vue'
import Toggle from '~/components/Toggle.vue'

const store = new LazyStore('settings.json')

const defaultDelay = ref(3)
const includeCursor = ref(false)
const includeWindowShadow = ref(true)
const namingTemplate = ref('{date}_{time}_{mode}')

const delayOptions = [0, 3, 5, 10]

async function loadSettings() {
  const delay = await store.get<{ value: number }>('capture_delay')
  if (delay?.value !== undefined) defaultDelay.value = delay.value

  const cursor = await store.get<{ value: boolean }>('include_cursor')
  if (cursor?.value !== undefined) includeCursor.value = cursor.value

  const shadow = await store.get<{ value: boolean }>('include_window_shadow')
  if (shadow?.value !== undefined) includeWindowShadow.value = shadow.value

  const template = await store.get<{ value: string }>('naming_template')
  if (template?.value) namingTemplate.value = template.value
}

async function saveDelay(val: number) {
  defaultDelay.value = val
  await store.set('capture_delay', { value: val })
  await store.save()
}

async function saveCursor(val: boolean) {
  includeCursor.value = val
  await store.set('include_cursor', { value: val })
  await store.save()
}

async function saveShadow(val: boolean) {
  includeWindowShadow.value = val
  await store.set('include_window_shadow', { value: val })
  await store.save()
}

async function saveTemplate() {
  await store.set('naming_template', { value: namingTemplate.value })
  await store.save()
}

onMounted(loadSettings)
</script>

<template>
  <div>
    <div class="mb-3 text-base font-bold">
      Capture
    </div>

    <div class="setting-row">
      <span class="setting-label">Default Delay</span>
      <div class="flex gap-2">
        <button
          v-for="d in delayOptions"
          :key="d"
          :class="['delay-btn', { active: defaultDelay === d }]"
          @click="saveDelay(d)"
        >
          {{ d === 0 ? 'None' : `${d}s` }}
        </button>
      </div>
    </div>

    <div class="setting-row">
      <span class="setting-label">Include Cursor</span>
      <Toggle :value="includeCursor" @change="saveCursor(!includeCursor)" />
    </div>

    <div class="setting-row">
      <span class="setting-label">Window Shadow</span>
      <Toggle :value="includeWindowShadow" @change="saveShadow(!includeWindowShadow)" />
    </div>

    <div class="setting-row">
      <span class="setting-label">File Naming</span>
      <input
        v-model="namingTemplate"
        class="input-base w-48 text-sm"
        placeholder="{date}_{time}_{mode}"
        @blur="saveTemplate"
      >
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

.delay-btn {
  padding: 4px 12px;
  border: 1px solid rgba(128, 128, 128, 0.3);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.delay-btn:hover {
  border-color: rgba(59, 130, 246, 0.5);
}

.delay-btn.active {
  background: rgba(59, 130, 246, 0.8);
  border-color: rgba(59, 130, 246, 0.8);
  color: #fff;
}
</style>
