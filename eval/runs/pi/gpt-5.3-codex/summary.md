# Auto-imports on/off eval

- config: pi/gpt-5.3-codex
- harness: pi
- model: vercel-ai-gateway/openai/gpt-5.3-codex
- runs: 2
- stale runs left out: 0
- trials per task and arm: 1
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T08:23:53.505Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 1/1 (100%) | 0.6 | 22796 | 0.025 |
| explicit | 0/1 (0%) | 0.5 | 23492 | 0.024 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 8 | 8 | 0% | 8 | 8 | 0% |
| Tool calls | 8 | 8 | 0% | 8 | 8 | 0% |
| - that explore (read, search) | 4 | 4 | 0% | 4 | 4 | 0% |
| - that edit | 1 | 1 | 0% | 1 | 1 | 0% |
| - that verify (typecheck, build) | 3 | 3 | 0% | 3 | 3 | 0% |
| - other | 0 | 0 | 0% | 0 | 0 | 0% |
| Input tokens (incl. cache) | 22249 | 22935 | +3% | 22249 | 22935 | +3% |
| - uncached | 8425 | 7575 | -10% | 8425 | 7575 | -10% |
| - cache read | 13824 | 15360 | +11% | 13824 | 15360 | +11% |
| - cache write | 0 | 0 | 0% | 0 | 0 | 0% |
| Output tokens | 547 | 557 | +2% | 547 | 557 | +2% |
| Total tokens | 22796 | 23492 | +3% | 22796 | 23492 | +3% |
| Tool output read (k chars) | 9.9 | 10.5 | +6% | 9.9 | 10.5 | +6% |
| Agent time (s) | 36.1 | 29 | -20% | 36.1 | 29 | -20% |
| API time (s) | 18.2 | 18 | -1% | 18.2 | 18 | -1% |
| Cost ($) | 0.0248 | 0.0237 | -4% | 0.0248 | 0.0237 | -4% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 8 | - | - | 8 | - | - |
| Tool calls | 8 | - | - | 8 | - | - |
| - that explore (read, search) | 4 | - | - | 4 | - | - |
| - that edit | 1 | - | - | 1 | - | - |
| - that verify (typecheck, build) | 3 | - | - | 3 | - | - |
| - other | 0 | - | - | 0 | - | - |
| Input tokens (incl. cache) | 22249 | - | - | 22249 | - | - |
| - uncached | 8425 | - | - | 8425 | - | - |
| - cache read | 13824 | - | - | 13824 | - | - |
| - cache write | 0 | - | - | 0 | - | - |
| Output tokens | 547 | - | - | 547 | - | - |
| Total tokens | 22796 | - | - | 22796 | - | - |
| Tool output read (k chars) | 9.9 | - | - | 9.9 | - | - |
| Agent time (s) | 36.1 | - | - | 36.1 | - | - |
| API time (s) | 18.2 | - | - | 18.2 | - | - |
| Cost ($) | 0.0248 | - | - | 0.0248 | - | - |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-pill-badge | 1/1 (100%) | 8 | 8 | 23 | 36 | 0/1 (0%) | 8 | 8 | 23 | 29 | +3% | -20% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| bash | 6 | 6 | 0% |
| read | 1 | 1 | 0% |
| write | 1 | 1 | 0% |

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

- `feature-pill-badge` explicit #1: /: every badge is a pill (got: 0/1 pills); /products/notebook: every badge is a pill (got: 0/2 pills); /checkout: every badge is a pill (got: 0/2 pills)
