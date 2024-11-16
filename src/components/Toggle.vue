<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue'

const emit = defineEmits<{
  (e: 'change'): void
}>()

const props = defineProps<{
  label?: string
  class?: string
  value: boolean
  change?: (value: boolean) => void
}>()

const state = ref(props.value)

const toggleState = () => {
  state.value = !state.value
  emit('change')
}
</script>

<template>
  <div
    class="inline-flex flex flex-center cursor-pointer select-none"
    @click="toggleState"
  >
    <div
      class="w-10 h-6 bg-gray-300 rounded-full relative transition-colors duration-300"
      :class="[state ? 'bg-primary active:bg-primary-active' : '']"
    >
      <div
        class="w-5 h-5 bg-white rounded-full absolute top-1/2 transform -translate-y-1/2 transition-transform duration-300"
        :class="[state ? 'translate-x-4' : '']"
      ></div>
    </div>
     <span v-if="label" class="ml-2 text-secondary">{{ label }}</span>
  </div>
</template>

<style>
.active\:bg-blue-600 {
  @apply bg-blue-600 transition-colors duration-300;
}
</style>