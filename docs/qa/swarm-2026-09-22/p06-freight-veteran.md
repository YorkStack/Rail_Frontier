# P06 · Freight veteran

Simulated experienced adult railroad player, not human-subject research. Frozen build `fb5f666`, `http://127.0.0.1:5190`, German, UI scale 100%, desktop 1440×1000, one fresh headless Playwright Chrome/context. Approximately 40 successful UI actions plus bounded failed automation attempts, about 12 minutes including evidence collection.

## Journey and assistance

Started at the normal campaign menu. Selected Neues Spiel → Freies Spiel, opened station building, selected the freight terminal and inspected its preview (180,000 NOK listed price; 209,590 NOK including earthworks). Did not commit a terminal or construct a line. Opened Züge & Linien, selected Holztransport, and expanded optional tools. With no railway built, purchase was correctly explained as requiring a connected station. The industry list identified Granli Forest and Sundvik Sawmill and town rows exposed lumber demand. This initial UI journey did not establish a complete new railway.

After this initial attempt, read the frozen `tests/browser/freight.spec.ts` and used its `?skip-menu` commissioned scenario. Cleared only this disposable context's storage before navigating there. This fixture supplied three stations, two connected rail edges, one passenger train, 40 timber at the forest and 14 lumber at the sawmill. This is explicitly an advanced fixture-assisted operations test, not evidence of a novice successfully building the chain. Later read baseline `src/main.ts` for diagnosis of industry/coverage presentation, after UI observations. All train purchases, stop additions, route creation, assignment and speed changes used UI clicks/selects; no commands/state were injected. Snapshot/stats were read-only. No camera or simulation-time probe helpers were used.

Paused the scenario, purchased one Nord 2-6-0 and one freight wagon at Granli, added ordered stops Granli → Sundvik, created a shuttle, assigned the freight train and ran at 8×. Purchase preview gave 144,000 NOK, length 28/180 m, 40 t capacity, 56 NOK/km and 212 NOK/day. Roster immediately showed 40 t Holz loaded. Actual simulation movement delivered 40 timber, then 21 lumber, then another 40 timber. Final freight train carried another 28 lumber toward Granli. The initial 14 lumber was seeded, so the first lumber delivery cannot all be attributed to new processing; further inventory/loading and two timber unloads demonstrate ongoing operation rather than merely a purchased idle consist.

## Findings

### P06-01 · P2 · Freight service summary reports passengers instead of freight

Confirmed UI correctness/clarity bug. Same viewport/language/scale as above.

- Steps: use the commissioned scenario; pause; buy a steam locomotive plus one freight wagon at Granli; create Granli → Sundvik shuttle; assign it; inspect step 3, then inspect the roster. Repeat after timber/lumber trips.
- Expected: the main active service summary reports the selected train's freight cargo (40 t timber initially; 28 t lumber in final state), or a cargo-neutral summary.
- Actual: the roster correctly reports `40 t Holz` and later `28 t Bretter`, but the prominent service card says `0 Fahrgäste an Bord`. It retains passenger-oriented guidance despite a successful freight assignment. A freight player must leave the emphasized card and inspect the roster to understand whether loading happened.
- Evidence: inspected `06-assigned-loaded.png` and `09-freight-summary.png`; `final-evidence.json` confirms freight train `train:422`, one `fjord-freight-wagon`, final cargo 28 lumber, route `route:424`. `09` visibly shows the incorrect passenger summary. Captured twice in one scenario, initially loaded and after deliveries.
- Recommendation/regression: use the existing cargo summary in the service card, branch its guidance by consist, test passenger and freight cases with nonzero cargo in both locales. P2 because actual freight works and the roster provides a workaround.

### P06-02 · P2 provisional · 8× session caused repeated slow/unavailable automated UI actions

Confirmed observation, cause and isolated reproducibility unconfirmed. Concurrent machine workload may be involved; coordinator was notified and will isolate.

- Steps: run the above two-train scenario at 8× through the first timber/lumber cycle (roughly day 9), then try opening operations or pausing.
- Expected: Pause and operations remain promptly actionable and screenshots complete.
- Actual: operations lookup timed out at 5 s despite text appearing in a subsequent body read; Pause resolved to the correct visible button but waited for visibility/stability beyond 15 s; a forced Pause locator click also timed out after scrolling. Screenshot timed out waiting for fonts. A real mouse click at the already-observed Pause position (1235,944) eventually recovered paused state around day 15/16. After pause, the final screenshot succeeded. No state injection was used for recovery.
- Evidence: action logs in this agent session; final paused screenshot `09-freight-summary.png`; final read-only stats in `final-evidence.json`: contextLost false, 200 render calls, 936,912 triangles, 28,000 trees, 2 trains. No FPS measurement available in returned stats.
- Reproducibility: several action failures during this single long 8× run; not retested from fresh isolated scenario. Do not present this as a proven engine performance defect yet.
- Recommendation/regression: isolated one-browser repeat with responsiveness timing and frame profiling, and normal-coordinate Pause recovery check. Record concurrent load before assigning higher priority.

## Other observations and limits

Industry/demand details were discoverable under optional tools. The initial freight selection still recommended two passenger coaches in explanatory copy. German operations details mixed English (`passengers`, `mail`, `activity`, `cost`, `result`, `idle`, `Time is paused`) with localized text; treat as supporting localization polish rather than a new core-play blocker. The initial station preview explained town coverage but did not itself list nearby served industry; industry context/coverage overlays were found in source but not verified in the UI, so no claim that coverage inspection is broken.

At final tick 18,317 the delivered totals were 80 timber, 21 lumber, 144 passengers and 96 mail. There were three freight revenue ledger entries: raw money amounts 3040, 1596, 3040 (30.40, 15.96, 30.40 NOK), versus freight roster cumulative cost 3,684 NOK at day 16. This short seeded scenario is loss-making; no claim of a balancing bug is made because operation duration and seed infrastructure confound an economic assessment. Final raw cash was 484,498,341 (4,844,983.41 NOK) and exactly equaled opening cash plus all ledger entries. No negative stock/cargo was observed in captured snapshots.

Reached: fresh menu, free-play freight UI discovery, fixture-backed purchase, ordered route, assignment, timber loading, actual movement, sawmill unloading, lumber loading and town delivery, repeated timber delivery, pause recovery. Not reached: building the whole network from empty, a user-built freight terminal, direct UI coverage overlay/context inspection, profitable freight operation, save/reload. The coordinator requested ending after bounded performance evidence rather than extending the strained session.

No browser console errors or page errors (`ERRORS []`). Closed context and browser in `finally`, process exited 0 and logged `CLOSED`; no server started/stopped. Only assigned report/script/evidence files were created. No application or existing test files changed, no delegation, no commit/push.

Evidence directory: `artifacts/swarm/evidence/p06-freight-veteran/`. Inspected screenshots used above are 02, 04, 05, 06 and 09; 05 was scrolled below the purchase preview and should not be cited as visual proof of its price. Read-only final evidence is `final-evidence.json`. Interactive harness: `artifacts/swarm/scripts/p06-freight-veteran.mjs`.
