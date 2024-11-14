<script setup lang="ts">
import { ref } from 'vue'

const title = ref<string>('Settings Page')
</script>

<template>
  <div class="setting">
    <h1>{{ title }}</h1>
    <!-- <AutoStart /> -->
  </div>
</template>
