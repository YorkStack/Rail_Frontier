# Fresh player review: German guided introduction

Date: 2026-09-22. Preview: `http://127.0.0.1:5174`, stable build reported by coordinator as `ed66975`. One independent novice-style session in an isolated, fresh Chromium context (installed Chrome channel), 1440 × 1000, headless. No application implementation or existing tests were read before or during this attempt. All game actions used visible UI controls; no game-state probes or mutations were used.

## Outcome

**Passed from new company through first passenger fare and automatic introduction completion. No observed P1/P2 progression blocker.**

1. Opened Neues Spiel → Geführter Einstieg.
2. Followed Bahnhofsplanung öffnen and accepted the valid Sundvik preview, Haltepunkt, default 0° direction, 25,000 NOK.
3. At step 2 opened station planning and accepted its Granli preview, also default 0° and 25,000 NOK.
4. Opened Streckenplanung öffnen, selected Von: Sundvik, then To: Granli. Two valid Bahnhofsbogen / Über Land candidates appeared. Selected default candidate: 3.03 km, 2.0% grade, 559,928 NOK. Built it successfully.
5. Opened Bahnbetrieb, accepted the recommended Nord 2-6-0 plus two passenger coaches, 180,000 NOK; the UI showed that its 52 m length fit the 90 m platform and its price fit the budget.
6. Retained the automatically populated Sundvik / Granli stops and Pendelverkehr, created the line and assigned the train.
7. Clicked Zug begleiten and 8×. The first trip earned 384 NOK carrying mail; a later passenger delivery produced 1,398 NOK cumulative revenue at approximately 6 km travelled, and the guide disappeared with “Einführung abgeschlossen. Du kannst deine Gesellschaft jetzt frei weiterspielen und speichern.”

## Observed findings

### ONB-01 — P3: German flow contains English functional copy

Reproduce by following the sequence above with the default German UI. The following English strings were visible in German controls, feedback, or train information:

- Station preview: `Serves Sundvik`, `Serves Granli`.
- Route destination choice: `To: Granli`, after the localized `Von: Sundvik` start choice.
- Train purchase: `steam`, `Coach 1`, `Coach 2`, `SEATS`, `UPKEEP`, `260 NOK / day`.
- After purchase: `TRAIN 41`, `2 coachs`, `empty`, `revenue`, `cost`, `result`, `already added`, `REMOVE`, and `✓ Nord 2-6-0 passenger consist purchased.`
- Line creation: `ROUTE 43`, `0 trains`, and `✓ Shuttle route created.`
- Assigned train: `running`, `1 train`, `0 passengers aboard`, `The shuttle reverses automatically at each end.`, and `✓ Train assigned. Service is now running.`
- Follow inspector: `train 41`, `shuttle service`, `Running`.

Expected: consistent German for controls and operational explanations. Actual: a German novice encounters English instructions precisely when learning the unfamiliar train/route relationship. This did not prevent progression in the simulation.

Evidence: `artifacts/player-review/onboarding/03-station-tool.png`, `08-track-start.png`, `10-train-purchase.png`, `11-line-assigned.png`, `12-service-running.png`.

### ONB-02 — P3: Assigned service is described as moving while paused

Reproduce: buy recommended train, create the default shuttle, assign it, and leave the initial pause in place. Panel says “Dein Zug fährt,” “Der Zug ist unterwegs,” and “Zug zugewiesen. Der Betrieb läuft.” The same screen shows PAUSIERT and 0 km/h. The guide correctly says “Starte die Zeit,” so a recovery instruction exists.

Expected: distinguish ready/assigned service from actual movement and identify the action to start time. Actual: success text suggests movement has already begun.

Evidence: `artifacts/player-review/onboarding/11-line-assigned.png`.

## Suggestions, not confirmed bugs

- Step 1 asks to rotate the platform toward Granli. The initial close view shows Sundvik only, and a bare 0° slider offers no destination direction cue. Consider a bearing hint or stating that the suggested placement/direction is already usable. I accepted the default because the preview said Baubereit; the railway then built successfully. Evidence: `02-guided-start.png`, `03-station-tool.png`.
- The operations panel shows purchase, stop editing, and assignment together. After assignment its continued empty stop-editor prompt can distract from the successful service card. Consider collapsing completed sections during onboarding. This was not a blocker; normal button interactions scrolled the panel to the active controls. Evidence: `11-line-assigned.png`.
- In the 1440 × 1000 screenshot, secondary route/assignment instructions and small actions such as Halt hinzufügen are markedly smaller than the main body text. A later UX audit should verify readable font sizes and contrast. This review did not measure those CSS values or claim a standards failure.

## Positive evidence

- New-game entry clearly distinguishes the guided introduction and free play.
- Both station previews are valid immediately, show settlement coverage, price, and a clear confirmation action.
- Starting/destination station buttons allow route planning without precision canvas manipulation.
- Route alternatives show cost, difference, distance, grade, and the separate build confirmation.
- The train purchase defaults match the tutorial recommendation and explain platform/budget suitability.
- The guide prepopulates the two correct shuttle stops, then tells the player to retain them.
- The guide advances automatically after each major action and completes after actual passenger revenue.

## Automation limitations and scope

Playwright's bundled headless executable was absent; the installed Chrome channel was used with a new isolated profile. Several initial locator attempts used visible text where an explicit aria-label differed (`Geführter Einstieg` → `Neue Gesellschaft mit Einführung starten`; `Diesen Zug kaufen` → `Zug kaufen`). These were recovered by reading the accessibility tree and are automation observations, not player blockers. A redundant attempt to add a stop after purchase found that the tutorial had already supplied both stops; the existing stops were retained. No failed route or lost money resulted.

No save/load, free-play, custom track drawing, third settlement, mobile layout, or screen-reader walkthrough was covered. No application files were changed. The coordinator owns durable acceptance tests; this review adds no test infrastructure.

After the success evidence was captured, an optional attempt to pause and inspect the operations summary timed out twice in Playwright (5 s, then 20 s). The second trace reached a visible/enabled/stable Pause button and completed scrolling, but the click did not finish. No reliable cause was established; this is recorded as an automation/performance uncertainty, not a confirmed UI blocker. The isolated browser was then closed.
