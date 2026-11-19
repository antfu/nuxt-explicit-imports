# Auto-imports on/off eval

Does a coding agent work better on a Nuxt app with auto-imports on, or with explicit imports and auto-imports off? This eval runs the same tasks on both versions of the same app and compares the results.

```bash
pnpm eval --dry-run          # no agent: check the fixtures and tasks, free
pnpm eval --plan             # print how many cells each config would run, run nothing
pnpm eval                    # run every missing cell of the matrix
pnpm eval --configs pi/gpt-5.3-codex --tasks bugfix-multihop --trials 1
pnpm eval report             # rewrite the reports from the stored runs
```

## Matrix

The eval is a matrix of cells: config x task x arm x trial. A config is a harness running one model, listed in `configs.ts`:

| Config                          | Harness     | Model                                      |
| ------------------------------- | ----------- | ------------------------------------------ |
| `claude-code/claude-sonnet-5-5` | Claude Code | `claude-sonnet-5-5`                        |
| `claude-code/claude-haiku-5-5`  | Claude Code | `claude-haiku-5-5`                         |
| `claude-code/claude-opus-5-5`   | Claude Code | `claude-opus-5-5`                          |
| `pi/claude-haiku-5-5`           | pi          | `vercel-ai-gateway/anthropic/claude-haiku-5-5` |
| `pi/gpt-5.3-codex`              | pi          | `vercel-ai-gateway/openai/gpt-5.3-codex`   |
| `pi/gemini-3.5-flash`           | pi          | `vercel-ai-gateway/google/gemini-3.5-flash` |

Claude models run in Claude Code, through the Claude Agent SDK. Other models run in [pi](https://github.com/earendil-works/pi), one harness for every provider. So a gap between a Claude config and a pi config mixes the model and the harness. A gap between the two arms of one config does not.

`pnpm eval` runs only the cells that have no current run. A cell is run again when:

- it has no stored run,
- its stored run is stale: the task's prompt, seed or check, the arm's system prompt note, or a fixture file, changed since (see `fingerprint()` in `store.ts`),
- its stored run is broken: a harness error, or an agent error like a failed API call,
- or `--force` is set.

So adding a config, a task or trials runs just the new cells, and a stopped eval goes on where it stopped: each run is saved as soon as it ends.

## Auth

- Claude Code: `ANTHROPIC_AUTH_TOKEN` with `ANTHROPIC_BASE_URL` (a gateway), then `ANTHROPIC_API_KEY`, then your local Claude Code login. With only `AI_GATEWAY_API_KEY` set, it goes through the Vercel AI Gateway.
- pi: `AI_GATEWAY_API_KEY`, for the Vercel AI Gateway.

Before the runs start, one short preflight call per config checks the auth, and the eval stops if one fails.

## Stored runs

`eval/runs/` is committed. `eval/runs/README.md` compares every config, and each config folder has:

- `summary.md`: pass rate, efficiency per arm and per task, tool usage and error counts
- `<task>/<arm>-<trial>.json`: the run, with assertions and agent metrics
- `<task>/<arm>-<trial>.diff`: what the agent changed
- `<task>/<arm>-<trial>.tools.json`: every tool call, in order, with its input, its kinds and its output
- `<task>/<arm>-<trial>.gates.log`: typecheck and build logs, when a gate failed

## Arms

Each fixture in `fixtures/` comes in two arms. The source is the same, only the imports differ.

- `auto`: plain Nuxt, auto-imports on.
- `explicit`: the same source with every import written out, and `imports.autoImport: false`, `components.dirs: []` and `nitro.imports.autoImport: false`.

The `explicit` arm is written by hand, not by our codemod, so the eval does not depend on the codemod's output. Its imports follow one style:

- type imports first, then `vue` and `h3`, then `#imports` and `#components`, then `#shared/`, `#server/` and `#layers/`, then `~/`
- Nuxt composables and helpers from `#imports` (not `#app`), built-in components like `NuxtLink` from `#components`
- app, layer, shared and server code from its own file, components as default imports of the `.vue` file

`pnpm eval --dry-run` checks that the arms differ only in their imports and `nuxt.config.ts` files.

Neither arm installs this module or its skill, so the eval measures the import style, not our tooling.

The only fixture, `shop`, is a small store of about 45 files: product, cart and checkout pages, a `base` layer and a `ui` layer, nested components and a server API. Its traps:

- Same names in different places: `formatMoney` in `app/utils` (`$19.99`) and `server/utils` (`19.99 USD`), and a ui layer `ProductCard` that the app's `components/product/Card.vue` overrides.
- Layer overrides: the base layer has a legacy `useCart` with the same API as the app's (but in-memory state), and a `useTheme` that the app overrides.
- Similar helpers: the cart rounds discounts down (`applyDiscount`), the base layer's `percentOf` and the server's `computeDiscount` round to nearest.
- Components used only in templates, from the app and from the ui layer. `UiBadge` is used on the header, product and checkout pages.

## Tasks

`tasks.ts` holds 9 tasks: 4 features, 3 refactors, 2 bug fixes. The prompt is the same in both arms and does not say which arm it is.

| Task                            | What makes it hard                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `feature-deals-page`            | Template-only components (app `ProductCard` vs the ui layer's, `UiBadge`), a base layer util         |
| `feature-product-discount`      | Must find the cart's rounding helper, not the similar `percentOf`                                    |
| `refactor-rename-cart`          | 9 files. In `auto`, a missed call still compiles and silently uses the base layer's legacy `useCart` |
| `refactor-move-cart-components` | In `auto`, the component names change (`CartItem` -> `CheckoutItem`), a missed tag renders nothing   |
| `feature-order-flow`            | API, store and page. The page must show the server's total (rounds to nearest), not recompute it with the UI's `applyDiscount` (rounds down): `$37.33`, not `$37.34` |
| `feature-pill-badge`            | Override a ui layer component. In `explicit`, every import of the layer's `UiBadge` must change, a missed one silently keeps the old badge |
| `refactor-extract-cart-layer`   | 8 files into a new layer. The cart must still win over the base layer's legacy `useCart`, and in `explicit` every import path changes |
| `bugfix-multihop`               | The cause is a shared `clamp`, 4 calls away from the symptom, used by the app and the server         |
| `bugfix-lost-override`          | The app's `useTheme` override no longer wins over the base layer                                     |

Bug-fix tasks seed the bug before the agent starts. A seed can be limited to one arm when the same bug needs a different edit there, like the import that `bugfix-lost-override` points at the layer.

## A run

1. Copy the fixture arm to a temp dir outside the repo, apply the seed and commit it. `node_modules` holds symlinks to the repo's packages.
2. Run the agent. Both harnesses load no user settings, CLAUDE.md, AGENTS.md or skills. Defaults: 40 turns, 10 minutes. They append the same text to their own system prompt (see `systemAppend()` in `metrics.ts`):
   - both arms: the app is a Nuxt 4 app in the current directory, and the agent works only inside it
   - `explicit` only: every auto-import is off, and every name and every template component must be imported, from `vue`, `#imports`, `#components`, `h3` or its own file. The `auto` arm needs no note: it is plain Nuxt, which is what a model expects.
   - Claude Code: all tools except web and sub-agents.
   - pi: its built-in tools (`read`, `bash`, `edit`, `write`), an empty config dir, and no extensions, prompt templates or MCP. pi has no turn limit, so the runner stops it after 40 turns.
3. Score with hidden gates the agent never sees: `nuxt typecheck`, `nuxt build`, then the task's check against the built server (SSR HTML and API JSON).

A run passes when typecheck, build and every assertion pass. What the agent says about its own work does not count.

## Efficiency

Every agent run records, and `summary.md` compares per arm (median, mean, and the change from `auto` to `explicit`):

| Metric                       | Source                                                                    |
| ---------------------------- | ------------------------------------------------------------------------- |
| Turns                        | `num_turns` of the SDK result                                             |
| Tool calls, per tool         | `tool_use` blocks                                                         |
| Tool calls, per purpose      | `explore` (Read, Grep, Glob, read-only Bash), `edit`, `verify` (typecheck, build, tests), `other`. Bash calls are sorted by their command, after heredoc bodies and quoted text are dropped. A chained call (`&&`, `;`, ...) counts once for each kind it does, so the kinds can add up to more than the calls. A later pipeline stage (`\| tail`) counts only when it writes a file |
| Input tokens                 | uncached, cache read and cache write, from `modelUsage`                   |
| Output tokens, total tokens  | `modelUsage`                                                              |
| Tool output read             | characters of tool results sent back to the model                         |
| Agent time, API time         | wall time of the session, `duration_api_ms`                               |
| Cost                         | `total_cost_usd`, an SDK estimate                                         |

When some runs fail, the summary repeats the table for passing runs only, since failed runs often stop early or hit the turn limit. Overall medians mix tasks of different sizes; the per-task table compares like with like.

## Error taxonomy

TypeScript and build errors are counted twice: in the agent's tool output while it worked (errors it hit and maybe fixed) and in the final gates (errors it left).

| Kind                    | Matches                                         |
| ----------------------- | ----------------------------------------------- |
| `missing-name`          | TS2304, TS2552: a name used without its import  |
| `bad-module-path`       | TS2307: an import path that does not exist      |
| `bad-export`            | TS2305, TS2614, TS2724: wrong named export      |
| `duplicate-declaration` | TS2300, TS2440, TS2451                          |
| `other-ts`              | any other TS error                              |
| `build-resolve`         | Rollup/Vite unresolved import or missing export |

## Known limits

- The fixture's `package.json` lists no dependencies, since the workspace links the repo's packages. Haiku often reads that as "nothing installed" and runs `npm install` into its workspace. That costs it tokens and time in both arms alike. Workspaces link each package on its own, so npm can never reach the repo's `node_modules`.
- In the `explicit` arm, a missing component import passes typecheck and build: Nuxt does not use `strictTemplates`, and the component renders as nothing. Only the task checks catch it, by asserting on the rendered HTML. It shows up as a failed assertion, not in the taxonomy.
- Sonnet passed all 60 runs of the first 6 tasks, in about 5 turns each. The last 3 tasks were added to make the tasks harder. Each one was checked with a hand-written solution in both arms.
- When you change a fixture, change both arms the same way. The dry run fails when they drift apart outside imports.
