# U01 — onboarding critique

Critical game-reviewer perspective, not a real publication/person or measured enjoyment study. This worker previously ran P09 and A02 because of the coordinator's agent-thread limit. Prior knowledge of menus, route-choice buttons and basic operation concepts carries over; the review is not an independent unfamiliar-player result. This session used one **new fresh headless Chrome/context with no reused saves**, German, 1440×900, default scale/DPR 1, frozen `fb5f666` on 5190. PROTOCOL/MATRIX reread. Approximately six minutes of useful gameplay plus reporting, roughly 30–35 UI actions.

## Critical assessment supported by this journey

The guided path is practically usable: I built both stations, connected them, purchased the recommended train, created/assigned a shuttle, carried the first 28 passengers, and saved/reloaded the completed introduction without a blocker. No P0/P1 onboarding defect was observed. The first impression communicates setting, era, beginner difficulty and passenger-rail goal without forcing the player through an information wall. New Game clearly separates guided and free play; Construction School is a separate, discoverable option. This is an assessment of this UI, not a prediction of how novice humans will perform.

The strongest onboarding mechanism is actionable defaults. “Bahnhofsplanung öffnen” focuses the requested settlement and provides a valid prepared placement quote; I could orient toward the other settlement and build for 25,000 NOK. The second station behaves similarly. The route planner has named endpoint buttons, and the service panel prepopulates the two stops after purchase. This keeps a meaningful railway moving forward while allowing optional terrain/profile/stock detail. The visible “Passt zum Bahnsteig und ins Budget” check helps connect the 52 m train with the 90 m platform. The UI explicitly says what is only a preview and what spends money.

The weaker element is continuity between instructions and views. The tutorial describes drawing from a marked rail end while the next panel says choose a station sign; both work as concepts, but the presentation changes vocabulary just as the camera is still close to the second station. The objective card, tutorial card, tool panel and persistent action toast also offer overlapping layers of instruction. Most did not prevent progress here; stale run/pause wording is the one directly contradictory observed case below.

## Actual journey and invariants

- Initial menu → Neues Spiel → Geführter Einstieg. Step 1 visible with 5,000,000 NOK and simulation paused.
- Bahnhofsplanung öffnen → Tipp. Read placement explanation, selected Granli as direction and clicked Zum Ort ausrichten, then built default Sundvik halt for 25,000 NOK. Step 2 appeared; cash 4,975,000 NOK.
- Step 2 action focused Granli and quoted another 25,000 NOK. Selected Sundvik direction, aligned and built. Step 3; cash 4,950,000 NOK.
- Open route planner. Only Granli framed initially. Used visible Alles zeigen, selected Von:Sundvik and Nach:Granli. Accepted direct land route 2.93 km/1.9% grade at 524,331 NOK. Built; step 5 appeared with 4,425,669 NOK. Step4 was passed by building the valid quote, not separately reviewed as a stable screen.
- Bahnbetrieb öffnen; recommended Nord 2-6-0 plus two passenger coaches, total 180,000 NOK, 52/90 m fit. Purchased. Stops Sundvik/Granli prefilled. Created line, assigned train and clicked Zeit fortsetzen und Zug folgen. Selected visible 8×.
- Reached step 7; first trip initially carried mail. On return service, visible operations row showed 28 passengers and 48 mail; after delivery objective showed 28/200 passengers and tutorial disappeared. This verifies completion by real service, not manual dismissal. No source/probe/state helpers were used.
- Paused day 8, saved at tick 9,230 according to toast, reloaded browser and Weiterspielen. Restored day 8, paused, 28/200 passengers, 2/2 settlements connected and 4,243,971 NOK, with tutorial absent. Objective remained 1/3; the 200-passenger/profit campaign goals were not completed.

## U01-01 — P2: first route instruction opens a one-station view

**Classification:** confirmed UX friction, not a blocked task. German 1440×900/default scale; observed once in this journey.

**Reproduction:** follow guided steps 1–2 with default town placements, then click step 3 Streckenplanung öffnen.

**Expected:** a first connection tutorial should frame both newly built stations or clearly make the framing action its next instruction.

**Actual:** camera stays close to Granli; only its Start hier sign is visible. Tutorial had just instructed the player to draw from a marked end to the other station. The tool offers both endpoints in buttons and “Alles zeigen,” so I recovered immediately by clicking Alles zeigen before choosing endpoints. This is a discovery tax, not an inability to build.

**Evidence:** inspected `route-start.png` shows only Granli with both endpoint buttons and Alles zeigen.

**Recommendation/regression:** first opening of guided route stage should frame the two bound tutorial stations; preserve intentional player framing on subsequent reopen. Verify both signs fit the usable map region at 1440×900 after default station construction.

## U01-02 — P3: German operations row leaks English economy/state terms

**Classification:** confirmed localization defect; German 1440×900/default scale, repeated in line row as train finances changed.

**Steps:** buy recommended train, create/assign shuttle, inspect operations line card.

**Expected:** German train and line finances use the same Kosten/Ergebnis terms.

**Actual:** train row is German, line row reads “Einnahmen 384 NOK · cost 1.697 NOK · result −1.313 NOK.” Immediately after train purchase the assignment selector also exposed “Zug 45 · idle.” These are understandable to a bilingual reviewer but inconsistent terminology in the first operation lesson.

**Evidence:** inspected `operations-copy.png` displays cost/result; accessible DOM captured idle earlier. No source diagnosis performed.

**Recommendation/regression:** localize dynamic line finance and train status strings, and cover a German assigned service with nonzero income/cost in UI string checks.

## U01-03 — P3: paused-assignment instruction remains after train departs

**Classification:** confirmed stale UX copy; same environment, observed repeatedly during days 3–6.

**Steps:** assign shuttle, click Zeit fortsetzen und Zug folgen, run at 8×, reopen Züge & Linien.

**Expected:** current action/status message reflects running service or expires after the assignment action.

**Actual:** live panel correctly states “Dein Zug fährt”/“Der Zug ist unterwegs,” speed 80 km/h and 28 passengers, while persistent action text still says “Zug zugewiesen. Setze die Zeit fort, wenn du bereit bist.” Toolbar simultaneously says LÄUFT. This is contradictory instruction, though the stronger live status makes the workaround obvious.

**Evidence:** accessible DOM captured live speed/status and stale text together in multiple observations; first-run screenshot confirms moving train and LÄUFT. The stale action text was not legible in that screenshot, so this claim relies on DOM observation.

**Recommendation/regression:** clear or update assignment feedback when simulation resumes. Check running service UI does not continue instructing the player to resume time.

## Coverage and cleanup

No invented enjoyment score; no claim of serious friction where only preferences/polish were observed. School alternatives, free-play onboarding, typography at enlarged scale, later campaign objectives, freight, and long-term service economics were not tested in this role. No read-only probe/source/test assistance was needed or used in U01. The terminal-like early loading DOM briefly included content from multiple app sections; judgments use settled visual screens, not that transient extraction.

All screenshots were opened and inspected: `menu.png`, `tutorial-start.png`, `station-ready.png`, `route-start.png`, `train-shop.png`, `first-run.png`, `operations-copy.png`, `restored.png` in `artifacts/swarm/evidence/u01/`.

Page-error listener: `[]`; console/network errors not comprehensively instrumented. Driver `artifacts/swarm/scripts/u01-driver.mjs` closed context and browser in finally; received `CLOSED []`, process exited 0. Browser slot explicitly released to coordinator. No app/test/server modifications and no new browser after closure.
