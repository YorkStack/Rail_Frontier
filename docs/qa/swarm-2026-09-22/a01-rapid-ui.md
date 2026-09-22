# A01 — Rapid UI adversary

Baseline fb5f666, immutable server 5190. 2026-09-22. Chromium desktop 1440×900, English, default 100% scale, fresh isolated storage. About nine minutes, approximately 55 deliberate button/pointer activations including repeated clicks. Simulated adversarial testing, not a human usability study.

## Method and scope

Began at the actual menu, chose New game → Free play, inspected the station tool and built the initial station. For worker and service tests, subsequently used the disclosed `?draw-practice=1&lang=en` fixture: its two prebuilt stations and paused construction lesson avoid spending this bounded test on ordinary station placement. Read existing baseline browser test selectors after initial UI exploration. All economic actions used real pointer clicks; snapshot probes only recorded evidence. No commands or state were injected, no camera/time probe helpers used.

## Confirmed results

- **Station triple click** at the purchase button, 25 ms click spacing: stations 0 → 1, edges 0 → 2; cash 500,000,000 → 497,500,000 minor units. Exactly one NOK 25,000 purchase.
- **Pending calculation cancellation:** three consecutive From Sundvik → To Granli → Restart sequences, followed by waiting for late results. Still two stations/four internal edges, two ledger entries, NOK 9,950,000. The purchase footer stayed hidden and the start-choice screen remained current.
- **Worker/tool-switch race:** while text explicitly said “Checking station approaches, terrain and construction costs”, switched Stations → Trains & lines → Operations → Tracks → Restart. Late worker completion did not resurrect the cancelled quote or mutate the graph/cash. Four edges and the two initial ledger entries remained.
- **Track quadruple click**, 10 ms spacing: exactly one graph revision (2 → 3), one ledger entry (2 → 3), edges 4 → 16, cash 995,000,000 → 942,566,888. The displayed NOK 524,331 quote reconciles with the actual 52,433,112 minor-unit debit within display rounding.
- **Train triple click**, 20 ms spacing: one train, one ledger entry, precisely NOK 180,000 debited. Route setup remained usable.
- **Create route quadruple click**, 15 ms spacing: routes 0 → 1. One valid shuttle resulted.
- **Assign service quadruple click**, 15 ms spacing: one train assigned to one route, no additional ledger entry or purchase debit. No page errors. The train was in running phase.

There were no confirmed P0, P1 or P2 failures in these tested sequences. This is bounded evidence, not proof against every race interleaving.

## A01-01 — P3 candidate: follow action can be activated by rapid assignment clicks

**Observed:** after four clicks at the Assign service coordinates, the office closed and the camera followed the train. The inspected screenshot shows the running clock, a train beside the platform, and the toast “Train assigned. Resume time when you are ready.”

**Expected:** one assignment action; a subsequent deliberate Resume/follow action controls camera and time.

**Interpretation:** likely click-through into the replacement Resume and follow control after the first assignment. This is a minor interaction side effect, not duplicated train/cash state. The attempted second, double-click reproduction was not executed because its command exceeded the interactive PTY line buffer; it is not counted as a second observation. Source-level causation is therefore not claimed.

**Recommendation:** document for later polish. If independently reproduced, keep the next-stage action out of the previous button's hit target or reject follow activation for the remainder of the originating multi-click sequence. Regression should send actual multi-click mouse events, verify a single assignment and check that camera/time stay unchanged until a deliberate follow action.

## Evidence and limitations

Recorded before/after snapshots in `artifacts/swarm/evidence/a01/`: `triple-station.json`, `cancel-race.json`, `tool-race.json`, `quadruple-track.json`, `triple-buy.json`, `quadruple-route.json`, `quadruple-assign.json`. `service-after-spam.png` was opened and visually inspected.

The evidence covers a successful station purchase, a completed buildable route, a purchased consist and an assigned service. It does not cover a complete passenger delivery, save/reload, freight, multiple scenario epochs or memory/GPU benchmarks. Concurrent agents existed, so no latency claim is made. Initial locator misses were harness naming errors (icon-prefixed Stations and visible Buy this train versus accessible Buy consist), not game failures. Worker cancellation was exercised three times, tool switching once, each economic multi-click once.

## Cleanup

Browser/context closed in `finally`; output explicitly recorded `ERRORS []` and `BROWSER_CLOSED`. Closed the remaining readline/PTY input using EOF; runner session exited 0. Process check found neither runner PID 74332 nor children. No server or shared application files were modified. The coordinator-owned server remains running for other reviewers.
