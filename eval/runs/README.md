# Eval matrix

Written by `pnpm eval report` from the runs stored in this folder. Each config has a full `summary.md`. Do not edit by hand.

Means per run. "change" is explicit compared to auto: a positive value means explicit used more. "Errors hit" counts the TypeScript and build errors in the agent's tool output while it worked.

| Config | Runs | auto pass | explicit pass | Tokens per run (k) | Cost per run | Agent time per run (s) | Errors hit (auto / explicit) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [`claude-code/claude-sonnet-5-5`](./claude-code/claude-sonnet-5-5/summary.md) | 90 | 45/45 (100%) | 43/45 (96%) | 93 -> 103 (+10%) | $0.037 -> $0.041 (+12%) | 42 -> 21 (-50%) | 0 / 35 |
| [`claude-code/claude-haiku-5-5`](./claude-code/claude-haiku-5-5/summary.md) | 90 | 45/45 (100%) | 45/45 (100%) | 301 -> 371 (+23%) | $0.009 -> $0.011 (+18%) | 83 -> 55 (-35%) | 0 / 1 |
| [`pi/gpt-5.3-codex`](./pi/gpt-5.3-codex/summary.md) | 90 | 43/45 (96%) | 42/45 (93%) | 69 -> 76 (+10%) | $0.062 -> $0.063 (+1%) | 57 -> 43 (-25%) | 0 / 80 |
| [`pi/gemini-3.5-flash`](./pi/gemini-3.5-flash/summary.md) | 90 | 40/45 (89%) | 39/45 (87%) | 277 -> 267 (-3%) | $0.258 -> $0.260 (+1%) | 88 -> 75 (-15%) | 0 / 1 |

## Passes per task

| Task | claude-code/claude-sonnet-5-5 auto | claude-code/claude-sonnet-5-5 explicit | claude-code/claude-haiku-5-5 auto | claude-code/claude-haiku-5-5 explicit | pi/gpt-5.3-codex auto | pi/gpt-5.3-codex explicit | pi/gemini-3.5-flash auto | pi/gemini-3.5-flash explicit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 3/5 | 5/5 |
| feature-product-discount | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| refactor-rename-cart | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| refactor-move-cart-components | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| feature-order-flow | 5/5 | 4/5 | 5/5 | 5/5 | 3/5 | 4/5 | 4/5 | 4/5 |
| feature-pill-badge | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 3/5 | 5/5 | 5/5 |
| refactor-extract-cart-layer | 5/5 | 4/5 | 5/5 | 5/5 | 5/5 | 5/5 | 3/5 | 0/5 |
| bugfix-multihop | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| bugfix-lost-override | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |

