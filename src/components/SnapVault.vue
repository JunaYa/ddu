<script setup lang="ts">
import { readDir } from '@tauri-apps/plugin-fs'
import { LazyStore } from '@tauri-apps/plugin-store'
import { onMounted, ref } from 'vue'
import { FileSizeFormatter } from '~/utils/file'
import SnapVaultItem from './SnapVaultItem.vue'

const store = new LazyStore('settings.json')

const list = ref<{ id: string, image: string }[]>([])

const isAscending = ref(false)

async function loadData() {
  const val = await store.get<{ value: string }>('screenshot_path')

  const entries = await readDir(val?.value ? `${val?.value}/images` : '')

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
    <div class="flex flex-row justify-between">
      <div class="mb-2 text-lg font-bold">
        SnapVault
      </div>
      <div class="flex flex-1 flex-row items-center justify-end gap-4">
        <div>Total <span class="mx-1 text-base text-primary font-bold">{{ list.length }}</span></div>
        <div class="flex flex-row items-center justify-center">
          <span class="mx-1 text-sm text-base">Sort by Datetime</span>
          <i class="h-5 w-5 cursor-pointer text-primary" @click="isAscending = !isAscending">
            <svg v-show="isAscending" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="5" height="5" rx=".5" /><rect x="5" y="14" width="5" height="5" rx=".5" /><path d="M14 15l3 3l3-3" /><path d="M17 18V6" /></g></svg>
            <svg v-show="!isAscending" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9l3-3l3 3" /><rect x="5" y="5" width="5" height="5" rx=".5" /><rect x="5" y="14" width="5" height="5" rx=".5" /><path d="M17 6v12" /></g></svg>
          </i>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-4">
      <SnapVaultItem v-for="item in list" :key="item.id" :item="item" @change="loadData" />
    </div>
  </div>
</template>
