# P01 — guided German first railway

Simulated first-time, 10-year-old-inspired interaction constraints: concrete goal, short instructions, click exploration, no assumed railway vocabulary. This is not testing with actual children or a claim about children.

- Baseline: coordinator build at http://127.0.0.1:5190, 2026-09-22.
- Chrome channel, headless, fresh de-DE context, 1280 × 800, default scale (no zoom changes).
- About 7 minutes, approximately 36 successful gameplay actions plus DOM reads/screenshots and 6 bounded automation failures.
- Used visible UI text, accessible DOM, screenshots, actual clicks/selects and mouse drawing only. No application source, prior tests, fixtures, command dispatch, state injection, probe or camera/time helpers. The 8× button was used normally.

## Journey and actual outcome

1. New game → guided introduction. Accessible name of the guided button differs from visible title; a role lookup by visible title initially timed out, then the accessible snapshot supplied “Neue Gesellschaft mit Einführung starten”. This was harness recovery, not a demonstrated human blockage.
2. Opened first station planner. Its ready-to-build default preview was near Sundvik. Used “Zum Ort ausrichten” toward Granli, then built the NOK 25,000 halt. Guidance advanced to step 2.
3. Opened second station planner. Preview automatically targeted Granli. Selected Sundvik as orientation target, aligned, and built the NOK 25,000 halt. Cash: NOK 4,950,000. No manual placement was necessary; both were actual purchased stations.
4. Opened route planner, chose “Von: Sundvik”, and “Alles zeigen”. Drew an actual mouse stroke through visible terrain: (300,300) → (350,340) → (430,405) → (535,475); selected “Nach: Granli”. The preview returned a 2.94 km, 2.3% surface route with no bridge/tunnel at NOK 541,219. Recovery: Undo returned to drawing; Redo restored the route. Built it. Cash: NOK 4,408,781; guided step 5 reached.
5. Bought recommended steam locomotive and two passenger coaches, NOK 180,000. Guided mode had prefilled Sundvik/Granli stops. Created shuttle line and assigned train. Guided step 7 reached.
6. Clicked “Zeit fortsetzen und Zug folgen”, then 8×. Saw actual moving train at up to 80 km/h. Initially carried 48 mail and zero passengers; later carried 96 passengers plus 48 mail. Revenue reached NOK 4,656; first-arrival completion panel appeared and introduction ended.
7. Paused via the visible pause control after locator trouble; saved, reloaded browser page, and selected “Weiterspielen”. Day 13, paused, cash NOK 4,228,541 and campaign 2/3 were preserved. Objectives showed towns 2/2 and passengers 200/200. Profit objective remained 0/10,000; did not inspect accounting deeply enough to interpret that against the individual train/line profit.

Achieved: completed guided introduction, two stations, user-drawn built route, purchased/assigned/operating train, passenger arrivals, save and reload. Not reached: campaign profit target, third settlement, freight, electrification, station expansion or long-term profitability.

## Finding P01-F01 — P3 — English finance labels in German operations panel

**Classification:** confirmed localization bug, nonblocking.

**Environment:** 1280 × 800, German, default scale.

**Steps:** Complete the above guided station/route/train/line workflow; open “Züge & Linien”; scroll to “2 · Halte wählen” and the created line summary.

**Expected:** German finance labels consistent with the train summary (“Einnahmen”, “Kosten”, “Ergebnis”).

**Actual:** line summary reads “Einnahmen 4.656 NOK · cost 3.971 NOK · result +685 NOK”. During initial assignment, the train select also exposed “Zug 29 · idle”. Map industry names also remained “Granli Forest” / “Sundvik Sawmill”; whether those are intentionally proper names was not established.

**Evidence:** inspected screenshot `artifacts/swarm/evidence/p01-young-novice/06-complete-german-labels.png`, plus repeated DOM reads before and after running. The screenshot visibly contains “cost” and “result”.

**Reproducibility:** repeated within this single journey, before and after revenue. No independent fresh-game rerun.

**Recommendation:** translate line finance labels and user-facing train state values. This particularly helps a novice who relies on short familiar words.

**Suggested regression:** German operations view with an assigned train/line asserts German finance and status labels; English locale continues to use English.

## Observations and limitations, not confirmed product defects

- At 1280 × 800 station orientation controls were below the initial visible portion of the planner. Playwright scrolling made them reachable. This agent completed the journey but cannot infer that a young novice would discover every control unassisted. Screenshot `02-station-planner.png` shows the initially visible portion.
- At 8× with the operations panel open, `getByText(/Einnahmen .*cost .*result/).scrollIntoViewIfNeeded()` once failed “Element is not attached to the DOM” and another time timed out. `getByRole('button',{name:'Pause',exact:true}).click()` timed out after resolving the visible stable pause button. A screenshot also timed out. Clicking the known visible pause location (1074,745) recovered, and subsequent reads/screenshots/save worked. These occurred under up to three concurrent agent browsers and are **not evidence of isolated single-player performance failure**. No P1 is asserted. One unrelated scroll timeout used uppercase “LINIE 31” while accessible text apparently had different casing; that was a harness selector error.
- Opening/closing panels and stage changes can update between immediate text/screenshot captures. `01-guided.png` was captured during transition and still shows the menu; do not treat it as guided-game evidence.
- Cash changed exactly as expected for the two station purchases and route construction; ongoing expenses/revenue changed the running balance. Paused save/reload preserved the final observed balance exactly. No data-loss symptom observed.
- The long scrollable operations panel exposed several sections at once, but the short guided actions and automatic stop prefill were sufficient to complete the task in this run. No enjoyment or comprehension claim is made.

## Evidence and cleanup

All screenshots cited here were opened and visually inspected. `03-route-start.png` shows clear start/target geography; `04-route-preview.png` shows drawn control points and actual quoted cost; `05-train-running.png` shows the train and 8× state; `07-reloaded.png` shows the preserved day, cash, station/track and campaign progress after reload.

Browser page errors: none (`errors: []`). Console warnings/network errors were not collected, so no claim about them.

Harness: `artifacts/swarm/scripts/p01-young-novice.mjs`. Protocol deviation disclosed: the first non-TTY invocation immediately received stdin EOF and closed its browser before play. Restarted the same harness with a TTY in a new fresh context. There was only one active browser at a time. Both invocations closed in `finally`; the final process exited 0 and printed `BROWSER_CLOSED []`. Context and listeners were disposed with the browser. No app edits, source inspection, server changes, subprocess leftovers, commits or other agents.
