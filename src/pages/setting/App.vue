<template>
  <div class="setting">
    <h1>{{ title }}</h1>
    <a href="/index.html">Back to Home</a>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref<string>('Settings Page')
</script>