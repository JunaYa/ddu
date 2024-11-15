<script lang="ts" setup>
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'click'): void
}>()

const props = defineProps<{
  text: string
  class?: string
  anim?: boolean
  onClick?: () => void
}>()

const animate = ref(false)

const onClick = () => {
  emit('click')
  if (props.anim) {
    animate.value = true
  }
}

</script>

<template>
  <button :class="`${animate ? 'animate' : ''} ${props.class}`" v-on:animationend="animate = false" type="button" @click="onClick">
    {{ props.text }}
  </button>
</template>