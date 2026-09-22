# P10 — Experienced campaign explorer

Baseline fb5f666, frozen server 5190. English, 1440 × 900, default 100% interface. One fresh headless Chrome context. This is an experienced-player testing perspective, not a human participant study.

## Journey and result

Approximately 9 minutes, 20 recorded inspection/action batches and about 14 successful visible control activations. Began at the normal menu without reading implementation or existing browser tests. Chose New game → Free play; inspected the First Charter, date, railway office, vehicle list and optional tools. Fresh 1900 company correctly began with NOK 5,000,000 and no stations or trains. Only the available steam locomotive appeared. Purchasing correctly explained that a connected station was required. The menu offered Norway rather than pretending additional playable campaigns were available.

To examine campaign progress within the allotted time, **switched explicitly to the commissioned `?skip-menu=1` fixture** after reviewing the existing operations test. This supplies stations, track and a working train; it is not a railway I built. Used the visible 8× button and observed real simulated passenger transport. At the final paused snapshot:

- Tick 25,701, displayed Day 22 · 1900.
- Three connected covered towns; UI deliberately caps the target display at 2 / 2.
- 257 delivered passengers; UI correctly caps the target at 200 / 200 and shows 2 / 3 objectives completed.
- Operating-profit objective remains incomplete; cash is 499,042,808 minor units, displayed NOK 4,990,428.
- Actual ledger entries include passenger fares and mail delivery. No unsupported claim that this particular service was profitable, nor a full cash-ledger reconciliation.

Saved through the visible Save game control at tick 11,885; success message appeared. This report does not claim reload equality (other assigned reviewers cover persistence).

Then visited the documented Arizona scenery URL, inspected its Canyon view, and used its Return to Norway link. It clearly states that it is a scenery preview and construction/company play are available in Norway. Return successfully reopened the Norwegian campaign menu. The URL-only English override was not persisted, so returning to a URL without `lang=en` used German; no claim that a saved language setting was lost.

## Findings

### P10-01 — Provisional responsiveness issue at 8×; coordinator S07

**Unconfirmed product severity; isolate before prioritizing.** During simultaneous agent browser runs, normal Pause click timed out after 10 seconds while waiting for visible/enabled/stable. One force-click attempt timed out scrolling; boundingBox timed out. A read-only DOM rectangle returned (1234, 846); clicking those coordinates recovered immediately, and the next screenshot showed PAUSED. This reproduces the automation symptom seen by other agents but does not distinguish application performance from concurrent GPU/browser contention. Do not label it data loss or a proven human-input failure.

Repro: commissioned Norway fixture → 8× → allow passenger transport → close office → normal Pause locator click. Evidence: `artifacts/swarm/evidence/p10-campaign-explorer/session.json`. Recommended regression/review: single-browser interactive and timing comparison at 1×/8×, including Pause and panel controls, before any performance fix.

### P10-02 — P3: successful save exposes internal tick terminology

Confirmed English UI wording: normal Save game action reports “Study saved at tick 11,885.” Expected player-facing confirmation using company/save name or displayed date. Actual wording uses “Study” and an internal tick count despite a company campaign. Reproducible once in this run; corroborates another reviewer. Recommendation: document for copy cleanup, not a release blocker. A copy test could ensure normal company saves use localized user-facing wording.

No confirmed P0/P1/P2 issue in this assignment. Absence of other campaigns and future station features is accurately presented scope, not classified as a bug.

## Era coverage — explicitly not a century playthrough

After initial UI exploration, inspected baseline calendar/catalogue source. Executed the existing three calendar tests; these exact source/test files had no differences from fb5f666. All 3 passed. They verify year rollover, the mathematical 1900→2000 boundary without economic-day reset, and locomotive availability boundaries at 1922, 1960, 1981 and 1996. Evidence: `calendar-boundaries.txt`. These are model-level checks, **not evidence of playable balance across a century**, later-era browser purchasing, or evolved city graphics. Did not complete the profit charter, reach a second campaign, or play a full year.

## Evidence and cleanup

Script: `artifacts/swarm/scripts/p10-campaign-explorer.mjs`. Evidence directory: `artifacts/swarm/evidence/p10-campaign-explorer/`.

Inspected both `campaign-progress.png` (2 / 3 charter, Day 22, paused) and `arizona-study.png` (explicit scenery-only caption and return link). Session log contains read-only snapshots, actions and errors. Browser `pageerror` list is empty. Initial harness used top-level await inside eval once and corrected it; one return-control lookup wrongly used button instead of link and corrected it. Those two harness errors are not product bugs.

`finally` closed context and browser and printed CLOSED. Sent EOF to terminate the remaining readline runner. Verified PID 74309 no longer exists. No server was started or stopped; no application files, existing tests, user profiles or user saves modified.
