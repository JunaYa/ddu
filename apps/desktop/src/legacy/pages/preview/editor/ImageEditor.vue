<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { OcrLine, OcrResult } from '~/lib/ocr'
import { ocrLines } from '~/lib/ocr'
import type { EditorStyle, ToolType } from './useEditor'
import { useEditor } from './useEditor'
import EditorToolbar from './EditorToolbar.vue'
import OcrPanel from './OcrPanel.vue'

const props = defineProps<{
  imageSrc: string
  imagePath: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', path: string): void
}>()

const canvasRef = ref<HTMLCanvasElement>()
const containerRef = ref<HTMLDivElement>()

const toast = ref<{ message: string, type: 'success' | 'error' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(message: string, type: 'success' | 'error') {
  toast.value = { message, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 2000)
}

const {
  currentTool,
  style,
  canUndo,
  canRedo,
  initCanvas,
  loadImage,
  setTool,
  undo,
  redo,
  deleteSelected,
  exportImage,
  clearAnnotations,
  imageRectToCanvas,
  selectedImageRegion,
  destroy,
} = useEditor()

const ocr = ref({
  open: false,
  loading: false,
  error: '',
  partial: false,
  lines: [] as OcrLine[],
})
const hoveredLine = ref<number | null>(null)

const highlight = computed(() => {
  if (hoveredLine.value === null) return null
  const box = ocr.value.lines[hoveredLine.value]?.box
  return box ? imageRectToCanvas(box) : null
})

/** Recognize the selected annotation's area, or the whole capture. */
async function handleOcr() {
  // Read the original capture, not the canvas, so annotations never get in
  // the way of the text underneath them.
  const region = currentTool.value === 'select' ? selectedImageRegion() : null
  ocr.value = { open: true, loading: true, error: '', partial: !!region, lines: [] }
  hoveredLine.value = null
  try {
    const result = await invoke<OcrResult>('perform_ocr', { path: props.imagePath, region })
    ocr.value.lines = ocrLines(result)
  }
  catch (e) {
    ocr.value.error = String(e).includes('too small')
      ? '选区太小，无法识别 Selection too small'
      : `识别失败 OCR failed: ${e}`
  }
  finally {
    ocr.value.loading = false
  }
}

async function handleCopyText(text: string) {
  try {
    await invoke('copy_text', { text })
    showToast('文字已复制', 'success')
  }
  catch (e) {
    showToast(`复制失败: ${e}`, 'error')
  }
}

function closeOcr() {
  ocr.value.open = false
  hoveredLine.value = null
}

function handleSelectTool(tool: ToolType) {
  setTool(tool)
}

function handleUpdateStyle(update: Partial<EditorStyle>) {
  Object.assign(style.value, update)
  setTool(currentTool.value)
}

async function handleSave() {
  const dataUrl = exportImage('png')
  if (!dataUrl) return

  // Saving creates a distinct, controlled history item so the original capture
  // remains recoverable and the renderer never selects a destination path.
  const base64 = dataUrl.split(',')[1]
  const saved = await invoke<string>('save_annotated_image', {
    base64,
    sourcePath: props.imagePath,
  })
  emit('saved', saved)
}

async function handleCopy() {
  const dataUrl = exportImage('png')
  if (!dataUrl) return

  // Send the bytes straight to the clipboard — no temp file on disk (R4).
  const base64 = dataUrl.split(',')[1]
  try {
    await invoke('copy_image_bytes', { base64 })
    showToast('已复制到剪贴板', 'success')
  }
  catch (e) {
    showToast(`复制失败: ${e}`, 'error')
  }
}

function handleKeydown(e: KeyboardEvent) {
  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  } else if (meta && e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    redo()
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (currentTool.value === 'select') {
      deleteSelected()
    }
  } else if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(async () => {
  if (!canvasRef.value || !containerRef.value) return
  window.addEventListener('keydown', handleKeydown)

  const rect = containerRef.value.getBoundingClientRect()
  initCanvas(canvasRef.value, rect.width, rect.height - 60)
  await loadImage(props.imageSrc)
  setTool('select')
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (toastTimer) clearTimeout(toastTimer)
  destroy()
})
</script>

<template>
  <div ref="containerRef" class="image-editor">
    <div class="editor-header">
      <EditorToolbar
        :current-tool="currentTool"
        :style="style"
        :can-undo="canUndo"
        :can-redo="canRedo"
        @select-tool="handleSelectTool"
        @undo="undo"
        @redo="redo"
        @delete="deleteSelected"
        @clear="clearAnnotations"
        @update-style="handleUpdateStyle"
      />
      <div class="editor-actions">
        <button
          class="action-btn close"
          :class="{ active: ocr.open }"
          title="提取文字；先选中一个框则只识别该区域 Extract text (select a shape first to read only that area)"
          aria-label="提取文字 Extract text"
          @click="handleOcr"
        >
          提取文字 Text
        </button>
        <button class="action-btn save" aria-label="复制编辑后的截图 Copy edited screenshot" @click="handleCopy">
          复制 Copy
        </button>
        <button class="action-btn save" aria-label="保存编辑副本 Save edited copy" @click="handleSave">
          保存副本 Save copy
        </button>
        <button class="action-btn close" aria-label="关闭编辑器 Close editor" @click="emit('close')">
          关闭 Close
        </button>
      </div>
    </div>
    <div class="editor-body">
      <div class="editor-canvas-container">
        <div class="canvas-stage">
          <canvas ref="canvasRef" />
          <div
            v-if="highlight"
            class="ocr-highlight"
            :style="{
              left: `${highlight.x}px`,
              top: `${highlight.y}px`,
              width: `${highlight.width}px`,
              height: `${highlight.height}px`,
            }"
          />
        </div>
      </div>
      <OcrPanel
        v-if="ocr.open"
        class="editor-ocr-panel"
        :lines="ocr.lines"
        :loading="ocr.loading"
        :error="ocr.error"
        :partial="ocr.partial"
        @copy="handleCopyText"
        @hover="hoveredLine = $event"
        @close="closeOcr"
      />
    </div>
    <div v-if="toast" class="editor-toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #222;
  gap: 8px;
}

.editor-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.action-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn.save {
  background: #3b82f6;
  color: #fff;
}
.action-btn.save:hover { background: #2563eb; }

.action-btn.close {
  background: rgba(255,255,255,0.1);
  color: #ccc;
}
.action-btn.close:hover { background: rgba(255,255,255,0.2); color: #fff; }

.action-btn.close.active {
  background: rgba(59, 130, 246, 0.3);
  color: #fff;
}

.editor-body {
  position: relative;
  flex: 1;
  display: flex;
  min-height: 0;
}

/* Overlaid rather than beside the canvas: the canvas is sized once at mount
   and annotations live in its coordinates. */
.editor-ocr-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.35);
}

.canvas-stage {
  position: relative;
}

.ocr-highlight {
  position: absolute;
  z-index: 5;
  pointer-events: none;
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 2px;
  background: rgba(59, 130, 246, 0.15);
}

.editor-canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 12px;
}

.editor-toast {
  position: fixed;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.editor-toast.success { background: #16a34a; }
.editor-toast.error { background: #dc2626; }
</style>
