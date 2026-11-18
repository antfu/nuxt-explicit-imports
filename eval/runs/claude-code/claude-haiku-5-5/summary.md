# Auto-imports on/off eval

- config: claude-code/claude-haiku-5-5
- harness: claude-code
- model: claude-haiku-5-5
- runs: 4
- stale runs left out: 0
- trials per task and arm: 2
- maxTurns: 40
- timeoutMin: 10
- last run: 2026-11-18T08:26:40.624Z

## Pass rate

| Arm | Pass | Total agent time (min) | Total tokens | Total cost ($) |
| --- | --- | --- | --- | --- |
| auto | 2/3 (67%) | 2.7 | 699746 | 0.021 |
| explicit | 1/1 (100%) | 1 | 172996 | 0.005 |

## Efficiency

Per agent run, all runs. Lower is better. "change" is explicit compared to auto: a negative value means explicit used less.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 10 | 10 | 0% | 8.7 | 10 | +15% |
| Tool calls | 9 | 9 | 0% | 7.7 | 9 | +17% |
| - that explore (read, search) | 7 | 4 | -43% | 5.7 | 4 | -29% |
| - that edit | 2 | 4 | +100% | 1.7 | 4 | +140% |
| - that verify (typecheck, build) | 3 | 2 | -33% | 2.3 | 2 | -14% |
| - other | 0 | 0 | 0% | 0 | 0 | 0% |
| Input tokens (incl. cache) | 276489 | 169336 | -39% | 228144 | 169336 | -26% |
| - uncached | 1325 | 1287 | -3% | 1311 | 1287 | -2% |
| - cache read | 256685 | 154603 | -40% | 210416 | 154603 | -27% |
| - cache write | 18479 | 13446 | -27% | 16418 | 13446 | -18% |
| Output tokens | 6272 | 3660 | -42% | 5104 | 3660 | -28% |
| Total tokens | 282761 | 172996 | -39% | 233249 | 172996 | -26% |
| Tool output read (k chars) | 18.2 | 11.7 | -36% | 15.7 | 11.7 | -26% |
| Agent time (s) | 56 | 58.1 | +4% | 53.8 | 58.1 | +8% |
| API time (s) | 35.4 | 21.4 | -40% | 31.7 | 21.4 | -33% |
| Cost ($) | 0.0081 | 0.0052 | -36% | 0.0068 | 0.0052 | -24% |

### Passing runs only

The same metrics without failed runs, which often stop early or run out of turns.

| Metric (per run) | auto median | explicit median | change | auto mean | explicit mean | change |
| --- | --- | --- | --- | --- | --- | --- |
| Turns | 8 | 10 | +25% | 8 | 10 | +25% |
| Tool calls | 7 | 9 | +29% | 7 | 9 | +29% |
| - that explore (read, search) | 5 | 4 | -20% | 5 | 4 | -20% |
| - that edit | 1.5 | 4 | +167% | 1.5 | 4 | +167% |
| - that verify (typecheck, build) | 2 | 2 | 0% | 2 | 2 | 0% |
| - other | 0 | 0 | 0% | 0 | 0 | 0% |
| Input tokens (incl. cache) | 203972 | 169336 | -17% | 203972 | 169336 | -17% |
| - uncached | 1304 | 1287 | -1% | 1304 | 1287 | -1% |
| - cache read | 187281 | 154603 | -17% | 187281 | 154603 | -17% |
| - cache write | 15387 | 13446 | -13% | 15387 | 13446 | -13% |
| Output tokens | 4521 | 3660 | -19% | 4521 | 3660 | -19% |
| Total tokens | 208493 | 172996 | -17% | 208493 | 172996 | -17% |
| Tool output read (k chars) | 14.5 | 11.7 | -20% | 14.5 | 11.7 | -20% |
| Agent time (s) | 52.7 | 58.1 | +10% | 52.7 | 58.1 | +10% |
| API time (s) | 29.8 | 21.4 | -28% | 29.8 | 21.4 | -28% |
| Cost ($) | 0.0062 | 0.0052 | -16% | 0.0062 | 0.0052 | -16% |

## Per task

Medians per run. "k tokens" counts input (with cache) and output tokens.

| Task | auto pass | auto turns | auto tools | auto k tokens | auto s | explicit pass | explicit turns | explicit tools | explicit k tokens | explicit s | tokens change | time change |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| feature-deals-page | 1/2 (50%) | 10 | 9 | 289 | 62 | - | - | - | - | - | - | - |
| feature-pill-badge | 1/1 (100%) | 6 | 5 | 121 | 37 | 1/1 (100%) | 10 | 9 | 173 | 58 | +43% | +57% |

## Tool usage

| Tool | auto calls/run | explicit calls/run | change |
| --- | --- | --- | --- |
| Bash | 6.67 | 5 | -25% |
| Edit | 0 | 3 | n/a |
| Write | 1 | 1 | 0% |

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

- `feature-deals-page` auto #2: check ran to the end (got: Error: Server did not start: TypeError: fetch failed)
