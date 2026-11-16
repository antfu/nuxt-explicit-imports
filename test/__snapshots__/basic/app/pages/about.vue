<script lang="ts">
import MyButton from '~/components/MyButton.vue'
import { defineNuxtComponent } from '#app'

export default defineNuxtComponent({
  components: { MyButton },
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
