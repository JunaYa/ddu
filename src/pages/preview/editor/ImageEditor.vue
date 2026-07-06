<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { onMounted, onUnmounted, ref } from 'vue'
import type { EditorStyle, ToolType } from './useEditor'
import { useEditor } from './useEditor'
import EditorToolbar from './EditorToolbar.vue'

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
  destroy,
} = useEditor()

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

  // The native save dialog is opened server-side (save_annotated_image), so the
  // destination path is resolved in Rust and never supplied by the renderer.
  const base64 = dataUrl.split(',')[1]
  const defaultName = props.imagePath.split('/').pop() || 'screenshot.png'
  const saved = await invoke<string | null>('save_annotated_image', {
    base64,
    defaultFileName: defaultName,
  })
  if (saved) emit('saved', saved)
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
        <button class="action-btn save" @click="handleCopy">
          Copy
        </button>
        <button class="action-btn save" @click="handleSave">
          Save As
        </button>
        <button class="action-btn close" @click="emit('close')">
          Close
        </button>
      </div>
    </div>
    <div class="editor-canvas-container">
      <canvas ref="canvasRef" />
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
