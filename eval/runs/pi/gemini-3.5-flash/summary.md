# Auto-imports on/off eval

- config: pi/gemini-3.5-flash
- harness: pi
- model: vercel-ai-gateway/google/gemini-3.5-flash
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T23:26:20.624Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 40/45 (89%) | 65.9 | 12452503 | 11.624 |
| explicit | 39/45 (87%) | 56.3 | 12020117 | 11.719 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 28 | 25 | -11% | 29 | 27.7 | -5% |
| Tool calls | 27 | 24 | -11% | 28.1 | 26.8 | -5% |
| - that explore (read, search) | 19 | 16 | -16% | 21.1 | 19.4 | -8% |
| - that edit | 1 | 4 | +300% | 3 | 3.8 | +25% |
| - that verify (typecheck, build) | 4 | 4 | 0% | 3.6 | 3.4 | -5% |
| - other | 0 | 0 | 0% | 0.4 | 0.2 | -58% |
| Input tokens (incl. cache) | 201392 | 220236 | +9% | 270686 | 260226 | -4% |
| - uncached | 127626 | 106472 | -17% | 121032 | 118066 | -2% |
| - cache read | 77315 | 116368 | +51% | 149655 | 142160 | -5% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 4440 | 5552 | +25% | 6036 | 6888 | +14% |
| Total tokens | 208048 | 224809 | +8% | 276722 | 267114 | -3% |
| Tool output read (k chars) | 25.5 | 28.2 | +10% | 31.7 | 32.6 | +3% |
| Agent time (s) | 80 | 67.5 | -16% | 87.9 | 75.1 | -15% |
| API time (s) | 61.9 | 57.8 | -7% | 70.9 | 66.2 | -7% |
| Cost ($) | 0.2365 | 0.2269 | -4% | 0.2583 | 0.2604 | +1% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 25.5 | 24 | -6% | 27.6 | 25.6 | -7% |
| Tool calls | 24.5 | 23 | -6% | 26.6 | 24.8 | -7% |
| - that explore (read, search) | 16.5 | 16 | -3% | 19.4 | 17.5 | -10% |
| - that edit | 1 | 2 | +100% | 3.1 | 3.5 | +15% |
| - that verify (typecheck, build) | 4 | 4 | 0% | 3.7 | 3.7 | +0% |
| - other | 0 | 0 | 0% | 0.5 | 0.1 | -84% |
| Input tokens (incl. cache) | 157354 | 197021 | +25% | 231979 | 224972 | -3% |
| - uncached | 114737 | 104151 | -9% | 114293 | 111605 | -2% |
| - cache read | 65432 | 92876 | +42% | 117685 | 113367 | -4% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 3739 | 4974 | +33% | 5653 | 6221 | +10% |
| Total tokens | 160635 | 202815 | +26% | 237632 | 231193 | -3% |
| Tool output read (k chars) | 25.3 | 28.9 | +14% | 30.1 | 33.1 | +10% |
| Agent time (s) | 71.1 | 66.4 | -7% | 84.5 | 69.8 | -17% |
| API time (s) | 57.6 | 56.8 | -1% | 66.9 | 60.2 | -10% |
| Cost ($) | 0.2130 | 0.2170 | +2% | 0.2400 | 0.2404 | +0% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 3/5 (60%) | 40 | 39 | 337 | 127 | 5/5 (100%) | 36 | 35 | 290 | 87 | -14% | -31% |
| feature-product-discount | 5/5 (100%) | 26 | 25 | 208 | 94 | 5/5 (100%) | 22 | 21 | 197 | 79 | -5% | -16% |
| refactor-rename-cart | 5/5 (100%) | 25 | 24 | 144 | 68 | 5/5 (100%) | 24 | 23 | 159 | 56 | +10% | -18% |
| refactor-move-cart-components | 5/5 (100%) | 35 | 34 | 298 | 88 | 5/5 (100%) | 21 | 20 | 110 | 49 | -63% | -44% |
| feature-order-flow | 4/5 (80%) | 41 | 40 | 388 | 132 | 4/5 (80%) | 37 | 37 | 383 | 130 | -1% | -2% |
| feature-pill-badge | 5/5 (100%) | 19 | 18 | 123 | 57 | 5/5 (100%) | 24 | 23 | 225 | 63 | +84% | +9% |
| refactor-extract-cart-layer | 3/5 (60%) | 41 | 40 | 579 | 115 | 0/5 (0%) | 41 | 40 | 517 | 102 | -11% | -11% |
| bugfix-multihop | 5/5 (100%) | 19 | 18 | 104 | 60 | 5/5 (100%) | 17 | 16 | 99 | 44 | -5% | -27% |
| bugfix-lost-override | 5/5 (100%) | 17 | 17 | 101 | 59 | 5/5 (100%) | 25 | 24 | 225 | 67 | +123% | +13% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| bash | 12.91 | 10.67 | -17% |
| edit | 1.49 | 2.02 | +36% |
| read | 12.64 | 12.67 | +0% |
| write | 1.09 | 1.47 | +35% |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 0 | 7 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 0 | 2 | 1 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |

## Failures

- `feature-deals-page` auto #1: check ran to the end (got: Error: GET /deals returned 404); agent stopped: error_max_turns
- `feature-deals-page` auto #3: check ran to the end (got: Error: GET /deals returned 404); agent stopped: error_max_turns
- `feature-order-flow` auto #1: check ran to the end (got: Error: GET /orders/1 returned 404); agent stopped: error_max_turns
- `feature-order-flow` explicit #1: #order-total is $37.33 (got: 37.33 USD); agent stopped: error_max_turns
- `refactor-extract-cart-layer` auto #3: every cart file is in layers/cart/app/ (got: components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
- `refactor-extract-cart-layer` auto #5: typecheck failed; agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #1: typecheck failed; build failed; agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #2: typecheck failed; every cart file is in layers/cart/app/ (got: components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #3: every cart file is in layers/cart/app/ (got: composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #4: every cart file is in layers/cart/app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #5: typecheck failed; every cart file is in layers/cart/app/ (got: components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
