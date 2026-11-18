# Eval matrix

Written by `pnpm eval report` from the runs stored in this folder. Each config has a full `summary.md`. Do not edit by hand.

Means per run. "change" is explicit compared to auto: a positive value means explicit used more. "Errors hit" counts the TypeScript and build errors in the agent's tool output while it worked.

| Config | Runs | auto pass | explicit pass | Tokens per run (k) | Cost per run | Agent time per run (s) | Errors hit (auto / explicit) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [`claude-code/claude-sonnet-5-5`](./claude-code/claude-sonnet-5-5/summary.md) | 90 | 45/45 (100%) | 43/45 (96%) | 93 -> 108 (+16%) | $0.037 -> $0.043 (+17%) | 42 -> 43 (+2%) | 0 / 70 |
| [`claude-code/claude-haiku-5-5`](./claude-code/claude-haiku-5-5/summary.md) | 90 | 45/45 (100%) | 44/45 (98%) | 301 -> 365 (+21%) | $0.009 -> $0.010 (+15%) | 83 -> 87 (+4%) | 0 / 0 |
| [`pi/gpt-5.3-codex`](./pi/gpt-5.3-codex/summary.md) | 90 | 43/45 (96%) | 37/45 (82%) | 69 -> 77 (+12%) | $0.062 -> $0.071 (+15%) | 57 -> 68 (+19%) | 0 / 82 |
| [`pi/gemini-3.5-flash`](./pi/gemini-3.5-flash/summary.md) | 90 | 40/45 (89%) | 36/45 (80%) | 277 -> 318 (+15%) | $0.258 -> $0.287 (+11%) | 88 -> 90 (+3%) | 0 / 27 |

## Passes per task

| Task | claude-code/claude-sonnet-5-5 auto | claude-code/claude-sonnet-5-5 explicit | claude-code/claude-haiku-5-5 auto | claude-code/claude-haiku-5-5 explicit | pi/gpt-5.3-codex auto | pi/gpt-5.3-codex explicit | pi/gemini-3.5-flash auto | pi/gemini-3.5-flash explicit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 | 5/5 | 5/5 | 4/5 | 5/5 | 5/5 | 3/5 | 3/5 |
| feature-product-discount | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| refactor-rename-cart | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| refactor-move-cart-components | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| feature-order-flow | 5/5 | 3/5 | 5/5 | 5/5 | 3/5 | 2/5 | 4/5 | 4/5 |
| feature-pill-badge | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 0/5 | 5/5 | 4/5 |
| refactor-extract-cart-layer | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 3/5 | 0/5 |
| bugfix-multihop | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| bugfix-lost-override | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |

