<script setup lang="ts">
const props = defineProps<{
  checked: boolean // 是否全选中
  someChecked?: boolean // 是否有选择中的
  disabled?: boolean // 是否禁用
}>()

const emit = defineEmits(['change'])

function handleClick() {
  if (props.disabled) return
  emit('change', !props.checked)
}

</script>
<template>
    <i class="h-6 w-6 cursor-pointer" @click="handleClick">
        <svg v-show="someChecked" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 11h10v2H7z" :fill="disabled ? '#999' : '#232323'"></path></svg>
        <svg v-show="!someChecked && !checked" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" :fill="disabled ? '#999' : '#232323'"></path></svg>
        <svg v-show="!someChecked && checked" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42l-6.59 6.59l-2.58-2.57l-1.42 1.41l4 3.99z" :fill="disabled ? '#999' : '#232323'"></path></svg>
    </i>
</template>
