# nuxt-explicit-imports

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Move a Nuxt 4 app from auto-imports to explicit imports, step by step and without breaking it. The module is made to be run by a coding agent. It ships an agent skill, a codemod and a warn mode.

- **Warn mode**: auto-imports keep working, and every implicit use is reported in the console and in a JSON report.
- **Codemod**: `migrate` writes the missing imports, using the same unimport contexts that Nuxt uses.
- **Strict mode**: turns auto-imports off and fails the build on any implicit use left.
- **Per category**: composables and utils (`imports`), template components (`components`) and server code (`server`) migrate on their own schedule.

Inspired by [nuxt-eslint-auto-explicit-import](https://github.com/antfu/nuxt-eslint-auto-explicit-import).

> [!WARNING]
> According to the [evals](./eval/README.md) we have so far, auto-imports are actually more efficient and cheaper for coding agents than explicit imports. In the [latest run](./eval/results/2026-11-18T06-33-34-500Z/summary.md), the explicit arm used about 16% more tokens and 17% more cost, and passed 43/45 runs against 45/45. We are still looking for cases that show otherwise. Keep this in mind when you use this library.

## With an agent

Install the module and the skill, then ask your agent to migrate:

```bash
npx nuxi module add nuxt-explicit-imports
npx skills add antfu/nuxt-explicit-imports
```

> Migrate this app to explicit imports with the nuxt-explicit-imports skill.

The skill takes the agent through the steps: record a baseline of your gates, migrate one category and one directory at a time, verify each chunk, then switch the category to strict and prove the build still passes.

## By hand

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-explicit-imports'],
  explicitImports: {
    // 'off' | 'warn' | 'strict', or one mode per category
    mode: { imports: 'warn', components: 'warn', server: 'warn' },
  },
})
```

```bash
npx nuxt-explicit-imports check              # list implicit auto-imports, exit 1 if any
npx nuxt-explicit-imports migrate app/pages  # add the imports for one directory
npx nuxt-explicit-imports check --category components --json
```

`check` writes `.nuxt/explicit-imports-report.json`. In warn mode, `nuxi dev` and `nuxi build` update the same file.

A migrated file looks like this:

```diff
 <script setup lang="ts">
+import { computed } from 'vue'
+import { useRoute } from '#app'
+import { useCounter } from '~/composables/useCounter'
+import MyButton from '~/components/MyButton.vue'
+import { NuxtLink } from '#components'
+
 const route = useRoute()
 const { count } = useCounter()
 const double = computed(() => count.value * 2)
 </script>
```

## Options

| Option    | Default  | Description                                                                         |
| --------- | -------- | ----------------------------------------------------------------------------------- |
| `mode`    | `'warn'` | `'off'`, `'warn'` or `'strict'`, or an object with `imports`, `components`, `server` |
| `exclude` | `[]`     | Extra globs, relative to the root dir, that are never checked or migrated            |
| `report`  | `true`   | Write `.nuxt/explicit-imports-report.json` during dev and build                      |

Strict mode sets `imports.autoImport: false` for `imports` and `nitro.imports.autoImport: false` for `server`. For `components`, it keeps Nuxt's component registry, so `#components` still exports `.client`, `.server` and island components, and fails the build on implicit template use.

Config files, tests, `.d.ts` files and generated output are skipped.

## License

[MIT](./LICENSE) License © [Anthony Fu](https://github.com/antfu)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-explicit-imports?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/nuxt-explicit-imports
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-explicit-imports?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmx.dev/package/nuxt-explicit-imports
[license-src]: https://img.shields.io/github/license/antfu/nuxt-explicit-imports.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/nuxt-explicit-imports/blob/main/LICENSE
