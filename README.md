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
> In our [evals](./eval/runs/README.md), coding agents did slightly better with auto-imports than with explicit imports: explicit imports used more tokens for 4 of 6 agent setups and fewer for 2, hit more errors while working, and passed about as often. The gap is small and varies a lot between models and tasks, and the evals use a small fixture app, so it may not match real usage. We are still looking for cases that show otherwise.

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

## Evals

<details>
<summary>Do coding agents work better with auto-imports or explicit imports?</summary>

We ran the same 9 tasks (features, refactors, bug fixes) on a small Nuxt store app twice: once with auto-imports on, once with explicit imports and auto-imports off. 6 agent setups, 5 trials each, 1,080 runs. Each run is checked by a hidden typecheck, build and assertions on the built server. Neither arm uses this module. See [`eval/`](./eval/README.md) and the [stored runs](./eval/runs/README.md).

| Agent | Pass (auto / explicit) | Tokens | Cost | Errors hit (auto / explicit) |
| --- | --- | --- | --- | --- |
| Sonnet 5.5 (Claude Code) | 45/45 / 43/45 | +10% | +12% | 0 / 35 |
| Haiku 5.5 (Claude Code) | 45/45 / 45/45 | +23% | +18% | 0 / 1 |
| Opus 5.5 (Claude Code) | 45/45 / 45/45 | -17% | -7% | 1 / 0 |
| Haiku 5.5 (pi) | 44/45 / 43/45 | +5% | +5% | 5 / 0 |
| GPT-5.3 Codex (pi) | 43/45 / 42/45 | +10% | +1% | 0 / 80 |
| Gemini 3.5 Flash (pi) | 40/45 / 39/45 | -3% | +1% | 0 / 1 |

Tokens and cost are means per run, explicit compared to auto.

**Against explicit imports:**

- Agents hit more errors while working (117 against 6), mostly broken import paths after moving files. Typecheck catches them and the agents mostly fix them, so the cost is extra turns.
- Refactors that move files into a new layer usually cost more, since every import path changes.
- A forgotten component import passes typecheck and build, and the component renders as nothing.
- 5 fewer passing runs out of 270. This is not significant.

**For explicit imports:**

- A rename that changes component names was cheaper in 3 of 6 setups, since a missed tag in auto renders nothing.
- Opus used fewer tokens, and Opus and Haiku in pi hit almost no errors.

**Caveats:**

- The direction is not stable. It changes with the model, the harness and the task.
- The fixture is small, and 5 trials per cell is few.
- Agent time is not compared. For 4 of the 6 setups the two arms ran at different times, which skews it. In the two that ran together, there is no clear difference.
- Not measured: readability for humans, tooling, and how clear the dependency graph is. Those are the usual reasons to prefer explicit imports.

</details>

## License

[MIT](./LICENSE) License © [Anthony Fu](https://github.com/antfu)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-explicit-imports?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmx.dev/package/nuxt-explicit-imports
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-explicit-imports?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmx.dev/package/nuxt-explicit-imports
[license-src]: https://img.shields.io/github/license/antfu/nuxt-explicit-imports.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/nuxt-explicit-imports/blob/main/LICENSE
