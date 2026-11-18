# Auto-imports on/off eval

- config: claude-code/claude-sonnet-5-5
- harness: claude-code
- model: claude-sonnet-5-5
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T07:17:38.042Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 45/45 (100%) | 31.5 | 4187034 | 1.667 |
| explicit | 43/45 (96%) | 32.2 | 4851105 | 1.945 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 4 | 5 | +25% | 4.7 | 5.3 | +12% |
| Tool calls | 3 | 4 | +33% | 3.7 | 4.3 | +15% |
| - that explore (read, search) | 3 | 3 | 0% | 2.8 | 3.4 | +23% |
| - that edit | 1 | 1 | 0% | 1.2 | 1.4 | +23% |
| - that verify (typecheck, build) | 1 | 1 | 0% | 1.4 | 1.5 | +11% |
| - other | 0 | 0 | 0% | 0 | 0 | n/a |
| Input tokens (incl. cache) | 83356 | 104577 | +25% | 91923 | 106493 | +16% |
| - uncached | 1266 | 1268 | +0% | 1297 | 1298 | +0% |
| - cache read | 75152 | 96588 | +29% | 84729 | 98109 | +16% |
| - cache write | 6018 | 6648 | +10% | 5897 | 7086 | +20% |
| Output tokens | 1000 | 1141 | +14% | 1123 | 1309 | +17% |
| Total tokens | 85372 | 105792 | +24% | 93045 | 107802 | +16% |
| Tool output read (k chars) | 4.7 | 5.8 | +25% | 4.1 | 6.3 | +55% |
| Agent time (s) | 36.3 | 40.8 | +12% | 42 | 43 | +2% |
| API time (s) | 15.7 | 16.9 | +8% | 16.1 | 17.8 | +11% |
| Cost ($) | 0.0364 | 0.0414 | +14% | 0.0370 | 0.0432 | +17% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 4 | 5 | +25% | 4.7 | 5.3 | +13% |
| Tool calls | 3 | 4 | +33% | 3.7 | 4.3 | +17% |
| - that explore (read, search) | 3 | 3 | 0% | 2.8 | 3.4 | +24% |
| - that edit | 1 | 1 | 0% | 1.2 | 1.4 | +25% |
| - that verify (typecheck, build) | 1 | 2 | +100% | 1.4 | 1.5 | +13% |
| - other | 0 | 0 | 0% | 0 | 0 | n/a |
| Input tokens (incl. cache) | 83356 | 104733 | +26% | 91923 | 107492 | +17% |
| - uncached | 1266 | 1268 | +0% | 1297 | 1294 | -0% |
| - cache read | 75152 | 96705 | +29% | 84729 | 99143 | +17% |
| - cache write | 6018 | 6635 | +10% | 5897 | 7055 | +20% |
| Output tokens | 1000 | 1108 | +11% | 1123 | 1271 | +13% |
| Total tokens | 85372 | 105960 | +24% | 93045 | 108763 | +17% |
| Tool output read (k chars) | 4.7 | 5.8 | +25% | 4.1 | 6.3 | +56% |
| Agent time (s) | 36.3 | 40.8 | +12% | 42 | 43.4 | +3% |
| API time (s) | 15.7 | 16.7 | +6% | 16.1 | 17.7 | +10% |
| Cost ($) | 0.0364 | 0.0411 | +13% | 0.0370 | 0.0429 | +16% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 (100%) | 5 | 4 | 83 | 32 | 5/5 (100%) | 5 | 4 | 106 | 32 | +27% | +2% |
| feature-product-discount | 5/5 (100%) | 4 | 3 | 83 | 25 | 5/5 (100%) | 5 | 4 | 106 | 34 | +29% | +34% |
| refactor-rename-cart | 5/5 (100%) | 4 | 3 | 82 | 46 | 5/5 (100%) | 4 | 3 | 86 | 49 | +4% | +6% |
| refactor-move-cart-components | 5/5 (100%) | 4 | 3 | 80 | 34 | 5/5 (100%) | 4 | 3 | 81 | 46 | +1% | +36% |
| feature-order-flow | 5/5 (100%) | 4 | 3 | 85 | 34 | 3/5 (60%) | 4 | 3 | 88 | 34 | +3% | +0% |
| feature-pill-badge | 5/5 (100%) | 4 | 3 | 80 | 22 | 5/5 (100%) | 6 | 5 | 103 | 36 | +28% | +67% |
| refactor-extract-cart-layer | 5/5 (100%) | 5 | 4 | 108 | 48 | 5/5 (100%) | 5 | 4 | 119 | 45 | +10% | -6% |
| bugfix-multihop | 5/5 (100%) | 6 | 5 | 104 | 51 | 5/5 (100%) | 7 | 6 | 127 | 56 | +22% | +9% |
| bugfix-lost-override | 5/5 (100%) | 6 | 5 | 102 | 68 | 5/5 (100%) | 5 | 4 | 102 | 61 | +0% | -10% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| Bash | 3.53 | 4.07 | +15% |
| Edit | 0.18 | 0.16 | -13% |
| Write | 0 | 0.02 | n/a |
| bash | 0 | 0.02 | n/a |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 58 | 0 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 0 | 0 | 12 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |

## Failures

- `feature-order-flow` explicit #3: #order-total is $37.33 (got: 37.33 USD)
- `feature-order-flow` explicit #5: #order-total is $37.33 (got: 37.33 USD)
