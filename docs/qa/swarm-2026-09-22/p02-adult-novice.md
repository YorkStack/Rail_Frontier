# P02 — simulated adult strategy novice

## Scope and method

Simulated 20–35-year-old strategy novice, brief reading and common game conventions. This is agent testing, not research with a human participant. Tested coordinator server http://127.0.0.1:5190, baseline specified by protocol fb5f666, headless Chrome via Playwright, 1440×900, English, UI scale 100%. Fresh nonpersistent context initially opened in German; changed language through Settings before starting the company. Approximately 45 gameplay/menu actions and 10 minutes elapsed, including inspection/tool overhead. Concurrent test workload means this run does not establish standalone performance.

Used accessible UI, clicks/selects, and inspected screenshots exclusively. No source files or existing tests read. No probe, camera helper, time helper, state injection or fixture assistance. Simulation acceleration used the visible 8× button. The railway was drawn with visible From/To buttons; freehand mouse drawing and route-handle editing were not exercised.

## Achieved journey

1. Main menu → Settings → English → Campaign → New game → Guided introduction.
2. Show station tool, default Rural Halt at Sundvik, Align toward settlement (Granli), Build. Cash NOK 5,000,000 → 4,975,000.
3. Focus Granli, Show station tool, Align toward settlement (Sundvik), Build. Two stations, cash NOK 4,950,000.
4. Show track tool → Overview → From: Sundvik → To: Granli. Selected default overland alignment, 2.93 km, 1.9% grade, 0 m bridge/tunnel. Built for NOK 524,331. Cash NOK 4,425,669. Introduction reached step 5.
5. Open Railway Office → Buy this train. Nord 2-6-0 with two recommended coaches, NOK 180,000, 52/90 m platform use, 96 seats and 48 mail capacity. Cash NOK 4,245,669 before operating costs.
6. Guided UI prefilled ordered Sundvik/Granli stops after purchase. Created shuttle route and assigned train. One train and one route visible.
7. Resume and follow train → 8×. Visually observed locomotive and two coaches away from station; office reported running, 80 km/h, travelling toward Granli. Connect settlements advanced to 2/2.
8. Paused Day 3, saved; status confirmed tick 3,506. Open main menu opens Game menu dialog, then Return to main menu → Save & leave → Load game → first Resume. Resumed Day 3 paused, two stations, train 45, route 47, two coaches, 28 passengers and 48 mail aboard. Route revenue NOK 384 and cost NOK 720 persisted. Cash NOK 4,245,181 after pause/save settled.
9. Resumed at 8×. Actual passenger delivery reached 28/200 and the introduction completed explicitly: “Introduction complete. Your railway is now a normal playable company.”
10. Final pause/save at Day 8, tick 8,840, cash NOK 4,243,999. Final charter 1/3, connected settlements 2/2, passengers 28/200, operating-profit objective 0/10,000. Did not claim campaign or profitable operation completion.

## Findings

Zero confirmed blocking or functional bugs on this bounded journey. No P0/P1/P2 finding.

### P02-01 — P3 terminology polish: save calls the company a study

- Classification: confirmed UI copy inconsistency, not persistence failure.
- Environment: 1440×900, English, 100%.
- Steps: Build guided company, click Save game; repeat after completing introduction.
- Expected: Player-facing confirmation calls this a company/game and uses a meaningful player time label.
- Actual: Status “Study saved at tick 3,506.”, later “Study saved at tick 8,840.”; load archive calls it “Norwegian Fjords company”.
- Evidence: exact accessible status text captured on both saves. Screenshot `completed.png` shows corresponding final company, although the transient status is not visible in that screenshot.
- Reproducibility: observed on two saves within this run.
- Recommendation: “Company saved · Day 8” or equivalent. Keep ticks in diagnostics.
- Suggested regression: English save success message uses company/game terminology; persistence behavior stays unchanged.

## Friction and test limitations

Station direction alignment was below the initial visible panel portion, but accessible by scrolling; no blockage. The initial track tutorial describes dragging while the track panel offers easier From/To controls; that alternative completed the route without custom drawing. The UI prefills guided stops after buying: my immediate extra Add stop did not create a duplicate; subsequent exact selection of “Granli” failed because option had changed to “Granli · already added”. Inspection clarified the correct next action. These are observations, not confirmed defects.

Three automation mistakes/timeouts were recovered: trying English as a button before inspecting the language combobox; trying plain Granli after guided prefill; expecting Load game immediately after the logo opened Game menu. None is counted as an app error. No pageerror event appeared. No negative cash, duplicate train, missing route or save corruption observed. Full browser refresh/restart, export/import, save failure, alternate station placements, freight, later objectives and manual freehand construction were not covered.

## Evidence and cleanup

Inspected all six screenshots: `station-tool.png`, `track-overview.png`, `track-start.png`, `train-start.png`, `train-moving.png`, plus `completed.png`, under `artifacts/swarm/evidence/p02-adult-novice/`. Movement is supported by start/moving image change and office speed readout. Own driver: `artifacts/swarm/scripts/p02-adult-novice.mjs`.

One fresh browser/context only. Context closed, then browser closed in finally; driver printed BROWSER_CLOSED and exited. No server or unrelated process controlled, no application/test file changed, no agents spawned.
