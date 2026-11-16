# Manual fixes

`migrate` leaves a finding as manual (`fixable: false`) when there is no safe rewrite. The finding's `reason` names the case. Match it below.

## "Used in the template of an Options API component"

The template calls an auto-imported function, but the component uses the Options API, so an import in `<script>` does not reach the template.

Preferred fix: convert the component to `<script setup>`, then run `migrate` on the file again.

Smaller fix: import the function in `<script>` and expose it.

```vue
<script>
import { formatDate } from '~/utils/format'

export default {
  methods: { formatDate },
}
</script>
```

## "is used with different hydration strategies"

The same `Lazy*` tag is used with two hydration props, for example `<LazyCard hydrate-on-visible>` and `<LazyCard hydrate-on-idle>`. Define one component per strategy and rename the tags:

```vue
<script setup lang="ts">
import { defineLazyHydrationComponent } from '#app/composables/lazy-hydration'

const LazyCardVisible = defineLazyHydrationComponent('visible', () => import('~/components/Card.vue'))
const LazyCardIdle = defineLazyHydrationComponent('idle', () => import('~/components/Card.vue'))
</script>

<template>
  <LazyCardVisible hydrate-on-visible />
  <LazyCardIdle hydrate-on-idle />
</template>
```

Strategies: `visible`, `idle`, `interaction`, `mediaQuery`, `time` (`hydrate-after`), `if` (`hydrate-when`), `never`.

## "Lazy hydration on a component that is not a local `.vue` file"

A hydration prop is set on a component from a module, or on a `.client`/`.server` component. Use `defineLazyHydrationComponent()` as shown above, with the component's real import path. If the component has no importable path, ask the user before you drop the hydration prop.

## "The component options object could not be found"

The `<script>` block has a default export that is not an object literal or `defineComponent({...})` / `defineNuxtComponent({...})`, for example `export default someFactory()`. Import the component and register it wherever that export defines its `components`. If you cannot find that place, convert the file to `<script setup>`.
