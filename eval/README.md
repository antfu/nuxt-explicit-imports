# Auto-imports on/off eval

Does a coding agent work better on a Nuxt app with auto-imports on, or with explicit imports and auto-imports off? This eval runs the same tasks on both versions of the same app and compares the results.

```bash
pnpm eval --dry-run          # no agent: check the fixtures and tasks, free
pnpm eval                    # 6 tasks x 2 arms x 5 trials = 60 agent runs
pnpm eval --tasks bugfix-multihop --trials 1 --model claude-haiku-5-5
```

The agent uses `ANTHROPIC_AUTH_TOKEN` with `ANTHROPIC_BASE_URL` (a gateway), then `ANTHROPIC_API_KEY`, then your local Claude Code login. With only `AI_GATEWAY_API_KEY` set, it goes through the Vercel AI Gateway. Before the runs start, one short preflight call checks the auth, and the eval stops if it fails. Results go to `eval/results/<date>/`:

- `summary.md`: pass rate, efficiency per arm and per task, tool usage and error counts
- `results.json`: every run, with assertions and agent metrics
- `diffs/`: what the agent changed in each run
- `gates/`: typecheck and build logs of the runs where a gate failed
- `tools/`: every tool call of each run, in order, with its input, its kinds and its output

## Arms

Each fixture in `fixtures/` comes in two arms. The source is the same, only the imports differ.

- `auto`: plain Nuxt, auto-imports on.
- `explicit`: the `auto` arm after `nuxt-explicit-imports migrate`, with `imports.autoImport: false`, `components.dirs: []` and `nitro.imports.autoImport: false`.

Neither arm installs this module or its skill, so the eval measures the import style, not our tooling.

The only fixture, `shop`, is a small store of about 45 files: product, cart and checkout pages, a `base` layer and a `ui` layer, nested components and a server API. Its traps:

- Same names in different places: `formatMoney` in `app/utils` (`$19.99`) and `server/utils` (`19.99 USD`), and a ui layer `ProductCard` that the app's `components/product/Card.vue` overrides.
- Layer overrides: the base layer has a legacy `useCart` with the same API as the app's (but in-memory state), and a `useTheme` that the app overrides.
- Similar helpers: the cart rounds discounts down (`applyDiscount`), the base layer's `percentOf` and the server's `computeDiscount` round to nearest.
- Components used only in templates, from the app and from the ui layer.

## Tasks

`tasks.ts` holds 6 tasks, 2 per kind. The prompt is the same in both arms and does not say which arm it is.

| Task                            | What makes it hard                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `feature-deals-page`            | Template-only components (app `ProductCard` vs the ui layer's, `UiBadge`), a base layer util         |
| `feature-product-discount`      | Must find the cart's rounding helper, not the similar `percentOf`                                    |
| `refactor-rename-cart`          | 9 files. In `auto`, a missed call still compiles and silently uses the base layer's legacy `useCart` |
| `refactor-move-cart-components` | In `auto`, the component names change (`CartItem` -> `CheckoutItem`), a missed tag renders nothing   |
| `bugfix-multihop`               | The cause is a shared `clamp`, 4 calls away from the symptom, used by the app and the server         |
| `bugfix-lost-override`          | The app's `useTheme` override no longer wins over the base layer                                     |

Bug-fix tasks seed the bug before the agent starts. A seed can be limited to one arm when the same bug needs a different edit there, like the import that `bugfix-lost-override` points at the layer.

## A run

1. Copy the fixture arm to a temp dir outside the repo, apply the seed and commit it. `node_modules` holds symlinks to the repo's packages.
2. Run the agent with the Claude Agent SDK: the Claude Code system prompt, all tools except web and sub-agents, and no user settings, CLAUDE.md or skills. Defaults: `claude-sonnet-5-5`, 40 turns, 10 minutes.
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

- In the `explicit` arm, a missing component import passes typecheck and build: Nuxt does not use `strictTemplates`, and the component renders as nothing. Only the task checks catch it, by asserting on the rendered HTML. It shows up as a failed assertion, not in the taxonomy.
- Sonnet passed all 12 runs of a smoke run (one trial per task and arm) in 3-5 turns. To see a gap, try a weaker model or more trials.
- To regenerate an `explicit` arm: copy `auto`, run `node dist/cli.mjs migrate --root <copy>`, then apply the `nuxt.config.ts` of the existing `explicit` arm. Check the diff by hand.
