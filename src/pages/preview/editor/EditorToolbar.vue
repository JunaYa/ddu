<script setup lang="ts">
import type { ToolType, EditorStyle } from './useEditor'

const props = defineProps<{
  currentTool: ToolType
  style: EditorStyle
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  (e: 'selectTool', tool: ToolType): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'delete'): void
  (e: 'clear'): void
  (e: 'updateStyle', style: Partial<EditorStyle>): void
}>()

const tools: { id: ToolType; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'arrow', label: 'Arrow', icon: '→' },
  { id: 'line', label: 'Line', icon: '—' },
  { id: 'rect', label: 'Rect', icon: '□' },
  { id: 'ellipse', label: 'Ellipse', icon: '○' },
  { id: 'freehand', label: 'Draw', icon: '✎' },
  { id: 'highlight', label: 'Highlight', icon: '▬' },
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'step', label: 'Step', icon: '#' },
  { id: 'blur', label: 'Blur (soft — not for secrets)', icon: '▤' },
  { id: 'pixelate', label: 'Pixelate (irreversible)', icon: '▦' },
]

const colors = ['#ff0000', '#ff6600', '#ffcc00', '#00cc00', '#0066ff', '#9933ff', '#000000', '#ffffff']
</script>

<template>
  <div class="editor-toolbar">
    <div class="tool-group">
      <button
        v-for="tool in tools"
        :key="tool.id"
        :class="['tool-btn', { active: currentTool === tool.id }]"
        :title="tool.label"
        @click="emit('selectTool', tool.id)"
      >
        {{ tool.icon }}
      </button>
    </div>

    <div class="separator" />

    <div class="color-group">
      <button
        v-for="color in colors"
        :key="color"
        class="color-btn"
        :class="{ active: style.strokeColor === color }"
        :style="{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #ccc' : 'none' }"
        @click="emit('updateStyle', { strokeColor: color })"
      />
    </div>

    <div class="separator" />

    <div class="size-group">
      <label class="size-label">
        <span>W</span>
        <input
          type="range"
          min="1"
          max="20"
          :value="style.strokeWidth"
          @input="emit('updateStyle', { strokeWidth: Number(($event.target as HTMLInputElement).value) })"
        >
      </label>
    </div>

    <div class="separator" />

    <div class="action-group">
      <button class="action-btn" :disabled="!canUndo" title="Undo (Cmd+Z)" @click="emit('undo')">
        ↩
      </button>
      <button class="action-btn" :disabled="!canRedo" title="Redo (Cmd+Shift+Z)" @click="emit('redo')">
        ↪
      </button>
      <button class="action-btn" title="Delete" @click="emit('delete')">
        🗑
      </button>
      <button class="action-btn" title="Clear All" @click="emit('clear')">
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  user-select: none;
}

.tool-group, .color-group, .action-group {
  display: flex;
  gap: 2px;
  align-items: center;
}

.tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.tool-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.tool-btn.active { background: rgba(59, 130, 246, 0.8); color: #fff; }

.color-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s;
}
.color-btn:hover { transform: scale(1.2); }
.color-btn.active { outline: 2px solid #fff; outline-offset: 2px; }

.separator {
  width: 1px;
  height: 24px;
  background: rgba(255,255,255,0.2);
  margin: 0 4px;
}

.size-group { display: flex; align-items: center; }
.size-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
}
.size-label input[type="range"] {
  width: 60px;
  accent-color: #3b82f6;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
}
.action-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
.action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
</style>
