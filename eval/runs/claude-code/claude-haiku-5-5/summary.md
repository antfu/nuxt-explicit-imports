# Auto-imports on/off eval

- config: claude-code/claude-haiku-5-5
- harness: claude-code
- model: claude-haiku-5-5
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T22:37:51.621Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 45/45 (100%) | 62.5 | 13528720 | 0.402 |
| explicit | 45/45 (100%) | 40.9 | 16695559 | 0.475 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 13 | 12 | -8% | 13.1 | 14.7 | +12% |
| Tool calls | 12 | 11 | -8% | 12.1 | 13.7 | +13% |
| - that explore (read, search) | 8 | 6 | -25% | 8.5 | 8.4 | -2% |
| - that edit | 3 | 3 | 0% | 3.6 | 4.7 | +31% |
| - that verify (typecheck, build) | 3 | 2 | -33% | 2.8 | 2.4 | -12% |
| - other | 0 | 0 | 0% | 0 | 0.2 | +250% |
| Input tokens (incl. cache) | 216691 | 218250 | +1% | 293288 | 363042 | +24% |
| - uncached | 1277 | 1274 | -0% | 1308 | 1309 | +0% |
| - cache read | 202988 | 200233 | -1% | 272816 | 339894 | +25% |
| - cache write | 15680 | 16743 | +7% | 19164 | 21839 | +14% |
| Output tokens | 5544 | 5133 | -7% | 7350 | 7970 | +8% |
| Total tokens | 220746 | 222683 | +1% | 300638 | 371012 | +23% |
| Tool output read (k chars) | 14.5 | 16.1 | +11% | 16.8 | 20.1 | +20% |
| Agent time (s) | 74.4 | 35.8 | -52% | 83.4 | 54.6 | -35% |
| API time (s) | 31.1 | 26.5 | -15% | 41.9 | 43.9 | +5% |
| Cost ($) | 0.0068 | 0.0065 | -4% | 0.0089 | 0.0106 | +18% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 (100%) | 9 | 8 | 272 | 87 | 5/5 (100%) | 11 | 10 | 292 | 51 | +7% | -41% |
| feature-product-discount | 5/5 (100%) | 13 | 12 | 219 | 56 | 5/5 (100%) | 13 | 12 | 223 | 35 | +2% | -37% |
| refactor-rename-cart | 5/5 (100%) | 11 | 10 | 207 | 55 | 5/5 (100%) | 8 | 7 | 174 | 31 | -16% | -43% |
| refactor-move-cart-components | 5/5 (100%) | 17 | 16 | 422 | 119 | 5/5 (100%) | 12 | 11 | 238 | 34 | -44% | -71% |
| feature-order-flow | 5/5 (100%) | 14 | 13 | 333 | 98 | 5/5 (100%) | 14 | 13 | 313 | 64 | -6% | -34% |
| feature-pill-badge | 5/5 (100%) | 8 | 7 | 170 | 52 | 5/5 (100%) | 11 | 10 | 182 | 32 | +7% | -39% |
| refactor-extract-cart-layer | 5/5 (100%) | 17 | 16 | 660 | 145 | 5/5 (100%) | 40 | 39 | 1310 | 172 | +99% | +19% |
| bugfix-multihop | 5/5 (100%) | 19 | 18 | 206 | 53 | 5/5 (100%) | 10 | 9 | 173 | 26 | -16% | -51% |
| bugfix-lost-override | 5/5 (100%) | 9 | 8 | 198 | 75 | 5/5 (100%) | 9 | 8 | 192 | 34 | -3% | -54% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| Bash | 8.84 | 9.02 | +2% |
| Edit | 1.07 | 2.60 | +144% |
| Read | 1.36 | 1.22 | -10% |
| Write | 0.80 | 0.84 | +6% |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 0 | 0 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 0 | 0 | 1 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |
