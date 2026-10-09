<script setup lang="ts">
import { computed, ref } from 'vue'
import type { OcrLine } from '~/lib/ocr'
import { joinOcrLines } from '~/lib/ocr'

const props = defineProps<{
  lines: OcrLine[]
  loading: boolean
  error: string
  /** True when only the selected area was recognized. */
  partial: boolean
}>()

const emit = defineEmits<{
  (e: 'copy', text: string): void
  (e: 'hover', index: number | null): void
  (e: 'close'): void
}>()

const mergeLines = ref(false)
const allText = computed(() => joinOcrLines(props.lines.map(l => l.text), mergeLines.value))
</script>

<template>
  <aside class="ocr-panel" aria-label="识别文字 Recognized text">
    <header class="ocr-header">
      <span class="ocr-title">{{ partial ? '选区文字 Selection' : '识别文字 Text' }}</span>
      <button class="ocr-icon-btn" aria-label="关闭文字面板 Close text panel" @click="emit('close')">
        ✕
      </button>
    </header>

    <div v-if="loading" class="ocr-state" role="status">
      正在识别… Recognizing…
    </div>
    <div v-else-if="error" class="ocr-state ocr-error" role="alert">
      {{ error }}
    </div>
    <div v-else-if="lines.length === 0" class="ocr-state">
      未识别到文字 No text found
    </div>
    <template v-else>
      <div class="ocr-controls">
        <label class="ocr-toggle">
          <input v-model="mergeLines" type="checkbox">
          合并换行 Merge lines
        </label>
        <button class="ocr-copy-all" @click="emit('copy', allText)">
          复制全部 Copy all
        </button>
      </div>
      <ol class="ocr-lines">
        <li v-for="(line, index) in lines" :key="index">
          <button
            class="ocr-line"
            :title="`复制此行 Copy line ${index + 1}`"
            @click="emit('copy', line.text)"
            @mouseenter="emit('hover', index)"
            @mouseleave="emit('hover', null)"
            @focus="emit('hover', index)"
            @blur="emit('hover', null)"
          >
            {{ line.text }}
          </button>
        </li>
      </ol>
    </template>
  </aside>
</template>

<style scoped>
.ocr-panel {
  display: flex;
  flex-direction: column;
  width: 320px;
  flex-shrink: 0;
  background: #222;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  color: #ddd;
  font-size: 13px;
}

.ocr-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.ocr-title {
  font-weight: 600;
  color: #fff;
}

.ocr-icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #aaa;
  cursor: pointer;
}
.ocr-icon-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

.ocr-state {
  padding: 24px 16px;
  color: #999;
  text-align: center;
  line-height: 1.5;
}
.ocr-error { color: #fca5a5; }

.ocr-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
}

.ocr-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #aaa;
  white-space: nowrap;
  cursor: pointer;
}
.ocr-toggle input { accent-color: #3b82f6; }

.ocr-copy-all {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: #fff;
  white-space: nowrap;
  cursor: pointer;
}
.ocr-copy-all:hover { background: #2563eb; }

.ocr-lines {
  flex: 1;
  margin: 0;
  padding: 0 8px 12px;
  overflow-y: auto;
  list-style: none;
}

.ocr-line {
  display: block;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #ddd;
  font: inherit;
  line-height: 1.45;
  text-align: left;
  word-break: break-word;
  user-select: text;
  cursor: copy;
}
.ocr-line:hover,
.ocr-line:focus-visible {
  background: rgba(59, 130, 246, 0.18);
  color: #fff;
  outline: none;
}
</style>
