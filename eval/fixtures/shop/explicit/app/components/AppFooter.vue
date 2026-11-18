<script setup lang="ts">
import { useNotify } from '#layers/base/app/composables/useNotify'

const { message } = useNotify()
</script>

<template>
  <footer class="app-footer">
    <p v-if="message" class="notify">
      {{ message }}
    </p>
    <p>Free shipping on every order.</p>
  </footer>
</template>
