<script setup lang="ts">
const props = defineProps<{ size?: string }>()
const classes = computed(() => ['btn', props.size])
</script>

<template>
  <button :class="classes">
    <slot />
  </button>
</template>
