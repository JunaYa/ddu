<script setup lang="ts">
import { readDir } from "@tauri-apps/plugin-fs";
import { LazyStore } from "@tauri-apps/plugin-store";
import { ref, onMounted } from "vue";
import PictureReview from "./PictureReview.vue";
import FileInfo from "./FileInfo.vue";
const store = new LazyStore('settings.json');

const list = ref<{ id: string, image: string, title: string, description: string }[]>([]);

onMounted(async () => {
  const val = await store.get<{ value: string }>('screenshot_path');

  const entries = await readDir(val?.value + '/images' ?? '');

  list.value = entries.map((entry) => ({
    id: entry.name,
    image: `${val?.value}/images/${entry.name}`,
    title: entry.name,
    description: entry.name,
  }));
})
</script>

<template>
  <div>
    <div class="text-lg font-bold mb-2">SnapVault</div>
    <div class="snap-vault-list flex flex-row flex-wrap gap-2">
      <div class="snap-vault-item" v-for="item in list" :key="item.id">
        <!-- <img :src="item.image" alt="screenshot" class="w-38 h-38 rounded-md overflow-hidden" /> -->
        <PictureReview :image-path="item.image" />
        <FileInfo :path="item.image" />
      </div>
    </div>
  </div>
</template>
