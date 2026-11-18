# Auto-imports on/off eval

- config: pi/gpt-5.3-codex
- harness: pi
- model: vercel-ai-gateway/openai/gpt-5.3-codex
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T22:55:56.245Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 43/45 (96%) | 42.9 | 3102719 | 2.799 |
| explicit | 42/45 (93%) | 32.2 | 3421112 | 2.817 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 11 | 11 | 0% | 12.1 | 12.3 | +1% |
| Tool calls | 19 | 18 | -5% | 21.2 | 21.9 | +4% |
| - that explore (read, search) | 13 | 12 | -8% | 15.7 | 15 | -5% |
| - that edit | 1 | 4 | +300% | 3.3 | 4.6 | +41% |
| - that verify (typecheck, build) | 2 | 2 | 0% | 2.1 | 2.3 | +6% |
| - other | 0 | 0 | 0% | 0.1 | 0 | -50% |
| Input tokens (incl. cache) | 49073 | 52894 | +8% | 67096 | 73760 | +10% |
| - uncached | 14262 | 10570 | -26% | 15564 | 11418 | -27% |
| - cache read | 35840 | 42496 | +19% | 51533 | 62342 | +21% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 1455 | 1538 | +6% | 1853 | 2265 | +22% |
| Total tokens | 51004 | 54159 | +6% | 68949 | 76025 | +10% |
| Tool output read (k chars) | 18.5 | 19.9 | +7% | 20.4 | 21.6 | +6% |
| Agent time (s) | 47.7 | 32.2 | -32% | 57.2 | 43 | -25% |
| API time (s) | 40.2 | 27.3 | -32% | 47.1 | 37.5 | -20% |
| Cost ($) | 0.0517 | 0.0444 | -14% | 0.0622 | 0.0626 | +1% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 11 | 11 | 0% | 11.8 | 12.4 | +5% |
| Tool calls | 19 | 18 | -5% | 20.6 | 22.4 | +9% |
| - that explore (read, search) | 13 | 12 | -8% | 15.2 | 15.4 | +1% |
| - that edit | 1 | 4 | +300% | 3.2 | 4.8 | +49% |
| - that verify (typecheck, build) | 2 | 2 | 0% | 2.1 | 2.3 | +6% |
| - other | 0 | 0 | 0% | 0.1 | 0 | -100% |
| Input tokens (incl. cache) | 48037 | 52906 | +10% | 65203 | 75531 | +16% |
| - uncached | 14176 | 10618 | -25% | 15307 | 11546 | -25% |
| - cache read | 34560 | 43136 | +25% | 49896 | 63985 | +28% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 1341 | 1560 | +16% | 1708 | 2299 | +35% |
| Total tokens | 50033 | 54430 | +9% | 66911 | 77830 | +16% |
| Tool output read (k chars) | 18.5 | 19.9 | +8% | 20.4 | 21.8 | +7% |
| Agent time (s) | 46.5 | 32.3 | -31% | 54.6 | 43.4 | -20% |
| API time (s) | 38.6 | 27.3 | -29% | 44.3 | 37.9 | -14% |
| Cost ($) | 0.0514 | 0.0459 | -11% | 0.0594 | 0.0636 | +7% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 (100%) | 10 | 18 | 50 | 48 | 5/5 (100%) | 10 | 17 | 43 | 39 | -14% | -19% |
| feature-product-discount | 5/5 (100%) | 8 | 14 | 35 | 37 | 5/5 (100%) | 7 | 11 | 34 | 27 | -2% | -29% |
| refactor-rename-cart | 5/5 (100%) | 12 | 28 | 53 | 54 | 5/5 (100%) | 12 | 23 | 61 | 36 | +16% | -33% |
| refactor-move-cart-components | 5/5 (100%) | 13 | 19 | 54 | 54 | 5/5 (100%) | 13 | 18 | 54 | 32 | -1% | -41% |
| feature-order-flow | 3/5 (60%) | 17 | 35 | 138 | 127 | 4/5 (80%) | 17 | 31 | 113 | 80 | -18% | -37% |
| feature-pill-badge | 5/5 (100%) | 8 | 7 | 20 | 26 | 3/5 (60%) | 10 | 13 | 34 | 31 | +72% | +20% |
| refactor-extract-cart-layer | 5/5 (100%) | 19 | 34 | 141 | 89 | 5/5 (100%) | 20 | 43 | 167 | 89 | +18% | -1% |
| bugfix-multihop | 5/5 (100%) | 14 | 20 | 67 | 44 | 5/5 (100%) | 8 | 15 | 35 | 25 | -48% | -44% |
| bugfix-lost-override | 5/5 (100%) | 8 | 10 | 22 | 34 | 5/5 (100%) | 8 | 11 | 30 | 24 | +40% | -31% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| bash | 6.58 | 6.51 | -1% |
| edit | 1.93 | 3.20 | +66% |
| read | 11.69 | 11.13 | -5% |
| write | 0.96 | 1.09 | +14% |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 70 | 0 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 0 | 0 | 10 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |

## Failures

- `feature-order-flow` auto #1: page shows 2 order lines (got: 0 found)
- `feature-order-flow` auto #5: page shows 2 order lines (got: 0 found)
- `feature-order-flow` explicit #2: #order-total is $37.33 (got: 37.33 USD)
- `feature-pill-badge` explicit #3: /: every badge is a pill (got: 0/1 pills); /products/notebook: every badge is a pill (got: 0/2 pills); /checkout: every badge is a pill (got: 0/2 pills)
- `feature-pill-badge` explicit #4: /: every badge is a pill (got: 0/1 pills); /products/notebook: every badge is a pill (got: 0/2 pills); /checkout: every badge is a pill (got: 0/2 pills)
