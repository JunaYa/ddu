<script setup lang="ts">
import { readDir } from '@tauri-apps/plugin-fs'
import { LazyStore } from '@tauri-apps/plugin-store'
import { onMounted, ref } from 'vue'
import { FileSizeFormatter } from '~/utils/file'
import SnapVaultItem from './SnapVaultItem.vue'

const store = new LazyStore('settings.json')

const list = ref<{ id: string, image: string }[]>([])

async function loadData() {
  const val = await store.get<{ value: string }>('screenshot_path')

  const entries = await readDir(`${val?.value}/images` ?? '')

  list.value = entries.filter(entry => entry.isFile && FileSizeFormatter.isPictureFile(entry.name)).map(entry => ({
    id: entry.name,
    image: `${val?.value}/images/${entry.name}`,
  }))
}

onMounted(async () => {
  loadData()
})
</script>

<template>
  <div>
    <div class="mb-2 text-lg font-bold">
      SnapVault
    </div>
    <div class="flex flex-row flex-wrap gap-4">
      <SnapVaultItem v-for="item in list" :key="item.id" :item="item" @change="loadData" />
    </div>
  </div>
</template>
