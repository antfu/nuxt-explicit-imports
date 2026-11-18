# Eval matrix

Written by `pnpm eval report` from the runs stored in this folder. Each config has a full `summary.md`. Do not edit by hand.

Means per run. "change" is explicit compared to auto: a positive value means explicit used more. "Errors hit" counts the TypeScript and build errors in the agent's tool output while it worked.

| Config | Runs | auto pass | explicit pass | Tokens per run (k) | Cost per run | Agent time per run (s) | Errors hit (auto / explicit) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [`claude-code/claude-sonnet-5-5`](./claude-code/claude-sonnet-5-5/summary.md) | 90 | 45/45 (100%) | 43/45 (96%) | 93 -> 108 (+16%) | $0.037 -> $0.043 (+17%) | 42 -> 43 (+2%) | 0 / 70 |
| [`claude-code/claude-haiku-5-5`](./claude-code/claude-haiku-5-5/summary.md) | 4 | 2/3 (67%) | 1/1 (100%) | 233 -> 173 (-26%) | $0.007 -> $0.005 (-24%) | 54 -> 58 (+8%) | 0 / 0 |
| [`pi/gpt-5.3-codex`](./pi/gpt-5.3-codex/summary.md) | 2 | 1/1 (100%) | 0/1 (0%) | 23 -> 23 (+3%) | $0.025 -> $0.024 (-4%) | 36 -> 29 (-20%) | 0 / 0 |
| [`pi/gemini-3.5-flash`](./pi/gemini-3.5-flash/summary.md) | 2 | 1/1 (100%) | 1/1 (100%) | 93 -> 204 (+120%) | $0.124 -> $0.218 (+76%) | 52 -> 85 (+62%) | 0 / 2 |

## Passes per task

| Task | claude-code/claude-sonnet-5-5 auto | claude-code/claude-sonnet-5-5 explicit | claude-code/claude-haiku-5-5 auto | claude-code/claude-haiku-5-5 explicit | pi/gpt-5.3-codex auto | pi/gpt-5.3-codex explicit | pi/gemini-3.5-flash auto | pi/gemini-3.5-flash explicit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 | 5/5 | 1/2 | - | - | - | - | - |
| feature-product-discount | 5/5 | 5/5 | - | - | - | - | - | - |
| refactor-rename-cart | 5/5 | 5/5 | - | - | - | - | - | - |
| refactor-move-cart-components | 5/5 | 5/5 | - | - | - | - | - | - |
| feature-order-flow | 5/5 | 3/5 | - | - | - | - | - | - |
| feature-pill-badge | 5/5 | 5/5 | 1/1 | 1/1 | 1/1 | 0/1 | 1/1 | 1/1 |
| refactor-extract-cart-layer | 5/5 | 5/5 | - | - | - | - | - | - |
| bugfix-multihop | 5/5 | 5/5 | - | - | - | - | - | - |
| bugfix-lost-override | 5/5 | 5/5 | - | - | - | - | - | - |

