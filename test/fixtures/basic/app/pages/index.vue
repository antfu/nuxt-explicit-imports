<script setup lang="ts">
const route = useRoute()
const { count, increment } = useCounter()
const double = computed(() => count.value * 2)
const now: Ref<Date> = ref(new Date())
const base = useBase()
</script>

<template>
  <div>
    <p>{{ route.path }} {{ double }} {{ base }} {{ sum(1, 2) }}</p>
    <p>{{ formatDate(now) }}</p>
    <MyButton @click="increment">
      Increment
    </MyButton>
    <LazyHeavyChart />
    <LazyFancyCard hydrate-on-visible />
    <ClientWidget />
    <NuxtLink to="/about">
      About
    </NuxtLink>
  </div>
</template>
