# P07 — experienced network player

Baseline `fb5f666`, frozen server `http://127.0.0.1:5190`. Chrome headless, fresh ephemeral context, 1440×900, English selected in Settings, 100% UI scale. Simulated experienced-player perspective, not human research.

## Actual journey and assistance

Started at the fresh German menu, changed language through the visible Settings select, opened Campaign → New game → Free play, then Trains & lines. The empty office correctly said to build and connect a station before buying a train. No construction was attempted in this operations-focused assignment.

Then deliberately navigated to the permitted `?skip-menu=1` commissioned preview. Read the baseline operations browser test with `git show fb5f666:tests/browser/operations.spec.ts` for advanced UI field names. All purchases, upgrades, routes, assignments, speed changes, following and office navigation were real Playwright clicks/selects. Probe use was read-only snapshots/key inspection. No command dispatch, injected state, camera helper, time helper, save helper or load helper was used. The preview already supplies the initial stations, track, train and route; these are not claimed as player construction.

Paused, bought a two-coach passenger train at Fjellhavn, cleared the route draft, added Fjellhavn → Granli → Sundvik, created a shuttle, and assigned the new train to it. Upgraded Granli from Town Station to Major Terminal through Further railway tools. Ran at 8×. Bought a third two-coach train at Sundvik and assigned it to the original Sundvik → Granli → Fjellhavn shuttle. Followed a train and continued observing.

Approximately 45 successful UI actions plus about 7 failed automation attempts, ~4.5 minutes browser process lifetime. Initial failures selecting English as a button and exact-matching the icon-bearing Trains & lines button were locator mistakes, not product defects.

## Results and invariants

- Both opposing services operated. At tick 3759 train 14 was blocked at Granli waiting for edge 9 while train 19 traversed that edge in reverse. At tick 5607 train 14 was moving on edge 9, train 19 was blocked for edge 8, and the third train was running on edge 8. Waiting cleared without intervention; no persistent deadlock was established.
- Final tick 12380: three trains, two routes, 110 passengers and 96 mail delivered. Train 14 was blocked at Fjellhavn; trains 19 and 7098 were running. Reservations contained exactly one owner for edge 8 and exactly one for edge 9.
- Every train's final load was 96 passengers and 48 mail, matching the displayed two-coach capacity. No overcapacity observed.
- Purchase cost was NOK 180,000 each. Granli upgrade charged NOK 205,000, the difference from Town Station to Major Terminal. Listed platform increased from 180 m to 400 m, catchment from 1500 m to 3200 m, storage from 1500 to 10000. Highest class was shown afterwards.
- Final cash NOK 4,424,031.21. Raw opening cash 500000000 plus summed ledger -57596879 equals final raw cash 442403121 exactly. No unexplained cash creation or duplicate purchase observed.
- All three preview station layouts are `legacy-node`. The upgrade changes class and construction cost; this fixture cannot substantiate a claim about fitting a physical 400 m station into terrain. Additional platforms, junction geometry and passing-loop control are not assumed to exist.
- No confirmed core simulation bug from this session. Physical vehicle overlap was not visually established; edge reservations alone do not prove collision clearance at station nodes.

## P07-F01 — P2, confirmed interface limitation: assignment controls disappear once assigned

Environment: 1440×900, English, 100%.

Steps: open commissioned preview → Trains & lines; buy a train; create reverse three-stop shuttle; select the new train and route; Assign service; inspect Start the service and both rosters. Repeat by purchasing a third train, selecting original route, and assigning it.

Expected: an experienced player can find an explicit way to select an existing train and inspect/change its service, or a clear explanation that reassignment is unavailable.

Actual: after assignment the train/route selects and Assign service control disappear, replaced by Service is running/paused and Follow this train. The visible train and route rosters present status but no discoverable management action. Buying the third train makes the assignment form available again for the new unassigned train. No safe reassignment was reached.

Evidence: captured live body text before and after both assignments in tool transcript. Baseline `src/main.ts` `syncServiceFlow` sets `assignment.hidden = running`, where running is the selected train having a route. This explains the observed disappearance. The assessment concerns discoverability/access to existing operations, not an allegation that an offered reassignment corrupted state.

Reproducibility: observed after both new train assignments, and on the initial assigned preview service. Recommendation: expose a deliberate Manage service action after onboarding completion, with any actual reassignment restrictions stated before changing service. Suggested regression: assign two trains, reopen office, verify an existing train can be selected for management without buying another train; test actual reassignment safety separately if supported.

## P07-O02 — unconfirmed performance limitation during final follow-mode inspection

After three trains ran and Follow train was clicked, attempts to reopen Trains & lines and Pause timed out at 7 seconds. Moving the pointer and Escape did not yield a successful subsequent click. A screenshot also timed out after fonts loaded. However, body text and a final read-only snapshot were still returned, and the simulation advanced from displayed Day 8 to tick 12380. No pageerror was emitted.

This is not a confirmed reproducible product bug: one run only, concurrent headless browsers may have affected timing, and no inspected screenshot was obtained. Recommend a coordinator retest of three trains at 8× followed by Pause/office navigation, recording frame responsiveness and input timing. Do not treat the failed screenshot as evidence of vehicle overlap or frozen simulation.

## Evidence, limitations and cleanup

Evidence files: `artifacts/swarm/evidence/p07-network-veteran/before.json` and `end.json`. The initial snapshot is immediately before adding the second train; the final snapshot contains the final three-train state and full ledger. No screenshot succeeded, so none is cited as visual evidence. The interactive harness is `artifacts/swarm/scripts/p07-network-veteran.mjs`; exact actions are in the task tool transcript rather than a replay script.

Not reached: physical station construction/upgrade geometry, impossible-footprint rejection, a successful service reassignment, close visual collision inspection, manual save/reload recovery, a completed 200-passenger charter or profitability. Autosaves may have occurred in the ephemeral preview context but were not tested through load UI.

Browser pageerrors: empty array. Console warnings were not collected, so no claim is made about them. One browser was launched, context and browser closed in `finally`, harness printed `BROWSER_CLOSED` and exited 0. No app/test/server files were modified, no servers stopped, no user profiles or user saves touched.
