# P04 — Regular strategy player, German free play

Baseline: `fb5f666`, frozen server `http://127.0.0.1:5190`. Simulated regular strategy-player perspective (20–35), not actual human research. German, 1440×900, 100% UI scale, headless installed Chrome, fresh context. About 7 minutes of useful play and roughly 45 successful gameplay actions, plus DOM reads and bounded locator retries.

## Journey and reached state

Started at campaign menu → Neues Spiel → Freies Spiel, without guided introduction. Deliberately opened Züge & Linien first: purchase correctly unavailable, with a clear instruction to build/connect a station. Opened Gleise next: the visible “Zuerst einen Bahnhof bauen” action recovered directly to construction.

Selected Kleiner Bahnhof (45,000 NOK) rather than default halt, aimed Sundvik toward Granli using the visible orientation selector/button, then committed. Tried train purchase again: the UI correctly explained that the existing station still needed a track connection. Selected Granli through the town list; that opened town information, so reopened Bahnhöfe, aimed its small station toward Sundvik and committed. Both placements used the offered town-centered preview; no coordinate/state injection.

Opened Gleise, chose Von: Sundvik → Nach: Granli, compared the displayed alternatives, and accepted the first direct overland route: 2,884 m, 2.4% maximum grade, 507,759 NOK. No bridge/tunnel was needed. The direct route's evaluation completed successfully. Purchased Nord 2-6-0 with two passenger coaches for 180,000 NOK. Purchase supplied the origin stop; adding the next stop produced Sundvik → Granli. Created the shuttle line and assigned the train. Switched to 8× using the actual speed button, inspected company finances, then returned to the train panel. Observed an operating train, 84 passengers and 48 mail aboard, revenue 1,329 NOK, and “Erste Fahrgäste angekommen.”

Paused through the visible Pause button, saved, reloaded the page, chose Weiterspielen and waited for asynchronous load completion. Exact read-only snapshot comparison before/after: tick 9,278, cash 422,159,347 minor units (4,221,593.47 NOK), two stations, one train, one route, 63 delivered passengers and 48 delivered mail. All matched; pause remained active. End state: day 8, first connection objective complete, 63/200 passenger objective, profit objective incomplete. The train had begun its return trip. No bankruptcy, failed command debit, or duplicated purchase was observed.

Not reached: final 200-passenger/profit targets, third-town expansion, manual terrain waypoint/drag routing, station relocation, freight service, electrification, upgrades or late-game profitability. No claim of coverage for those systems.

## Findings

### P04-01 — P2 UX friction: purchasing/construction hides current cash

- **Classification:** Confirmed UI behavior; usability recommendation, not a broken purchase or accounting rule.
- **Environment:** German, 1440×900, 100%.
- **Steps:** Fresh free play → Bahnhöfe (or Gleise / Züge & Linien) → inspect the build/purchase preview and surrounding HUD. Compare with closing the panel, or viewing Betrieb → Geschäftsbericht.
- **Expected:** The current funds remain easy to compare with the station/track/train price while making that purchase decision.
- **Actual:** Current cash disappears while the construction/operations panel occupies the right side. Station and track prices are shown; train purchase says it fits the budget, but the remaining total is not visible alongside them. I had to leave the decision view to inspect funds. The cash display reappears when the panel closes; company finances also supply it.
- **Evidence:** Inspected `artifacts/swarm/evidence/p04-regular-freeplay/01-station-ready.png` shows the station cost and no funds; `02-operating.png` shows the cash card once the panel closes. Repeated across station, track and train views.
- **Recommendation:** Keep a compact funds value in the purchase footer or visible HUD; optionally show projected balance after the quoted cost.
- **Suggested regression:** At desktop dimensions with each construction panel open, verify a visible formatted current cash value alongside the price, without overlap or clipping.

### P04-02 — P3 confirmed localization gaps in German company/route information

- **Environment:** German, 1440×900, 100%.
- **Steps:** Build two stations and a passenger service → Betrieb → read station rows, waiting passengers and business ledger; also inspect the created route row under Züge & Linien.
- **Expected:** Descriptive gameplay labels are German consistently with the surrounding panel.
- **Actual:** Station summaries use “catchment” and “stored”; town summaries use “passengers”, “mail”, and “activity”; the route account row uses “cost” and “result”; ledger rows show “Train running cost”, “Station daily maintenance”, “Track daily maintenance”, and category “maintenance”. These are descriptive labels, not just proper names.
- **Evidence:** Inspected `04-german-company.png` visibly shows “1200 m catchment” and “0 / 900 stored”. DOM text reads reproduced the remaining terms before and after save/reload. `03-passengers.png` confirms the surrounding German operation flow.
- **Reproducibility:** Every relevant row inspected, including after reload.
- **Recommendation:** Route these summaries and transaction descriptions through German localization; avoid translating industry proper names unless intentional.
- **Suggested regression:** Populate a German station/route/company view and check the visible summaries and ledger descriptions for localized labels.

No P0 or P1 issue found. Alternate-order entry recovered successfully and a first service was completed without reading app code or tests. A few automation lookups required correction because visible text and accessible name differ (e.g. visible “Diesen Zug kaufen”, accessible name “Zug kaufen”); these were tool locator mismatches, not recorded as player blockers. One intermediate screenshot showed transient missing toolbar labels, but the final stable screenshot did not; this was not established as a repeatable finding.

## Evidence, assistance and cleanup

Screenshots 01–04 above were opened and visually inspected. Gameplay used clicks, selects and the normal speed/pause controls only. Accessible DOM reads were used throughout. Read-only `window.__railProbe.snapshot()` was used after passenger service to confirm delivered totals and compare paused save/reload state. No camera/time probe helpers, command dispatch, state injection, app source inspection or existing test inspection were used.

Page-error listener collected zero browser page errors. Console/network warnings were not separately collected. Own driver: `artifacts/swarm/scripts/p04-regular-freeplay.mjs` (interactive evaluator; the exact journey is documented above, not represented as a deterministic replay script).

Tooling caveat: the first browser launch was terminated before gameplay because its non-TTY stdin closed. Playwright handled SIGINT and its Node/Chrome PIDs were subsequently verified absent. Restarted the same driver with a TTY; only one browser was alive at a time. The gameplay context and browser were explicitly closed in `finally`, output `ERRORS []` and `CLOSED`, with driver exit code 0. No servers, application files or tests were modified; no agents spawned; no commits/pushes.
