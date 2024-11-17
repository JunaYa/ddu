// DirectorySelector.vue
<script setup lang="ts">
import { homeDir } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import { defineEmits, ref } from 'vue'
import Button from '~/components/Button.vue'

const props = defineProps<{
  value: string
  showPath?: boolean
  showClear?: boolean
}>()

const emit = defineEmits(['update:value'])
const selectedPath = ref<string>(props.value)
const isSelecting = ref(false)

async function selectDirectory() {
  try {
    isSelecting.value = true
    const homeDirPath = await homeDir()

    // 打开目录选择对话框
    const selected = await open({
      directory: true,
      multiple: false,
      defaultPath: homeDirPath,
      title: '选择目录',
    })

    if (selected) {
      selectedPath.value = selected as string
      emit('update:value', selectedPath.value)
    }
  }
  catch (error) {
    console.error('选择目录失败:', error)
  }
  finally {
    isSelecting.value = false
  }
}

// 清除选择的路径
function clearSelection() {
  selectedPath.value = ''
}
</script>

<template>
  <div class="">
    <div class="flex items-center gap-4">
      <Button
        :disabled="isSelecting"
        class="btn-solid"
        @click="selectDirectory"
      >
        {{ isSelecting ? '选择中...' : '选择目录' }}
      </Button>

      <Button
        v-if="showClear && selectedPath"
        class="btn-active-icon"
        @click="clearSelection"
      >
        清除
      </Button>
    </div>

    <div v-if="showPath && selectedPath" class="mt-4">
      <p class="text-sm text-gray-600">
        已选择目录:
      </p>
      <p class="mt-1 break-all rounded bg-gray-50 p-2 text-sm font-mono">
        {{ selectedPath }}
      </p>
    </div>
  </div>
</template>
