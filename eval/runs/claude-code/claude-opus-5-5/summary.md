# Auto-imports on/off eval

- config: claude-code/claude-opus-5-5
- harness: claude-code
- model: claude-opus-5-5
- runs: 90
- stale runs left out: 0
- trials per task and arm: 5
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-19T00:18:20.974Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 45/45 (100%) | 27 | 6364725 | 5.250 |
| explicit | 45/45 (100%) | 23.3 | 5309706 | 4.875 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 6 | 5 | -17% | 6.2 | 5.3 | -16% |
| Tool calls | 5 | 4 | -20% | 5.2 | 4.3 | -19% |
| - that explore (read, search) | 4 | 4 | 0% | 4.5 | 3.6 | -19% |
| - that edit | 1 | 1 | 0% | 1.5 | 1.1 | -24% |
| - that verify (typecheck, build) | 1 | 1 | 0% | 1.2 | 1.1 | -9% |
| - other | 0 | 0 | 0% | 0.2 | 0.1 | -40% |
| Input tokens (incl. cache) | 123331 | 107087 | -13% | 139368 | 116143 | -17% |
| - uncached | 1268 | 1266 | -0% | 1300 | 1298 | -0% |
| - cache read | 116350 | 98480 | -15% | 129227 | 105852 | -18% |
| - cache write | 8169 | 7695 | -6% | 8841 | 8992 | +2% |
| Output tokens | 1502 | 1226 | -18% | 2071 | 1851 | -11% |
| Total tokens | 124332 | 108041 | -13% | 141438 | 117993 | -17% |
| Tool output read (k chars) | 7.2 | 6.7 | -7% | 8.3 | 8.8 | +5% |
| Agent time (s) | 28.4 | 24.9 | -12% | 36 | 31.1 | -14% |
| API time (s) | 23.9 | 20.2 | -15% | 29.7 | 25.7 | -13% |
| Cost ($) | 0.1000 | 0.0873 | -13% | 0.1167 | 0.1083 | -7% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 5/5 (100%) | 6 | 5 | 115 | 32 | 5/5 (100%) | 6 | 5 | 113 | 31 | -2% | -3% |
| feature-product-discount | 5/5 (100%) | 5 | 4 | 113 | 28 | 5/5 (100%) | 4 | 3 | 91 | 25 | -20% | -11% |
| refactor-rename-cart | 5/5 (100%) | 5 | 4 | 107 | 26 | 5/5 (100%) | 5 | 4 | 107 | 23 | +0% | -12% |
| refactor-move-cart-components | 5/5 (100%) | 7 | 6 | 152 | 32 | 5/5 (100%) | 4 | 3 | 85 | 21 | -44% | -34% |
| feature-order-flow | 5/5 (100%) | 8 | 7 | 199 | 66 | 5/5 (100%) | 7 | 6 | 182 | 61 | -9% | -6% |
| feature-pill-badge | 5/5 (100%) | 5 | 4 | 103 | 23 | 5/5 (100%) | 4 | 3 | 84 | 21 | -19% | -7% |
| refactor-extract-cart-layer | 5/5 (100%) | 8 | 7 | 194 | 57 | 5/5 (100%) | 6 | 5 | 158 | 46 | -19% | -18% |
| bugfix-multihop | 5/5 (100%) | 5 | 4 | 108 | 27 | 5/5 (100%) | 5 | 4 | 108 | 23 | +0% | -13% |
| bugfix-lost-override | 5/5 (100%) | 5 | 4 | 105 | 23 | 5/5 (100%) | 6 | 5 | 125 | 25 | +20% | +7% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| Bash | 5.24 | 4.24 | -19% |
| Write | 0 | 0.02 | n/a |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 0 | 0 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 1 | 0 | 0 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |
