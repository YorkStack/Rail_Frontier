# P09 — construction lesson progression

Simulated returning player with age-10-inspired curiosity, already familiar with the first railway; this is agent testing, not research with a child. Frozen baseline `fb5f666`, `http://127.0.0.1:5190`, German, 1440×900, default browser scale/DPR 1. One fresh headless Chrome/context. Approximately 9–10 minutes of play plus reporting, roughly 40–45 UI actions (excluding observations).

## Outcome and actual coverage

Completed **all four construction lessons to “Verbunden!”**, using the menu to enter valley and each visible next-lesson button thereafter. Selected endpoints through the visible start/destination buttons, compared routes, selected alternatives, and built. Did not draw a custom freehand route; endpoint choice and route alternatives are a genuine supported gameplay path. No state injection, camera/time helpers, or fixture URL. One normal 8× speed-button click occurred in the initial free company.

| Lesson | Compared and selected | Result |
|---|---|---|
| 1 · Durch das Tal | Direct 524,331 NOK versus terrain variant 523,833 NOK; chose variant | Connected; 9,426,167 NOK remaining |
| 2 · Um die Bucht | Direct 1,928,081 NOK, 1,138 m bridge versus land detour 319,196 NOK, 0 m bridge; chose land | Connected; 9,012,653 NOK remaining |
| 3 · Durch den Bergrücken | Direct 2,330,738 NOK/996 m tunnel. “Größere Umwege prüfen (300 m)” improved alternatives; chose 852,141 NOK/303 m tunnel, 1.54 km, 3.9% grade | Connected; 8,584,837 NOK remaining |
| 4 · Über das Hochland | Direct 2,026,561 NOK/924 m bridge/119 m tunnel versus third option 1,384,896 NOK/660 m bridge/14 m tunnel; chose third | Connected; 7,611,615 NOK remaining |

The route price and savings comparison was understandable. Selected-route lengths and structures changed together with the build quote. Each lesson explicitly announced 10m NOK before prepared-station costs, so remaining balances between exercises should not be compared as one continuing company. Valley's 9,950,000 NOK after stations minus 523,833 NOK visibly became 9,426,167 NOK. Other prebuild balances were hidden while the planner was open, so their precise quote-to-ledger deltas were not measured.

The inlet/ridge/highland completion cards clearly explained that those practice stops do not serve settlements and can support test runs, avoiding a misleading promise of passenger demand. Train purchase, route assignment, actual operation and fare delivery were **not** attempted in any lesson.

## P09-01 — P0: saved company overwritten after leaving to menu, entering school, then saving practice

**Classification:** confirmed loss of the original saved company in this journey; loss of substantial railway assets is an inference from the same source path, not directly tested here. P0 follows the protocol's destructive/data-loss category. Viewport/language/scale as above.

**Steps observed:**

1. From initial menu, Neues Spiel → Freies Spiel. Let it run briefly, select 8×, click Spiel speichern. Toast reported saved at tick 612, balance 5,000,000 NOK.
2. Spielmenü → Zum Hauptmenü → Speichern & verlassen. This explicit save-and-exit completes successfully.
3. Bauschule → Gleisbau ausprobieren. The menu promises the current company is saved before switching.
4. Build valley, click next to inlet, build inlet, next to ridge, build ridge, next to highland, build highland.
5. Spielmenü → Zum Hauptmenü → Speichern & verlassen, then Spiel laden.
6. Archive contains **four** entries: latest “Norwegian Fjords company” at 11:48, and three identical “Gesellschaft vor Gleisbauübung” entries at 11:46, 11:45, 11:44. The initial free-company save from 11:43 is absent.
7. Open oldest entry using Fortsetzen. It is the completed valley company with 9,426,167 NOK and tick 0, not the original 5,000,000 NOK/tick 612 free company.
8. Reload browser and Weiterspielen. Latest universal save restores completed highland with 7,611,615 NOK. Original company still has no archive entry.

**Expected:** the saved original company remains independently recoverable after practicing, including when the user first chooses Save & leave.

**Actual:** practice advancement preserves the preceding practice companies, but the saved original company is overwritten by a later practice save. The original company in this run had no stations/trains, so the empirically lost progress is that saved free session and its elapsed time, not a built railway.

**Evidence:** inspected `saves.png` shows exactly four entries; oldest entry visibly restores valley. After the obstacle was observed, read `tests/browser/construction-lessons.spec.ts` (and baseline version) for disclosure; it checks that a backup label exists, not that the original company survives this flow. Then inspected baseline `src/main.ts` using `git show fb5f666:src/main.ts`: `leaveCompany` sets `playerCompanyActive=false` after save-and-leave; `startDrawingPractice` archives only if that flag is true; `save()` always writes slot `study`. This explains the observed loss. Current-tree rg was used only to locate those symbols; diagnosis uses the frozen baseline.

**Reproducibility:** once in this complete journey, plus independently consistent baseline control flow. Not rerun with a built original railway.

**Recommendation/regression:** preserve save identity per company or archive the previous `study` before a different practice company can overwrite it. Add a browser regression that builds a distinctive original asset, Save & leave → start school from the menu → save practice → reload archive, and loads both original and practice with original assets/cash intact. Cover the no-active-company/menu path, not only next-lesson transitions.

## P09-02 — P2: practice archive names hide which lesson will resume

**Classification:** UX friction, confirmed once with three saved practice companies; same viewport/language/scale.

**Steps:** complete valley→inlet→ridge→highland, then open Spiel laden.

**Expected:** distinguishable lesson names or a compact summary of each saved railway.

**Actual:** all three preserved practice entries are named “Gesellschaft vor Gleisbauübung”; timestamp is the only distinction. Recovering valley required choosing the oldest entry by inference. It succeeded, so there is a workaround.

**Evidence:** inspected `saves.png`. The loaded oldest slot showed “1 · Durch das Tal · Verbunden!” and the matching 9,426,167 NOK.

**Recommendation/regression:** include completed lesson name and optionally day in automatic archive labels. Verify saved valley/inlet/ridge appear with distinct localized names.

## Persistence and assistance disclosure

Valley archive restoration succeeded. Full browser reload → Weiterspielen restored the final highland company and completion state. A final read-only `window.__railProbe.snapshot()` confirmed highland cash 761,161,475 minor units (display 7,611,615 NOK), opening cash 1,000,000,000, tick 0, two stations, 13 edges, three ledger entries. A separate read-only snapshot after loading valley confirmed its matching cash/state. No probe mutation or state setup was used. The initial attempt to find Bahnhöfe by accessible name failed because its accessible name is Bahnhof bauen; this was an automation locator correction, not an observed player blocker. One Bauschule lookup timed out because the save/leave confirmation still needed completing; recovered through its visible button.

## Evidence inspected and cleanup

All screenshots below were actually opened with `view_image` before being cited:

- `artifacts/swarm/evidence/p09/valley-start.png`
- `artifacts/swarm/evidence/p09/valley-built.png`
- `artifacts/swarm/evidence/p09/inlet-compare.png`
- `artifacts/swarm/evidence/p09/ridge-compare.png`
- `artifacts/swarm/evidence/p09/highland-compare.png`
- `artifacts/swarm/evidence/p09/saves.png`
- `artifacts/swarm/evidence/p09/highland-restored.png`

No page errors were recorded (`[]`). Console/network errors were not comprehensively instrumented. The last restored highland camera starts near Sundvik rather than framing its construction; this was observed but not pursued as a separate finding. All four construction stages reached; service stages not reached. No app files, existing tests, or server changed. Driver `artifacts/swarm/scripts/p09-driver.mjs` uses a single browser and `finally` closes context/browser. Sent CLOSE, received `CLOSED []`, process exited 0. Coordinator-owned server untouched.
