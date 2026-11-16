<script lang="ts">
export default defineNuxtComponent({
  data() {
    return { title: 'About' }
  },
})
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <my-button />
  </div>
</template>
