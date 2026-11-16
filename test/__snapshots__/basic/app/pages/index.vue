<script setup lang="ts">
import MyButton from '~/components/MyButton.vue'
import { useRoute } from '#app'
import { useCounter } from '~/composables/useCounter'
import { computed, ref, defineAsyncComponent } from 'vue'
import type { Ref } from 'vue'
import { useBase } from '#layers/base/app/composables/useBase'
import { sum } from '#shared/utils/sum'
import { formatDate } from '~/utils/format'
import { defineLazyHydrationComponent } from '#app/composables/lazy-hydration'
import { ClientWidget, NuxtLink } from '#components'

const LazyHeavyChart = defineAsyncComponent(() => import('~/components/HeavyChart.vue'))
const LazyFancyCard = defineLazyHydrationComponent('visible', () => import('~/components/FancyCard.vue'))

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
