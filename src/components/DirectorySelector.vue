// DirectorySelector.vue
<script setup lang="ts">
import { ref, defineEmits } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { homeDir } from '@tauri-apps/api/path'

const props = defineProps<{
  modelValue: string
}>()

const selectedPath = ref<string>(props.modelValue)
const isSelecting = ref(false)

const emit = defineEmits(['update:modelValue'])

const selectDirectory = async () => {
  try {
    isSelecting.value = true
    const homeDirPath = await homeDir()
    
    // 打开目录选择对话框
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: homeDirPath,
      title: '选择目录'
    })
    
    if (selected) {
      selectedPath.value = selected as string
      emit('update:modelValue', selectedPath.value)
    }
  } catch (error) {
    console.error('选择目录失败:', error)
  } finally {
    isSelecting.value = false
  }
}

// 清除选择的路径
const clearSelection = () => {
  selectedPath.value = ''
}
</script>

<template>
  <div class="directory-selector">
    <div class="flex gap-4 items-center">
      <button
        @click="selectDirectory"
        :disabled="isSelecting"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {{ isSelecting ? '选择中...' : '选择目录' }}
      </button>
      
      <button
        v-if="selectedPath"
        @click="clearSelection"
        class="px-3 py-1 text-gray-600 border rounded hover:bg-gray-100"
      >
        清除
      </button>
    </div>

    <div v-if="selectedPath" class="mt-4">
      <p class="text-sm text-gray-600">已选择目录:</p>
      <p class="mt-1 p-2 bg-gray-50 rounded font-mono text-sm break-all">
        {{ selectedPath }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.directory-selector {
  padding: 1rem;
}
</style>