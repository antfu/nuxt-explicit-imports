# Auto-imports on/off eval

- config: claude-code/claude-haiku-5-5
- harness: claude-code
- model: claude-haiku-5-5
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T10:29:05.308Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 45/45 (100%) | 62.5 | 13528720 | 0.402 |
| explicit | 44/45 (98%) | 65 | 16419402 | 0.463 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 13 | 12 | -8% | 13.1 | 14.8 | +13% |
| Tool calls | 12 | 11 | -8% | 12.1 | 13.8 | +14% |
| - that explore (read, search) | 8 | 7 | -13% | 8.5 | 8.5 | -1% |
| - that edit | 3 | 4 | +33% | 3.6 | 5.2 | +46% |
| - that verify (typecheck, build) | 3 | 2 | -33% | 2.8 | 2.7 | -4% |
| - other | 0 | 0 | 0% | 0 | 0.1 | +150% |
| Input tokens (incl. cache) | 216691 | 224986 | +4% | 293288 | 356555 | +22% |
| - uncached | 1277 | 1277 | 0% | 1308 | 1310 | +0% |
| - cache read | 202988 | 209246 | +3% | 272816 | 333899 | +22% |
| - cache write | 15680 | 16346 | +4% | 19164 | 21347 | +11% |
| Output tokens | 5544 | 5511 | -1% | 7350 | 8321 | +13% |
| Total tokens | 220746 | 233015 | +6% | 300638 | 364876 | +21% |
| Tool output read (k chars) | 14.5 | 15.9 | +10% | 16.8 | 19.6 | +17% |
| Agent time (s) | 74.4 | 73.3 | -2% | 83.4 | 86.7 | +4% |
| API time (s) | 31.1 | 32 | +3% | 41.9 | 47.6 | +14% |
| Cost ($) | 0.0068 | 0.0073 | +7% | 0.0089 | 0.0103 | +15% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 13 | 12 | -8% | 13.1 | 14.8 | +13% |
| Tool calls | 12 | 11 | -8% | 12.1 | 13.8 | +14% |
| - that explore (read, search) | 8 | 6.5 | -19% | 8.5 | 8.5 | -0% |
| - that edit | 3 | 4 | +33% | 3.6 | 5.3 | +48% |
| - that verify (typecheck, build) | 3 | 2 | -33% | 2.8 | 2.7 | -4% |
| - other | 0 | 0 | 0% | 0 | 0.1 | +156% |
| Input tokens (incl. cache) | 216691 | 224190 | +3% | 293288 | 355842 | +21% |
| - uncached | 1277 | 1276 | -0% | 1308 | 1309 | +0% |
| - cache read | 202988 | 207164 | +2% | 272816 | 333184 | +22% |
| - cache write | 15680 | 16304 | +4% | 19164 | 21349 | +11% |
| Output tokens | 5544 | 5503 | -1% | 7350 | 8324 | +13% |
| Total tokens | 220746 | 230349 | +4% | 300638 | 364166 | +21% |
| Tool output read (k chars) | 14.5 | 15.7 | +9% | 16.8 | 19.6 | +17% |
| Agent time (s) | 74.4 | 71.2 | -4% | 83.4 | 86.8 | +4% |
| API time (s) | 31.1 | 31.5 | +1% | 41.9 | 47.5 | +13% |
| Cost ($) | 0.0068 | 0.0072 | +6% | 0.0089 | 0.0103 | +15% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 (100%) | 9 | 8 | 272 | 87 | 4/5 (80%) | 12 | 11 | 331 | 69 | +22% | -21% |
| feature-product-discount | 5/5 (100%) | 13 | 12 | 219 | 56 | 5/5 (100%) | 12 | 11 | 218 | 58 | -1% | +3% |
| refactor-rename-cart | 5/5 (100%) | 11 | 10 | 207 | 55 | 5/5 (100%) | 9 | 8 | 180 | 64 | -13% | +17% |
| refactor-move-cart-components | 5/5 (100%) | 17 | 16 | 422 | 119 | 5/5 (100%) | 18 | 17 | 325 | 112 | -23% | -6% |
| feature-order-flow | 5/5 (100%) | 14 | 13 | 333 | 98 | 5/5 (100%) | 14 | 13 | 361 | 101 | +8% | +4% |
| feature-pill-badge | 5/5 (100%) | 8 | 7 | 170 | 52 | 5/5 (100%) | 11 | 10 | 176 | 67 | +4% | +29% |
| refactor-extract-cart-layer | 5/5 (100%) | 17 | 16 | 660 | 145 | 5/5 (100%) | 33 | 32 | 1310 | 192 | +99% | +33% |
| bugfix-multihop | 5/5 (100%) | 19 | 18 | 206 | 53 | 5/5 (100%) | 11 | 10 | 207 | 43 | +0% | -18% |
| bugfix-lost-override | 5/5 (100%) | 9 | 8 | 198 | 75 | 5/5 (100%) | 9 | 8 | 189 | 68 | -4% | -9% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| Bash | 8.84 | 9.40 | +6% |
| Edit | 1.07 | 2.60 | +144% |
| Read | 1.36 | 0.93 | -31% |
| Write | 0.80 | 0.82 | +3% |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 0 | 0 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 0 | 0 | 0 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |

## Failures

- `feature-deals-page` explicit #3: 3 "Deal" badges (got: 0 found)
