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
    <div class="flex flex-row flex-wrap gap-2">
      <div class="bg-card rounded-md p-2" v-for="item in list" :key="item.id">
        <PictureReview :image-path="item.image" />
        <FileInfo :path="item.image" />
      </div>
    </div>
  </div>
</template>
