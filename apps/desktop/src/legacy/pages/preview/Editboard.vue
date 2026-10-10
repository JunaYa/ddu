<script setup lang="ts">
import Button from '~/components/Button.vue'

function handleRevert() {
}

function handleDelete() {
}

function handleDone() {
}

function handleShare() {
}
</script>

<template>
  <div class="flex gap-1">
    <Button class-name="btn-solid" anim @click="handleRevert">
      Revert
    </Button>
    <Button class-name="btn-solid" anim @click="handleDelete">
      Delete
    </Button>
    <Button class-name="btn-solid" anim @click="handleDone">
      Done
    </Button>
    <Button class-name="btn-solid" anim @click="handleShare">
      Share
    </Button>
  </div>
</template>
