---
name: nuxt-explicit-imports
description: Migrate a Nuxt 4 app from auto-imports to explicit imports, one category and directory at a time, with self-verification. Use when removing or disabling Nuxt auto-imports, when you see `[nuxt-explicit-imports]` warnings or strict-mode build errors, or when working with `explicitImports` in `nuxt.config`.
---

# Nuxt explicit imports

`nuxt-explicit-imports` moves a Nuxt app off auto-imports without breaking it. Three **categories** migrate independently:

| Category     | Covers                                                                              |
| ------------ | ----------------------------------------------------------------------------------- |
| `imports`    | Vue and Nuxt composables, your `composables/` and `utils/`, `shared/utils`, module imports |
| `components` | Template tags: your `components/`, `Lazy*` variants, `NuxtLink`, module components    |
| `server`     | Everything auto-imported in `server/`: `defineEventHandler`, `h3`, `server/utils`     |

Each category has a **mode**: `off`, `warn` (auto-imports work, every implicit use is reported) or `strict` (auto-imports are disabled, implicit use fails the build).

The work is a **ratchet**: a category moves `warn` → migrated → verified → `strict`, and never back.

## Tools

- `npx nuxt-explicit-imports check [paths...] [--category <list>] [--json]` lists every implicit use and exits `1` while any remain. It also writes `.nuxt/explicit-imports-report.json` (each finding has `file`, `line`, `name`, `suggestion`, `fixable`, `reason`).
- `npx nuxt-explicit-imports migrate [paths...] [--category <list>] [--dry-run]` writes the explicit imports for every `fixable` finding and lists the rest as manual work.
- In `warn` mode, `nuxi dev` and `nuxi build` print one warning line per file and update the same report.

`check` is the source of truth. It scans every file, including the ones dev never visits.

## Steps

### 1. Set up

1. Install the module: `npx nuxi module add nuxt-explicit-imports`.
2. Set warn mode in `nuxt.config`:

   ```ts
   export default defineNuxtConfig({
     modules: ['nuxt-explicit-imports'],
     explicitImports: { mode: 'warn' },
   })
   ```

3. Run `npx nuxt-explicit-imports check` once and tell the user the totals per category.

Done when `check` runs and prints its summary.

### 2. Record the baseline

Find the project's own gates in `package.json` scripts: typecheck (usually `nuxi typecheck`), lint, tests, build. Run each one and write down which pass and which already fail.

Done when you have a pass/fail entry for every gate. Every later step is judged against this baseline, so a gate that was already failing does not block the migration.

### 3. Migrate one category

Work through the categories in this order: `imports`, then `components`, then `server`. Within a category, take one top-level directory at a time (`app/composables`, `app/pages`, `app/components`, `server/api`, ...). This keeps each diff small enough for the user to review.

For each directory:

1. `npx nuxt-explicit-imports migrate --category <category> <dir>`
2. Fix every finding it lists as manual, using [references/manual-fixes.md](references/manual-fixes.md).
3. Run the lint fixer if the project has one (`eslint --fix`), so the new imports follow the house style.
4. Verify: `npx nuxt-explicit-imports check --category <category> <dir>` exits `0`, and typecheck, lint and tests are no worse than the baseline.
5. Tell the user the directory is migrated and verified. Leave committing to them.

Done when `npx nuxt-explicit-imports check --category <category>` exits `0` for the whole project.

### 4. Make the category strict

1. Set that category to `strict` and keep the others as they are:

   ```ts
   export default defineNuxtConfig({
     explicitImports: {
       mode: { imports: 'strict', components: 'warn', server: 'warn' }
     },
   })
   ```

2. Run the build (`nuxi build`) and the typecheck.
3. If the build fails with `Implicit auto-imports are disabled (strict mode)`, the error lists each file, position and import to add. Run `migrate` on that path, or add the import by hand, then rebuild.

Done when the build and typecheck pass with the category strict and the other gates match the baseline. Then go back to step 3 for the next category.

### 5. Finish

When all three categories are strict, set `explicitImports: { mode: 'strict' }` and run every gate one last time. Done when every gate matches or beats the baseline.

## What strict mode changes

- `imports` strict sets `imports.autoImport: false`. The `#imports` virtual module keeps working.
- `server` strict turns off Nitro's auto-imports (`nitro.imports.autoImport: false`). The module keeps this independent of `imports`, although Nuxt normally links the two.
- `components` strict keeps Nuxt's component registry, so `#components` still exports every component, including `.client`/`.server` ones and islands. Implicit use of a component in a template then fails the build.

## Gotchas

- A finding whose suggestion imports from `#imports` comes from a package path that cannot be imported directly. It works, but tell the user so they can pick a public entry point instead.
- Imports are written from the original source (`vue`, `#app`, `~/composables/foo`, `#server/utils/bar`, `#layers/<name>/...`), never as relative paths. Keep that style when you fix findings by hand.
- These files are skipped on purpose: `*.config.*`, tests (`*.test.*`, `*.spec.*`, `test/`, `tests/`), `.d.ts` files and generated output. Add more with `explicitImports.exclude` (globs relative to the root dir).
