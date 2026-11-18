# Auto-imports on/off eval

- config: pi/gemini-3.5-flash
- harness: pi
- model: vercel-ai-gateway/google/gemini-3.5-flash
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T11:33:18.942Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 40/45 (89%) | 65.9 | 12452503 | 11.624 |
| explicit | 36/45 (80%) | 67.7 | 14296686 | 12.913 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 28 | 28 | 0% | 29 | 30.2 | +4% |
| Tool calls | 27 | 27 | 0% | 28.1 | 29.3 | +4% |
| - that explore (read, search) | 19 | 19 | 0% | 21.1 | 22 | +4% |
| - that edit | 1 | 2 | +100% | 3 | 3.4 | +13% |
| - that verify (typecheck, build) | 4 | 4 | 0% | 3.6 | 3.4 | -5% |
| - other | 0 | 0 | 0% | 0.4 | 0.5 | +16% |
| Input tokens (incl. cache) | 201392 | 327872 | +63% | 270686 | 310826 | +15% |
| - uncached | 127626 | 122596 | -4% | 121032 | 132168 | +9% |
| - cache read | 77315 | 157203 | +103% | 149655 | 178658 | +19% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 4440 | 6614 | +49% | 6036 | 6879 | +14% |
| Total tokens | 208048 | 335998 | +62% | 276722 | 317704 | +15% |
| Tool output read (k chars) | 25.5 | 29.4 | +15% | 31.7 | 40.5 | +28% |
| Agent time (s) | 80 | 89.9 | +12% | 87.9 | 90.2 | +3% |
| API time (s) | 61.9 | 69.1 | +12% | 70.9 | 74.6 | +5% |
| Cost ($) | 0.2365 | 0.2742 | +16% | 0.2583 | 0.2870 | +11% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 25.5 | 27 | +6% | 27.6 | 27.7 | +1% |
| Tool calls | 24.5 | 26 | +6% | 26.6 | 26.7 | +0% |
| - that explore (read, search) | 16.5 | 18 | +9% | 19.4 | 19.3 | -0% |
| - that edit | 1 | 3 | +200% | 3.1 | 3.6 | +16% |
| - that verify (typecheck, build) | 4 | 4 | 0% | 3.7 | 3.6 | -2% |
| - other | 0 | 0 | 0% | 0.5 | 0.2 | -53% |
| Input tokens (incl. cache) | 157354 | 213417 | +36% | 231979 | 266888 | +15% |
| - uncached | 114737 | 117426 | +2% | 114293 | 120641 | +6% |
| - cache read | 65432 | 99150 | +52% | 117685 | 146246 | +24% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 3739 | 5071 | +36% | 5653 | 6266 | +11% |
| Total tokens | 160635 | 219461 | +37% | 237632 | 273153 | +15% |
| Tool output read (k chars) | 25.3 | 28.6 | +13% | 30.1 | 38.2 | +27% |
| Agent time (s) | 71.1 | 82 | +15% | 84.5 | 85.4 | +1% |
| API time (s) | 57.6 | 63.7 | +11% | 66.9 | 68.4 | +2% |
| Cost ($) | 0.2130 | 0.2437 | +14% | 0.2400 | 0.2593 | +8% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 3/5 (60%) | 40 | 39 | 337 | 127 | 3/5 (60%) | 41 | 40 | 360 | 110 | +7% | -13% |
| feature-product-discount | 5/5 (100%) | 26 | 25 | 208 | 94 | 5/5 (100%) | 26 | 25 | 201 | 96 | -3% | +3% |
| refactor-rename-cart | 5/5 (100%) | 25 | 24 | 144 | 68 | 5/5 (100%) | 28 | 27 | 229 | 76 | +59% | +11% |
| refactor-move-cart-components | 5/5 (100%) | 35 | 34 | 298 | 88 | 5/5 (100%) | 26 | 25 | 172 | 72 | -42% | -19% |
| feature-order-flow | 4/5 (80%) | 41 | 40 | 388 | 132 | 4/5 (80%) | 40 | 39 | 440 | 121 | +13% | -8% |
| feature-pill-badge | 5/5 (100%) | 19 | 18 | 123 | 57 | 4/5 (80%) | 27 | 26 | 494 | 90 | +303% | +57% |
| refactor-extract-cart-layer | 3/5 (60%) | 41 | 40 | 579 | 115 | 0/5 (0%) | 41 | 40 | 577 | 112 | -0% | -2% |
| bugfix-multihop | 5/5 (100%) | 19 | 18 | 104 | 60 | 5/5 (100%) | 19 | 18 | 100 | 47 | -4% | -22% |
| bugfix-lost-override | 5/5 (100%) | 17 | 17 | 101 | 59 | 5/5 (100%) | 26 | 25 | 284 | 88 | +181% | +47% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| bash | 12.91 | 12.58 | -3% |
| edit | 1.49 | 2.07 | +39% |
| read | 12.64 | 13.64 | +8% |
| write | 1.09 | 1 | -8% |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 21 | 4 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 0 | 2 | 6 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |

## Failures

- `feature-deals-page` auto #1: check ran to the end (got: Error: GET /deals returned 404); agent stopped: error_max_turns
- `feature-deals-page` auto #3: check ran to the end (got: Error: GET /deals returned 404); agent stopped: error_max_turns
- `feature-deals-page` explicit #1: check ran to the end (got: Error: GET /deals returned 404); agent stopped: error_max_turns
- `feature-deals-page` explicit #5: check ran to the end (got: Error: GET /deals returned 404); agent stopped: error_max_turns
- `feature-order-flow` auto #1: check ran to the end (got: Error: GET /orders/1 returned 404); agent stopped: error_max_turns
- `feature-order-flow` explicit #1: #order-total is $37.33 (got: 37.33 USD)
- `feature-pill-badge` explicit #3: /products/notebook: every badge is a pill (got: 1/2 pills); /checkout: every badge is a pill (got: 1/2 pills); agent stopped: error_max_turns
- `refactor-extract-cart-layer` auto #3: every cart file is in layers/cart/app/ (got: components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
- `refactor-extract-cart-layer` auto #5: typecheck failed; agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #1: every cart file is in layers/cart/app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #2: every cart file is in layers/cart/app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #3: typecheck failed; every cart file is in layers/cart/app/ (got: composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #4: typecheck failed; build failed; agent stopped: error_max_turns
- `refactor-extract-cart-layer` explicit #5: every cart file is in layers/cart/app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); no cart file left in app/ (got: composables/useCart.ts, composables/useCartTotal.ts, composables/useDiscount.ts, components/cart/Badge.vue, components/cart/Item.vue, components/cart/Summary.vue, utils/discount.ts, middleware/cart-not-empty.ts); agent stopped: error_max_turns
