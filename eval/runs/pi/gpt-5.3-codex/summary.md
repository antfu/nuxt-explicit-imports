# Auto-imports on/off eval

- config: pi/gpt-5.3-codex
- harness: pi
- model: vercel-ai-gateway/openai/gpt-5.3-codex
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T10:56:05.843Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 43/45 (96%) | 42.9 | 3102719 | 2.799 |
| explicit | 37/45 (82%) | 50.9 | 3467401 | 3.216 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 11 | 11 | 0% | 12.1 | 13 | +7% |
| Tool calls | 19 | 21 | +11% | 21.2 | 23.2 | +10% |
| - that explore (read, search) | 13 | 14 | +8% | 15.7 | 16.5 | +5% |
| - that edit | 1 | 2 | +100% | 3.3 | 4.3 | +31% |
| - that verify (typecheck, build) | 2 | 2 | 0% | 2.1 | 2.4 | +11% |
| - other | 0 | 0 | 0% | 0.1 | 0.1 | 0% |
| Input tokens (incl. cache) | 49073 | 51507 | +5% | 67096 | 74757 | +11% |
| - uncached | 14262 | 14420 | +1% | 15564 | 16653 | +7% |
| - cache read | 35840 | 36992 | +3% | 51533 | 58103 | +13% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 1455 | 1664 | +14% | 1853 | 2297 | +24% |
| Total tokens | 51004 | 53188 | +4% | 68949 | 77053 | +12% |
| Tool output read (k chars) | 18.5 | 21 | +13% | 20.4 | 22.5 | +10% |
| Agent time (s) | 47.7 | 51.3 | +8% | 57.2 | 67.9 | +19% |
| API time (s) | 40.2 | 40.2 | -0% | 47.1 | 54.6 | +16% |
| Cost ($) | 0.0517 | 0.0566 | +9% | 0.0622 | 0.0715 | +15% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 11 | 12 | +9% | 11.8 | 13.5 | +14% |
| Tool calls | 19 | 21 | +11% | 20.6 | 24.8 | +21% |
| - that explore (read, search) | 13 | 14 | +8% | 15.2 | 17.8 | +17% |
| - that edit | 1 | 3 | +200% | 3.2 | 4.6 | +43% |
| - that verify (typecheck, build) | 2 | 2 | 0% | 2.1 | 2.4 | +12% |
| - other | 0 | 0 | 0% | 0.1 | 0.1 | -42% |
| Input tokens (incl. cache) | 48037 | 51877 | +8% | 65203 | 80902 | +24% |
| - uncached | 14176 | 14878 | +5% | 15307 | 17739 | +16% |
| - cache read | 34560 | 40192 | +16% | 49896 | 63163 | +27% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 1341 | 1681 | +25% | 1708 | 2336 | +37% |
| Total tokens | 50033 | 53207 | +6% | 66911 | 83237 | +24% |
| Tool output read (k chars) | 18.5 | 21.9 | +19% | 20.4 | 23.8 | +16% |
| Agent time (s) | 46.5 | 52.7 | +13% | 54.6 | 69.6 | +28% |
| API time (s) | 38.6 | 42.3 | +10% | 44.3 | 56.1 | +27% |
| Cost ($) | 0.0514 | 0.0571 | +11% | 0.0594 | 0.0748 | +26% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 (100%) | 10 | 18 | 50 | 48 | 5/5 (100%) | 10 | 20 | 48 | 56 | -3% | +16% |
| feature-product-discount | 5/5 (100%) | 8 | 14 | 35 | 37 | 5/5 (100%) | 8 | 13 | 36 | 40 | +3% | +7% |
| refactor-rename-cart | 5/5 (100%) | 12 | 28 | 53 | 54 | 5/5 (100%) | 13 | 23 | 66 | 61 | +25% | +12% |
| refactor-move-cart-components | 5/5 (100%) | 13 | 19 | 54 | 54 | 5/5 (100%) | 12 | 18 | 53 | 46 | -2% | -16% |
| feature-order-flow | 3/5 (60%) | 17 | 35 | 138 | 127 | 2/5 (40%) | 14 | 30 | 117 | 115 | -15% | -9% |
| feature-pill-badge | 5/5 (100%) | 8 | 7 | 20 | 26 | 0/5 (0%) | 8 | 7 | 21 | 31 | +4% | +20% |
| refactor-extract-cart-layer | 5/5 (100%) | 19 | 34 | 141 | 89 | 5/5 (100%) | 25 | 46 | 217 | 142 | +54% | +58% |
| bugfix-multihop | 5/5 (100%) | 14 | 20 | 67 | 44 | 5/5 (100%) | 14 | 33 | 83 | 64 | +23% | +44% |
| bugfix-lost-override | 5/5 (100%) | 8 | 10 | 22 | 34 | 5/5 (100%) | 8 | 10 | 23 | 41 | +8% | +20% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| bash | 6.58 | 6.82 | +4% |
| edit | 1.93 | 3.02 | +56% |
| read | 11.69 | 12.47 | +7% |
| write | 0.96 | 0.91 | -5% |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 70 | 0 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 0 | 0 | 12 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |

## Failures

- `feature-order-flow` auto #1: page shows 2 order lines (got: 0 found)
- `feature-order-flow` auto #5: page shows 2 order lines (got: 0 found)
- `feature-order-flow` explicit #2: #order-total is $37.33 (got: 37.33 USD)
- `feature-order-flow` explicit #3: #order-total is $37.33 (got: 37.33 USD)
- `feature-order-flow` explicit #5: page shows 2 order lines (got: 0 found)
- `feature-pill-badge` explicit #1: /: every badge is a pill (got: 0/1 pills); /products/notebook: every badge is a pill (got: 0/2 pills); /checkout: every badge is a pill (got: 0/2 pills)
- `feature-pill-badge` explicit #2: /: every badge is a pill (got: 0/1 pills); /products/notebook: every badge is a pill (got: 0/2 pills); /checkout: every badge is a pill (got: 0/2 pills)
- `feature-pill-badge` explicit #3: /: every badge is a pill (got: 0/1 pills); /products/notebook: every badge is a pill (got: 0/2 pills); /checkout: every badge is a pill (got: 0/2 pills)
- `feature-pill-badge` explicit #4: /: every badge is a pill (got: 0/1 pills); /products/notebook: every badge is a pill (got: 0/2 pills); /checkout: every badge is a pill (got: 0/2 pills)
- `feature-pill-badge` explicit #5: /: every badge is a pill (got: 0/1 pills); /products/notebook: every badge is a pill (got: 0/2 pills); /checkout: every badge is a pill (got: 0/2 pills)
