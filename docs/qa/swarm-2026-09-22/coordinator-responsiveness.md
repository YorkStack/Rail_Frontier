# S07 — coordinator single-browser follow-up

Frozen baseline fb5f666 on port5190, one headless Chrome 1440×900, fresh context, after every role browser closed. This is a bounded responsiveness check, not a hardware performance certification. The core Node suite briefly overlapped early setup/measurement; no other automated browser ran. No CPU/GPU throttling was injected.

Disclosed commissioned `?skip-menu=1&lang=en` fixture supplies the original train, railway and route. Two further two-coach trains were bought and assigned using ordinary controls. No state/time injection; read-only probes record state, timing and reset only diagnostic counters. Sequence: 12 seconds at 1×, 25 seconds at 8×, then 15 seconds of 8× train-follow; Pause/open/close office between phases. Browser closed in finally.

All twelve normal Playwright clicks succeeded without forced/coordinate fallback: **29–421 ms**. Final tick 6733 with three trains. 720/1499 sampled frames averaged 16.67/16.68 ms in the first two phases. No pageerrors. The earlier 7–15 second locator/screenshot timeouts were not reproduced in this single-browser run. This does not prove the cause was GPU contention or guarantee responsiveness on other devices/longer companies. S07 remains a non-reproduced concurrency observation; no speculative simulation change was made.

Artifacts: `artifacts/swarm/scripts/coordinator-responsiveness.mjs`, `artifacts/swarm/responsiveness.txt`, `artifacts/swarm/evidence/coordinator-responsiveness/results.json`. The final screenshot is auxiliary and not used to infer collision safety. Three trains in one corridor are not proof of future station-yard occupancy correctness.
