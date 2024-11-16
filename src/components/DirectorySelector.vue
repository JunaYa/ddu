// DirectorySelector.vue
<script setup lang="ts">
import { ref, defineEmits } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { homeDir } from '@tauri-apps/api/path'
import Button from '~/components/Button.vue'

const props = defineProps<{
  value: string
  showPath?: boolean
  showClear?: boolean
}>()

const selectedPath = ref<string>(props.value)
const isSelecting = ref(false)

const emit = defineEmits(['update:value'])

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
      console.log('selectedPath.value', selectedPath.value)
      emit('update:value', selectedPath.value)
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
  <div class="">
    <div class="flex gap-4 items-center">
      <Button
        @click="selectDirectory"
        :disabled="isSelecting"
        class="btn-solid"
      >
        {{ isSelecting ? '选择中...' : '选择目录' }}
      </Button>
      
      <Button
        v-if="showClear && selectedPath"
        @click="clearSelection"
        class="btn-active-icon"
      >
        清除
      </Button>
    </div>

    <div v-if="showPath && selectedPath" class="mt-4">
      <p class="text-sm text-gray-600">已选择目录:</p>
      <p class="mt-1 p-2 bg-gray-50 rounded font-mono text-sm break-all">
        {{ selectedPath }}
      </p>
    </div>
  </div>
</template>