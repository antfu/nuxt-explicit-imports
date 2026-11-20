<script setup lang="ts">
const model = defineModel<string>({ default: '' })
defineProps<{ label: string }>()
</script>

<template>
  <label class="form-input">
    {{ label }}
    <input v-model="model">
  </label>
</template>
