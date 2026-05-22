<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
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

  const filePath = await save({
    defaultPath: props.imagePath,
    filters: [
      { name: 'PNG', extensions: ['png'] },
      { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
    ],
  })
  if (!filePath) return

  const base64 = dataUrl.split(',')[1]
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  await writeFile(filePath, bytes)
  emit('saved', filePath)
}

async function handleCopy() {
  const dataUrl = exportImage('png')
  if (!dataUrl) return

  const base64 = dataUrl.split(',')[1]
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  const tempPath = props.imagePath.replace(/\.[^.]+$/, '_annotated.png')
  await writeFile(tempPath, bytes)
  await invoke('copy_image_to_clipboard', { path: tempPath })
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
</style>
