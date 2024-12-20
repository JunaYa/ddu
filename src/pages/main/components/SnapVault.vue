<script setup lang="ts">
import { readDir, remove } from '@tauri-apps/plugin-fs'
import { LazyStore } from '@tauri-apps/plugin-store'
import { confirm } from '@tauri-apps/plugin-dialog'
import { computed, onMounted, ref, watch } from 'vue'
import { FileSizeFormatter } from '~/utils/file'
import Checkbox from '~/components/Checkbox.vue'
import SnapVaultItem from './SnapVaultItem.vue'
import Empty from './Empty.vue'
import SnapVaultItemList from './SnapVaultItemList.vue'

const store = new LazyStore('settings.json')

const list = ref<{ id: string, image: string, checked: boolean, datetime: Date }[]>([])

const displayMode = ref<'list' | 'grid'>('list')

const isAscending = ref(false)

const deleteLoading = ref(false)

const isCheckedAll = computed(() => list.value.length > 0 && list.value.every(item => item.checked))

const hasChecked = computed(() => list.value.some(item => item.checked))

async function loadData() {
  const val = await store.get<{ value: string }>('screenshot_path')

  const entries = await readDir(val?.value ? `${val?.value}/images` : '')
  
  list.value = entries.filter(entry => entry.isFile && FileSizeFormatter.isPictureFile(entry.name)).map(entry => ({
    id: entry.name,
    image: `${val?.value}/images/${entry.name}`,
    checked: false,
    datetime: new Date(parseInt(entry.name.replace(/^screenshot_|_|\.png$/g, ''))),
  }))
  list.value.sort((a, b) => {
    return isAscending.value ? a.datetime.getTime() - b.datetime.getTime() : b.datetime.getTime() - a.datetime.getTime()
  })
}

watch(isAscending, () => {
  if (list.value.length > 0) {
    list.value.sort((a, b) => {
      return isAscending.value ? a.datetime.getTime() - b.datetime.getTime() : b.datetime.getTime() - a.datetime.getTime()
    })
  }
})

function onChangeAll(checked: boolean) {
  list.value = list.value.map(item => ({ ...item, checked }))
}

function onChange(index: number, checked: boolean) {
  let newList = list.value.slice()
  newList[index].checked = checked
  list.value = newList
}

async function handleDelete() {
  if (deleteLoading.value) return
  deleteLoading.value = true
  const newList = list.value.filter(item => item.checked)
  const confirmation = await confirm(
    `是否确认删除 ${ newList.length } 个文件?`,
    { title: '确认删除', kind: 'warning' },
  )
  if (confirmation) {
    for (const item of newList) {
      await remove(item.image)
    }
    await loadData()
  }
  deleteLoading.value = false

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
        <div class="flex flex-row items-center justify-center">
          <span class="mx-1 text-sm text-base">Display</span>
          <i class="h-5 w-5 cursor-pointer text-primary" @click="displayMode = displayMode === 'list' ? 'grid' : 'list'">
            <svg v-if="displayMode === 'list'" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><path d="M10 6h18v2H10z" fill="currentColor"></path><path d="M10 24h18v2H10z" fill="currentColor"></path><path d="M10 15h18v2H10z" fill="currentColor"></path><path d="M4 15h2v2H4z" fill="currentColor"></path><path d="M4 6h2v2H4z" fill="currentColor"></path><path d="M4 24h2v2H4z" fill="currentColor"></path></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><path d="M12 4H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 8H6V6h6z" fill="currentColor"></path><path d="M26 4h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 8h-6V6h6z" fill="currentColor"></path><path d="M12 18H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zm0 8H6v-6h6z" fill="currentColor"></path><path d="M26 18h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zm0 8h-6v-6h6z" fill="currentColor"></path></svg>
          </i>
        </div>
      </div>
    </div>
    <div class="flex flex-row items-center justify-start gap-4 my-4">
      <div class="flex flex-row items-center justify-center gap-2"> 
        <span>全部</span>
        <Checkbox :checked="isCheckedAll" :some-checked="hasChecked && !isCheckedAll" :disabled="list.length === 0" @change="onChangeAll" />
      </div>
      <div v-if="hasChecked" class="flex flex-row items-center justify-center gap-2" @click="handleDelete">
        <i class="h-6 w-6 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><path d="M12 12h2v12h-2z" fill="currentColor" /><path d="M18 12h2v12h-2z" fill="currentColor" /><path d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z" fill="#232323" /><path d="M12 2h8v2h-8z" fill="#232323" /></svg>
        </i>
      </div>
    </div>
    <div v-if="list.length > 0" class="flex flex-row items-center justify-center">
      <div v-if="displayMode === 'list'" class="grid grid-cols-1 gap-4">
        <SnapVaultItemList v-for="(item, index) in list" :key="item.id" :item="item" @remove="loadData" @change="(val: boolean) => onChange(index, val)" />
      </div>
        <div v-else class="grid grid-cols-3 gap-4">
          <SnapVaultItem v-for="item in list" :key="item.id" :item="item" @change="loadData" />
      </div>
    </div>
    <Empty v-else />
  </div>
</template>
