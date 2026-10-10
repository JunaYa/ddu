<script setup lang="ts">
import { invoke } from '@tauri-apps/api/core'
import { confirm } from '@tauri-apps/plugin-dialog'
import { watchDebounced } from '@vueuse/core'
import { computed, onMounted, ref, watch } from 'vue'
import Checkbox from '~/components/Checkbox.vue'
import SnapVaultItem from './SnapVaultItem.vue'
import Empty from './Empty.vue'
import SnapVaultItemList from './SnapVaultItemList.vue'

interface HistoryItem {
  id: string
  filename: string
  full_path: string
  captured_at: string
}

const list = ref<{ id: string, image: string, checked: boolean, datetime: Date }[]>([])

const displayMode = ref<'list' | 'grid'>('grid')

const isAscending = ref(false)

const deleteLoading = ref(false)
const combining = ref(false)
const indexing = ref(false)
const indexNotice = ref('')

// Text search over the local OCR index; `null` means no search is active.
const query = ref('')
const matchedIds = ref<Set<string> | null>(null)

const visibleList = computed(() => {
  const ids = matchedIds.value
  return ids ? list.value.filter(item => ids.has(item.id)) : list.value
})

const isCheckedAll = computed(() => visibleList.value.length > 0 && visibleList.value.every(item => item.checked))

const hasChecked = computed(() => list.value.some(item => item.checked))

const checkedCount = computed(() => list.value.filter(item => item.checked).length)

let searchSeq = 0
async function runSearch() {
  const seq = ++searchSeq
  const q = query.value.trim()
  const ids = q ? new Set(await invoke<string[]>('search_history_text', { query: q })) : null
  // Drop responses that a newer keystroke has superseded.
  if (seq === searchSeq) matchedIds.value = ids
}

// Only visible items stay selectable, so actions never touch hidden ones.
watch(query, () => onChangeAll(false))
watchDebounced(query, runSearch, { debounce: 200 })

/** OCR the selected screenshots so they become searchable by text. */
async function handleIndex() {
  const checked = list.value.filter(item => item.checked)
  if (checked.length === 0 || indexing.value) return
  indexing.value = true
  indexNotice.value = `正在识别 ${checked.length} 张截图…`
  try {
    const count = await invoke<number>('ocr_index_items', { paths: checked.map(item => item.image) })
    indexNotice.value = count === checked.length
      ? `已为 ${count} 张截图建立文字索引`
      : `已索引 ${count} / ${checked.length} 张，其余识别失败`
    await runSearch()
  }
  catch (error) {
    indexNotice.value = `建立索引失败: ${error}`
  }
  finally {
    indexing.value = false
  }
}

async function loadData() {
  // Read the history through the backend so custom save paths work and the
  // fs scope can stay tightened. The command lists/filters image files in the
  // controlled directory and returns metadata.
  const items = await invoke<HistoryItem[]>('list_history_items', { path: 'images' })

  list.value = items.map(item => ({
    id: item.id,
    image: item.full_path,
    checked: false,
    datetime: item.captured_at ? new Date(item.captured_at) : new Date(0),
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
  const visible = new Set(visibleList.value.map(item => item.id))
  list.value = list.value.map(item => ({ ...item, checked: checked && visible.has(item.id) }))
}

function onChange(id: string, checked: boolean) {
  list.value = list.value.map(item => item.id === id ? { ...item, checked } : item)
}

async function handleDelete() {
  if (deleteLoading.value) return
  deleteLoading.value = true
  const newList = list.value.filter(item => item.checked)
  const confirmation = await confirm(
    `是否确认将 ${ newList.length } 个截图移到废纸篓？`,
    { title: '确认删除', kind: 'warning' },
  )
  if (confirmation) {
    await invoke('delete_history_items', { paths: newList.map(item => item.image) })
    await loadData()
  }
  deleteLoading.value = false

}

function mimeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  return 'image/png'
}

async function loadImageEl(path: string): Promise<HTMLImageElement> {
  const b64 = await invoke<string>('get_image_base64', { path })
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img), { once: true })
    img.addEventListener('error', () => reject(new Error('image decode failed')), { once: true })
    img.src = `data:${mimeFor(path)};base64,${b64}`
  })
}

// Compose the selected captures into one image and open it in the editor.
// Vertical: images stacked top-to-bottom, left-aligned, canvas width = widest.
// Horizontal: images left-to-right, top-aligned, canvas height = tallest.
// Mismatched sizes get white fill; oversized composites are downscaled.
async function handleCombine(layout: 'horizontal' | 'vertical') {
  const checked = list.value.filter(item => item.checked)
  if (checked.length < 2 || combining.value) return
  combining.value = true
  try {
    const imgs = await Promise.all(checked.map(item => loadImageEl(item.image)))

    let canvasW: number
    let canvasH: number
    if (layout === 'vertical') {
      canvasW = Math.max(...imgs.map(im => im.naturalWidth))
      canvasH = imgs.reduce((sum, im) => sum + im.naturalHeight, 0)
    }
    else {
      canvasW = imgs.reduce((sum, im) => sum + im.naturalWidth, 0)
      canvasH = Math.max(...imgs.map(im => im.naturalHeight))
    }

    const MAX = 8000
    const scale = Math.min(1, MAX / Math.max(canvasW, canvasH))
    const cw = Math.max(1, Math.round(canvasW * scale))
    const ch = Math.max(1, Math.round(canvasH * scale))

    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, cw, ch)

    let offset = 0
    for (const im of imgs) {
      const w = im.naturalWidth * scale
      const h = im.naturalHeight * scale
      if (layout === 'vertical') {
        ctx.drawImage(im, 0, offset, w, h)
        offset += h
      }
      else {
        ctx.drawImage(im, offset, 0, w, h)
        offset += w
      }
    }

    const base64 = canvas.toDataURL('image/png').split(',')[1]
    await invoke('open_combined_image', { base64 })
  }
  finally {
    combining.value = false
  }
}

onMounted(async () => {
  loadData()
})
</script>

<template>
  <div>
    <div class="liquid-glass liquid-glass-toolbar flex flex-row justify-between px-3 py-2">
      <div class="text-lg font-bold">
        SnapVault
      </div>
      <div class="flex flex-1 flex-row items-center justify-end gap-4">
        <input
          v-model="query"
          type="search"
          class="liquid-glass-control input-base h-8 w-56 rounded-md px-3 text-left text-sm"
          placeholder="搜索截图文字 Search text"
          aria-label="搜索截图中的文字 Search text in screenshots"
        >
        <div v-if="matchedIds">
          Matches <span class="mx-1 text-base text-primary font-bold">{{ visibleList.length }}</span>
        </div>
        <div v-else>Total <span class="mx-1 text-base text-primary font-bold">{{ list.length }}</span></div>
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
    <div class="liquid-glass liquid-glass-toolbar my-4 flex flex-row items-center justify-start gap-4 px-3 py-2">
      <div class="flex flex-row items-center justify-center gap-2"> 
        <span>全部</span>
        <Checkbox :checked="isCheckedAll" :some-checked="hasChecked && !isCheckedAll" :disabled="visibleList.length === 0" @change="onChangeAll" />
      </div>
      <div v-if="hasChecked" class="liquid-glass-control h-8 w-8 flex cursor-pointer flex-row items-center justify-center gap-2 rounded-full" @click="handleDelete">
        <i class="h-6 w-6 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32"><path d="M12 12h2v12h-2z" fill="currentColor" /><path d="M18 12h2v12h-2z" fill="currentColor" /><path d="M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z" fill="currentColor" /><path d="M12 2h8v2h-8z" fill="currentColor" /></svg>
        </i>
      </div>
      <button
        v-if="hasChecked"
        class="liquid-glass-control cursor-pointer rounded-md px-3 py-1 text-sm"
        :class="{ 'opacity-50 pointer-events-none': indexing }"
        title="识别所选截图中的文字，以便搜索 OCR selected screenshots so they can be searched"
        @click="handleIndex"
      >
        {{ indexing ? '识别中…' : '建立文字索引' }}
      </button>
      <span v-if="indexNotice" class="text-sm text-secondary" role="status">{{ indexNotice }}</span>
      <div v-if="checkedCount >= 2" class="flex flex-row items-center justify-center gap-2" :class="{ 'opacity-50 pointer-events-none': combining }">
        <span class="text-sm">拼合</span>
        <button class="liquid-glass-control cursor-pointer rounded-md px-3 py-1 text-sm" @click="handleCombine('vertical')">竖排</button>
        <button class="liquid-glass-control cursor-pointer rounded-md px-3 py-1 text-sm" @click="handleCombine('horizontal')">横排</button>
      </div>
    </div>
    <div v-if="visibleList.length > 0" class="flex flex-row items-center justify-center">
      <div v-if="displayMode === 'list'" class="grid grid-cols-1 gap-4">
        <SnapVaultItemList v-for="item in visibleList" :key="item.id" :item="item" @remove="loadData" @change="(val: boolean) => onChange(item.id, val)" />
      </div>
      <div v-else class="snap-vault-masonry">
        <SnapVaultItem v-for="item in visibleList" :key="item.id" :item="item" @change="loadData" />
      </div>
    </div>
    <div v-else-if="matchedIds" class="py-12 text-center text-secondary">
      没有截图包含“{{ query.trim() }}”。只有建立过文字索引的截图可被搜索。
    </div>
    <Empty v-else />
  </div>
</template>

<style scoped>
.snap-vault-masonry {
  width: min(100%, 1040px);
  column-count: 3;
  column-gap: 1rem;
}

@media (max-width: 760px) {
  .snap-vault-masonry {
    column-count: 2;
  }
}

@media (max-width: 480px) {
  .snap-vault-masonry {
    column-count: 1;
  }
}
</style>
