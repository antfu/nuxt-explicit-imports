# Auto-imports on/off eval

- config: claude-code/claude-sonnet-5-5
- harness: claude-code
- model: claude-sonnet-5-5
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T22:15:44.075Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 45/45 (100%) | 31.5 | 4187034 | 1.667 |
| explicit | 43/45 (96%) | 15.9 | 4615226 | 1.865 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 4 | 5 | +25% | 4.7 | 5 | +7% |
| Tool calls | 3 | 4 | +33% | 3.7 | 4 | +9% |
| - that explore (read, search) | 3 | 3 | 0% | 2.8 | 3.1 | +12% |
| - that edit | 1 | 1 | 0% | 1.2 | 1.3 | +12% |
| - that verify (typecheck, build) | 1 | 1 | 0% | 1.4 | 1.4 | +7% |
| - other | 0 | 0 | 0% | 0 | 0 | 0% |
| Input tokens (incl. cache) | 83356 | 102795 | +23% | 91923 | 101356 | +10% |
| - uncached | 1266 | 1266 | 0% | 1297 | 1297 | +0% |
| - cache read | 75152 | 95721 | +27% | 84729 | 93059 | +10% |
| - cache write | 6018 | 6658 | +11% | 5897 | 6999 | +19% |
| Output tokens | 1000 | 1023 | +2% | 1123 | 1205 | +7% |
| Total tokens | 85372 | 103818 | +22% | 93045 | 102561 | +10% |
| Tool output read (k chars) | 4.7 | 5.3 | +14% | 4.1 | 5.9 | +44% |
| Agent time (s) | 36.3 | 21.3 | -41% | 42 | 21.2 | -50% |
| API time (s) | 15.7 | 13.8 | -12% | 16.1 | 14.8 | -8% |
| Cost ($) | 0.0364 | 0.0391 | +8% | 0.0370 | 0.0414 | +12% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 4 | 5 | +25% | 4.7 | 5 | +7% |
| Tool calls | 3 | 4 | +33% | 3.7 | 4 | +9% |
| - that explore (read, search) | 3 | 3 | 0% | 2.8 | 3.1 | +12% |
| - that edit | 1 | 1 | 0% | 1.2 | 1.3 | +9% |
| - that verify (typecheck, build) | 1 | 1 | 0% | 1.4 | 1.4 | +5% |
| - other | 0 | 0 | 0% | 0 | 0 | 0% |
| Input tokens (incl. cache) | 83356 | 102795 | +23% | 91923 | 100669 | +10% |
| - uncached | 1266 | 1266 | 0% | 1297 | 1293 | -0% |
| - cache read | 75152 | 95721 | +27% | 84729 | 92549 | +9% |
| - cache write | 6018 | 6585 | +9% | 5897 | 6826 | +16% |
| Output tokens | 1000 | 1013 | +1% | 1123 | 1161 | +3% |
| Total tokens | 85372 | 103818 | +22% | 93045 | 101829 | +9% |
| Tool output read (k chars) | 4.7 | 5.2 | +13% | 4.1 | 5.6 | +37% |
| Agent time (s) | 36.3 | 21.2 | -41% | 42 | 20.9 | -50% |
| API time (s) | 15.7 | 13.8 | -12% | 16.1 | 14.5 | -10% |
| Cost ($) | 0.0364 | 0.0389 | +7% | 0.0370 | 0.0405 | +9% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 (100%) | 5 | 4 | 83 | 32 | 5/5 (100%) | 5 | 4 | 107 | 21 | +28% | -34% |
| feature-product-discount | 5/5 (100%) | 4 | 3 | 83 | 25 | 5/5 (100%) | 4 | 3 | 85 | 16 | +3% | -36% |
| refactor-rename-cart | 5/5 (100%) | 4 | 3 | 82 | 46 | 5/5 (100%) | 4 | 3 | 85 | 23 | +3% | -51% |
| refactor-move-cart-components | 5/5 (100%) | 4 | 3 | 80 | 34 | 5/5 (100%) | 4 | 3 | 83 | 14 | +4% | -58% |
| feature-order-flow | 5/5 (100%) | 4 | 3 | 85 | 34 | 4/5 (80%) | 5 | 4 | 111 | 26 | +31% | -25% |
| feature-pill-badge | 5/5 (100%) | 4 | 3 | 80 | 22 | 5/5 (100%) | 5 | 4 | 103 | 17 | +29% | -20% |
| refactor-extract-cart-layer | 5/5 (100%) | 5 | 4 | 108 | 48 | 4/5 (80%) | 5 | 4 | 112 | 24 | +4% | -50% |
| bugfix-multihop | 5/5 (100%) | 6 | 5 | 104 | 51 | 5/5 (100%) | 6 | 5 | 106 | 21 | +2% | -59% |
| bugfix-lost-override | 5/5 (100%) | 6 | 5 | 102 | 68 | 5/5 (100%) | 7 | 6 | 126 | 27 | +23% | -60% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| Bash | 3.53 | 3.80 | +8% |
| Edit | 0.18 | 0.24 | +37% |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 29 | 0 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 0 | 0 | 6 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |

## Failures

- `feature-order-flow` explicit #3: #order-total is $37.33 (got: 37.33 USD)
- `refactor-extract-cart-layer` explicit #2: every cart file is in layers/cart/app/ (got: components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue)
