<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  label?: string
  class?: string
  value: boolean
  change?: (value: boolean) => void
}>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

const state = ref(props.value)

function toggleState() {
  state.value = !state.value
  emit('change')
}
</script>

<template>
  <div
    class="flex inline-flex cursor-pointer select-none flex-center"
    @click="toggleState"
  >
    <div
      class="relative h-6 w-10 rounded-full bg-gray-300 transition-colors duration-300"
      :class="[state ? 'bg-primary active:bg-primary-active' : '']"
    >
      <div
        class="absolute top-1/2 h-5 w-5 transform rounded-full bg-white transition-transform duration-300 -translate-y-1/2"
        :class="[state ? 'translate-x-4.5' : 'translate-x-0.5']"
      />
    </div>
    <span v-if="label" class="ml-2 text-secondary">{{ label }}</span>
  </div>
</template>

<style>

</style>
