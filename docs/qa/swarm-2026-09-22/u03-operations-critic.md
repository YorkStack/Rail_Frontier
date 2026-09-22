# U03 — Critical operations and progression review

2026-09-22. Baseline fb5f666, immutable server 5190. English, 1440×900, 100% scale. Approximately six minutes, roughly 30 meaningful UI activations. Magazine-style critical perspective is a simulated reviewer role, not an actual publication. Reused the A01/A04 worker with a new browser/context and empty storage; this limitation matters when counting independent reviewers.

## Actual coverage

Started at the menu, created Free play and opened Operations before constructing anything. This exposed the available company report and industry tools from a genuine empty company. Then explicitly used `?skip-menu=1&lang=en` commissioned fixture to review midgame operations: three stations, one assigned passenger train and its route. No claim of personally constructing that network. Paused via UI, inspected consist purchase, selected Timber freight without buying, reviewed finances and objectives, resumed via Resume and follow train, selected 4× for twelve seconds, then paused and inspected the sawmill on the map. Only read-only snapshot/stats probes were used.

## U03-01 — P2 confirmed navigation defect: Operations → Trains requires two clicks

**Steps:** Open Trains & lines. Click Operations; company panel opens with “Your company”. Click Trains & lines once.

**Actual:** the entire panel closes. A second Trains & lines click opens the intended service panel. Reproduced twice. The two primary dock buttons appear to be destinations, but their shared visibility toggle interrupts direct switching.

**Expected:** switching between the distinct company and service destinations changes panel content on the first click. Clicking the already active destination may close it.

**Evidence:** `artifacts/swarm/evidence/u03/tool-navigation.json` contains company visible → trains hidden → trains again visible. Initial failed service selector attempt was caused by this real panel closure; not counted as a separate bug.

**Recommendation/regression:** track active panel purpose and toggle only on reselecting the same purpose. Browser test both directions and verify one click reveals the requested heading and actionable controls.

## U03-02 — P2 confirmed misleading industry status: stalled sawmill says Production 100%

**Steps:** In the commissioned fixture, run the existing passenger service at 4× for about twelve seconds; pause. Open Operations, scroll to Timber industries, then click Sundvik Sawmill.

**Actual:** office row shows `0 timber · 14 lumber`, `100% cycle`; the dedicated detail shows `PRODUCTION 100%`, zero timber, 14 lumber and “Sundvik handles this site's freight.” There is no input/output recipe, missing-input state or recovery action. It appears fully productive despite having no feedstock.

**Expected:** distinguish cycle readiness from actual production. Show that the mill needs timber, its conversion recipe, and which station serves it. For a different stall caused by full storage, explain that condition instead.

**Evidence:** `industry-detail.txt`, screenshot `industry-blocked.png` (opened and visually inspected). After the UI observation, baseline source diagnosis confirmed `advanceIndustries` holds its cycle at 100% when inputs or storage prevent completion; sawmill consumes 10 timber to produce 7 lumber. This is a presentation defect, not a broken production simulation.

**Recommendation/regression:** derive a shared actionable production status from inventory, recipe and storage. Test missing input at completed cycle, free production in progress, and full output storage; assert truthful DE/EN labels in detail and office list. This is a valuable correction before encouraging inexperienced freight players.

## U03-03 — P3 polish: financial ledger shows repeated “-NOK 0” entries

After the short run, Operating cost correctly showed NOK 42 and cash NOK 4,999,958, while the recent ledger contained multiple visually identical `-NOK 0 / Train running cost / Day 1 · maintenance` rows. Fractional charges round down individually, making the transaction list poor at explaining the aggregate.

Recommend later aggregation by day/train/category or display precision for small values. Current totals reconcile and no economic defect was observed. Not a blocker.

## What worked and what remains untested

Paused service guidance explicitly says time is paused and offers Resume and follow train. The first charter eventually correctly displays the connected-settlement milestone as 2/2 and total 1/3. The capital/operating distinction in company and monthly reports is useful. The short run's operating loss and cash movement agree.

There is no measured enjoyment score here. No passenger delivery, full charter completion, century progression, cargo shipment, deadlock, multiple-train management or save/reload was reached in this role. The fixture's pre-owned assets with zero capital investment were treated as fixture setup, not a game accounting defect. Known missing assignment controls and freight passenger wording were not re-filed. A paused train retains its last numeric speed beside the explicit paused state; this was noted, not escalated. Browser errors remained empty and contextLost was false; no performance claims from parallel test load.

## Cleanup

Closed context and browser in `finally`, runner printed `ERRORS []` and `BROWSER_CLOSED`, exited 0. Process check found no `u03-operations-critic.mjs` runner. No application/test/server files changed; coordinator server left available for other roles.
