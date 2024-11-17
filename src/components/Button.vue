<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps<{
  class?: string
  anim?: boolean
  onClick?: () => void
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const animate = ref(false)

function onClick() {
  emit('click')
  if (props.anim) {
    animate.value = true
  }
}
</script>

<template>
  <button :class="`${animate ? 'animate' : ''} ${props.class}`" type="button" @animationend="animate = false" @click="onClick">
    <slot />
  </button>
</template>
