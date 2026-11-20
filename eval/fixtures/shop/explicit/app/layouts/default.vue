<script setup lang="ts">
import AppFooter from '~/components/AppFooter.vue'
import AppHeader from '~/components/AppHeader.vue'
import { useTheme } from '~/composables/useTheme'

const theme = useTheme()
</script>

<template>
  <div :class="`theme-${theme}`">
    <AppHeader />
    <main>
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
