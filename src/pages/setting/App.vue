<script setup lang="ts">
import { ref } from 'vue'
import AutoStart from '~/components/AutoStart.vue'

const title = ref<string>('Settings Page')
</script>

<template>
  <div class="setting">
    <h1>{{ title }}</h1>
    <a href="/index.html">Back to Home</a>
    <AutoStart />
  </div>
</template>

