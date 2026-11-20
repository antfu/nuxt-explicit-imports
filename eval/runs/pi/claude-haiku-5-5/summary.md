# Auto-imports on/off eval

- config: pi/claude-haiku-5-5
- harness: pi
- model: vercel-ai-gateway/anthropic/claude-haiku-5-5
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-19T00:49:15.181Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 44/45 (98%) | 27.3 | 4096216 | 1.763 |
| explicit | 43/45 (96%) | 27.1 | 4307061 | 1.858 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 7 | 6 | -14% | 8.1 | 7.3 | -10% |
| Tool calls | 7 | 7 | 0% | 8.6 | 8.5 | -2% |
| - that explore (read, search) | 5 | 4 | -20% | 6.1 | 4.7 | -23% |
| - that edit | 2 | 3 | +50% | 2.9 | 3.8 | +31% |
| - that verify (typecheck, build) | 2 | 2 | 0% | 2 | 1.8 | -13% |
| - other | 0 | 0 | 0% | 0 | 0 | 0% |
| Input tokens (incl. cache) | 53769 | 55362 | +3% | 86506 | 90827 | +5% |
| - uncached | 16 | 14 | -13% | 18 | 17 | -9% |
| - cache read | 43021 | 45891 | +7% | 74095 | 76012 | +3% |
| - cache write | 9986 | 11718 | +17% | 12393 | 14798 | +19% |
| Output tokens | 3034 | 2837 | -6% | 4521 | 4886 | +8% |
| Total tokens | 57330 | 57405 | +0% | 91027 | 95712 | +5% |
| Tool output read (k chars) | 12 | 15 | +25% | 14.1 | 17.9 | +27% |
| Agent time (s) | 26.2 | 24.8 | -5% | 36.5 | 36.1 | -1% |
| API time (s) | 18.4 | 17 | -8% | 25.5 | 26.7 | +5% |
| Cost ($) | 0.0231 | 0.0246 | +6% | 0.0392 | 0.0413 | +5% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 6.5 | 6 | -8% | 8.1 | 7.3 | -10% |
| Tool calls | 7 | 7 | 0% | 8.6 | 8.5 | -1% |
| - that explore (read, search) | 5 | 4 | -20% | 6.1 | 4.8 | -22% |
| - that edit | 2 | 3 | +50% | 2.9 | 3.8 | +32% |
| - that verify (typecheck, build) | 2 | 2 | 0% | 2 | 1.8 | -12% |
| - other | 0 | 0 | 0% | 0 | 0 | +2% |
| Input tokens (incl. cache) | 53717 | 54006 | +1% | 86172 | 90290 | +5% |
| - uncached | 15 | 14 | -7% | 18 | 17 | -9% |
| - cache read | 42688 | 42346 | -1% | 73743 | 75481 | +2% |
| - cache write | 9980 | 11672 | +17% | 12411 | 14793 | +19% |
| Output tokens | 3004 | 2807 | -7% | 4536 | 4898 | +8% |
| Total tokens | 56851 | 56726 | -0% | 90708 | 95188 | +5% |
| Tool output read (k chars) | 11.9 | 14.9 | +25% | 14.1 | 17.8 | +27% |
| Agent time (s) | 26.1 | 24.5 | -6% | 36.6 | 36.1 | -1% |
| API time (s) | 17.7 | 16.9 | -4% | 25.5 | 26.7 | +5% |
| Cost ($) | 0.0226 | 0.0243 | +7% | 0.0392 | 0.0412 | +5% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 4/5 (80%) | 11 | 10 | 105 | 45 | 3/5 (60%) | 8 | 7 | 82 | 35 | -22% | -22% |
| feature-product-discount | 5/5 (100%) | 6 | 7 | 39 | 24 | 5/5 (100%) | 5 | 4 | 38 | 19 | -3% | -19% |
| refactor-rename-cart | 5/5 (100%) | 7 | 6 | 58 | 25 | 5/5 (100%) | 6 | 5 | 51 | 21 | -12% | -15% |
| refactor-move-cart-components | 5/5 (100%) | 6 | 8 | 45 | 25 | 5/5 (100%) | 6 | 8 | 57 | 28 | +25% | +10% |
| feature-order-flow | 5/5 (100%) | 7 | 7 | 79 | 45 | 5/5 (100%) | 8 | 7 | 104 | 47 | +31% | +3% |
| feature-pill-badge | 5/5 (100%) | 6 | 6 | 32 | 20 | 5/5 (100%) | 6 | 8 | 45 | 20 | +44% | +4% |
| refactor-extract-cart-layer | 5/5 (100%) | 15 | 14 | 255 | 84 | 5/5 (100%) | 13 | 20 | 299 | 94 | +17% | +12% |
| bugfix-multihop | 5/5 (100%) | 6 | 7 | 56 | 26 | 5/5 (100%) | 6 | 6 | 57 | 24 | +0% | -7% |
| bugfix-lost-override | 5/5 (100%) | 6 | 6 | 31 | 20 | 5/5 (100%) | 5 | 4 | 34 | 18 | +9% | -9% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| bash | 6.82 | 5.87 | -14% |
| edit | 1.11 | 2.09 | +88% |
| read | 0.20 | 0 | -100% |
| write | 0.51 | 0.53 | +4% |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 3 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 0 | 0 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 2 | 0 | 0 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |

## Failures

- `feature-deals-page` auto #5: 3 "Deal" badges (got: 0 found)
- `feature-deals-page` explicit #2: 3 "Deal" badges (got: 0 found)
- `feature-deals-page` explicit #4: 3 "Deal" badges (got: 0 found)
