# Auto-imports on/off eval

- config: pi/gemini-3.5-flash
- harness: pi
- model: vercel-ai-gateway/google/gemini-3.5-flash
- runs: 2
- stale runs left out: 0
- trials per task and arm: 1
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T08:24:56.331Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 1/1 (100%) | 0.9 | 93073 | 0.124 |
| explicit | 1/1 (100%) | 1.4 | 204499 | 0.218 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 15 | 25 | +67% | 15 | 25 | +67% |
| Tool calls | 14 | 24 | +71% | 14 | 24 | +71% |
| - that explore (read, search) | 10 | 16 | +60% | 10 | 16 | +60% |
| - that edit | 1 | 3 | +200% | 1 | 3 | +200% |
| - that verify (typecheck, build) | 3 | 5 | +67% | 3 | 5 | +67% |
| - other | 0 | 0 | 0% | 0 | 0 | 0% |
| Input tokens (incl. cache) | 90998 | 199526 | +119% | 90998 | 199526 | +119% |
| - uncached | 67570 | 106022 | +57% | 67570 | 106022 | +57% |
| - cache read | 23428 | 93504 | +299% | 23428 | 93504 | +299% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 2075 | 4973 | +140% | 2075 | 4973 | +140% |
| Total tokens | 93073 | 204499 | +120% | 93073 | 204499 | +120% |
| Tool output read (k chars) | 20.9 | 34.2 | +64% | 20.9 | 34.2 | +64% |
| Agent time (s) | 52.4 | 84.7 | +62% | 52.4 | 84.7 | +62% |
| API time (s) | 30.2 | 57.4 | +90% | 30.2 | 57.4 | +90% |
| Cost ($) | 0.1235 | 0.2178 | +76% | 0.1235 | 0.2178 | +76% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-pill-badge | 1/1 (100%) | 15 | 14 | 93 | 52 | 1/1 (100%) | 25 | 24 | 204 | 85 | +120% | +62% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| bash | 8 | 12 | +50% |
| edit | 0 | 2 | n/a |
| read | 5 | 9 | +80% |
| write | 1 | 1 | 0% |

## Errors

TypeScript and build errors, counted in the agent's tool output while it worked and in the final gates.

| Error kind | auto during run | auto at end | explicit during run | explicit at end |
| --- | --- | --- | --- | --- |
| missing-name | 0 | 0 | 0 | 0 |
| bad-module-path | 0 | 0 | 0 | 0 |
| bad-export | 0 | 0 | 0 | 0 |
| duplicate-declaration | 0 | 0 | 0 | 0 |
| other-ts | 0 | 0 | 2 | 0 |
| build-resolve | 0 | 0 | 0 | 0 |
