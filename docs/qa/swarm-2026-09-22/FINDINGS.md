# Findings and correction register

Baseline `fb5f666`. Coordinator triage retains evidence and distinguishes bugs, unconfirmed observations and planned capabilities. Raw reports preserve their original priorities. Simulated reviewers do not establish human usability, demographic suitability or magazine ratings. Validation complete: 224 core tests and 49 distinct browser cases passed; exact run accounting in RESULTS.md.

| ID | Priority / status | Evidence | Decision |
|---|---|---|---|
| S01 | P2 / fixed / verified | Coordinator C01 | Offered new-layout station upgrades fail with an internal layout error. Explain physical reconstruction and disable unsupported purchase using shared eligibility. Preserve atomic domain rejection and supported legacy upgrades. |
| S02 | P2 / fixed / verified | P03-01 | Objective card overlaps clock at 1280×720 / 150%. Position below real cash card and constrain above actual clock. |
| S03 | P2 / fixed / verified | P03-02 | Enlarged station panel has very little scroll area. Remove redundant large heading on short screens, compact fixed footer and reserve scrollbar space. |
| S04 | P2 / fixed / verified | P03-03 | Key save/archive/helper controls ignore scale. Apply readable scaled sizes and wrapping to these controls. |
| S05 | P2 / fixed / verified | P04 | Main cash card vanishes during purchase planning. Show live available cash in construction/operations headers. |
| S06 | P2 / fixed / verified | P06-01 | Freight service reports passengers aboard. Show aggregated actual cargo for freight consists. |
| S07 | Not reproduced with one browser | P01, P06-02 | 8×/office action timeouts under concurrent browsers. Coordinate pause recovers. Single-browser three-train 1×/8×/follow run: all 12 clicks succeeded 29–421 ms, no errors. No speculative simulation change. See coordinator-responsiveness.md. |
| S08 | P3 / documented | P01, P03-04, P04 | Remaining English status/economy/default-name fragments in German; no failed operation established. Separate copy sweep later. |
| S09 | P3 / documented | P05 | Tutorial mentions drawing but not accessible From/To alternative. Keyboard journey succeeded. Copy improvement later. |
| S10 | P3 / documented | P02-01 | “Study saved at tick …” is developer terminology. Persistence succeeded; player-facing save wording later. |
| S11 | P1 / fixed / verified, saved-state loss | P09 | Leaving a company then entering school skips backup and later overwrites shared study/autosave. Before every session replacement preserve stored quick saves by content hash; abort replacement on write failure. Original documents and drafts retained; no discarded in-memory edits silently saved. Agent rated P0; coordinator treats specific saved-company loss as release-blocking P1. |
| S12 | P2 / fixed / verified | P07 | Assigned trains cannot be selected for service management. Add explicit Manage services control and stopped-at-station explanation; disable same-route/moving assignment, retain atomic domain safety. |
| S13 | P2 / fixed / verified | P09 | Identical practice names complicate recovery. Quick saves now name the lesson; transition backups include its number. |
| S14 | P2 / fixed / verified | U01-01 | First guided connection opens near one station. Frame both tutorial stations once when the first track plan opens; preserve later camera choices. |
| S15 | P2 / fixed / verified | A03 | Disconnected route rejection moves focus to train purchase and hides error below viewport. Keep draft and place/focus the localized explanation at the attempted form. |
| S16 | P3 / documented | A01-01 | Multi-click assignment may click through into the next Follow control. Once observed; no duplicated costs/state. Retain for interaction polish. |
| S17 | P3 / documented | A04 | Failed manual save uses archive-open error wording. Failure is recoverable and data remains intact; contextual copy follow-up. |
| S18 | P3 / documented | U01-03 | Persistent assignment confirmation still says resume after time starts. Live service state is correct; confirmation-lifetime cleanup later. |
| S19 | P2 / fixed / verified | U03 | Switching from company office to Trains & lines closes the shared panel. Switch mode in one click; clicking the already active train tool still closes it. |
| S20 | P3 / documented | U02 | Expanded German profile heading clips at default desktop size. Numeric value and construction controls remain usable; localized label wrapping follow-up. |
| S21 | P2 / fixed / verified | U03 | Sawmill shows 100% when blocked. Shared simulation eligibility now distinguishes missing inputs and full storage; office and world detail show blocker and actual recipe. |
| S22 | P3 / documented | U03 | Small running-cost ledger entries round to zero in the UI. Aggregate costs reconcile; ledger precision/grouping follow-up. |
| S23 | P3 / documented | U04 | Guided-start accessible name differs from visible label. Activation works; label-in-name cleanup later. |
| S24 | P3 / documented | U04 | Reduced-motion preference status updates on reload, not live. No exhaustive animation claim; settings event update later. |

Thirteen clusters have concrete corrections (one saved-state-loss P1 and twelve P2). Ten P3 items are documented rather than expanded into this correction round. One responsiveness symptom was not reproduced with a single browser. S01 is a coordinator domain reproduction; other clusters trace to role reports. New platforms/yards remain planned in [STATION_EXPANSION_AND_YARDS.md](../../construction/STATION_EXPANSION_AND_YARDS.md).

Desktop and narrow station scroll-region checks cover P03/U04 together. [Single-browser responsiveness evidence](coordinator-responsiveness.md) records S07's scope; it does not assert a causal explanation for the earlier concurrent-browser timeouts.
