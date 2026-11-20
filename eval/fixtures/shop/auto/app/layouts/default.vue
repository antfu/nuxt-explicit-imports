<script setup lang="ts">
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
