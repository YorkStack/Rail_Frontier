# First-play construction review

Reviewed 2026-09-22 against the stable build at http://127.0.0.1:5174 (root identifies commit ed66975). Independent new-player pass: German UI, desktop mouse and keyboard, 1440 × 1000 CSS-pixel viewport, isolated headless Chromium using installed Google Chrome. No application source or tests read before play; no state injection, application edits, broad tests, or user browser changes.

## Confirmed findings

### P2 — Closing the planner discards its comparison choices

Reproduced twice, once after click drawing and once after drag drawing.

1. Main menu → Bauschule → Gleisbau ausprobieren.
2. Select Von: Sundvik.
3. Click terrain at viewport (350, 355), then (555, 493), then select To: Granli. Keep initial camera and viewport.
4. Wait for the three alternatives. The first is 581,988 NOK; tunnel detour is 1,984,808 NOK; land detour is 759,504 NOK.
5. Press Escape, then click the bottom Gleise button (accessible name Gleise bauen).
6. The draft still appears at the correct 581,988 NOK, but the list contains only “1 · Aktuellen Entwurf behalten”. The tunnel and land alternatives have disappeared.

Expected: an ordinary close/reopen preserves the completed comparison for an unchanged draft, or clearly explains that it must be recomputed. Actual: the available decision changes without any explanation, despite retaining the draft and selected price. This impedes exploratory players who leave the panel briefly before committing.

“Größere Umwege prüfen (300 m)” remains available after reopening. It offers another search, but is not labeled as restoring the lost comparison. No claim that the chosen route or price is lost.

Evidence: [before Escape](../../../artifacts/player-review/construction/14-before-escape.png), [after reopening](../../../artifacts/player-review/construction/15-after-reopen.png).

### P3 — Destination action switches to English within German construction instructions

1. Start the first lesson, then click Von: Sundvik.
2. German instructions ask the player to click the destination sign, while the panel button says “To: Granli”. The map sign correctly says “Ziel hier · Granli”.
3. The second lesson similarly uses “To: Nordufer”.

Expected: “Nach:” or “Ziel:” consistently with the German UI. Meaning is recoverable from the station name, so this is not a blocker.

Evidence: [destination selection](../../../artifacts/player-review/construction/02-start.png).

## Passed observations

- Fresh menu makes Bauschule and the four lessons discoverable. The first lesson explicitly explains station choice, click/drag drawing, and destination completion.
- Initial station labels are readable and separated in the first two lessons at the tested viewport.
- Click-based route from Sundvik to Granli using the above intermediate points is valid and buildable.
- Click-point undo and redo buttons work. No unexpected charge occurs while selecting alternatives.
- Dragging from (192, 245) through (350, 355), (555, 493) to (750, 675) also yields the same 581,988 NOK buildable route. The destination is recognized at release.
- Selecting the first lesson's tunnel alternative updates its total to 1,984,808 NOK; the 1,402,820 NOK premium agrees with the displayed baseline. Tunnel length and gradient appear on selection.
- Escape closes the planner; reopening preserves the selected route and cost, subject to the comparison-loss finding above.
- Committing the first lesson route succeeds, shows “Verbunden!”, deducts exactly 581,988 NOK (9,950,000 → 9,368,012 NOK), and offers train assembly and the next lesson.
- The second lesson explains the bridge versus western-shore tradeoff. Direct Südufer → Nordufer offers a 1,927,917 NOK route with 1,138 m of bridge and a 319,032 NOK land alternative, an accurately shown 1,608,885 NOK saving.
- Selecting the land option updates its route, summary, and build total. Selecting the direct bridge again and clicking “Brücke · 1074 m · Lösungen prüfen” opens a local bridge comparison with clear full-route pricing and baseline explanation. The route being compared remains visible.
- The train panel prevents buying a train at an unconnected station and explains why.

Selected evidence: [click preview](../../../artifacts/player-review/construction/03-click-route.png), [drag preview during validation](../../../artifacts/player-review/construction/05-drag.png), [completed first route](../../../artifacts/player-review/construction/06-built.png), [bay lesson](../../../artifacts/player-review/construction/08-bay.png), [bay direct route](../../../artifacts/player-review/construction/09-bay-direct.png), [land detour](../../../artifacts/player-review/construction/10-bay-detour.png), [local bridge options](../../../artifacts/player-review/construction/12-bridge-results.png).

## New-player assessment and limits

The first build is understandable and achievable from visible instructions. The chosen route and its monetary consequence are clear. The cost comparison in the bay lesson makes a consequential engineering choice understandable without technical knowledge. There were no confirmed P1 construction blockers in the exercised paths.

The review covers two lessons and one committed route. The bay route was compared but not committed. Reverse-direction station entry, mountain lessons, complex invalid geometry, mobile/touch, keyboard-only construction, saved-game reload, and operating the resulting train were not tested. Existing tests were not consulted or run.

No follow-train action was discoverable in the simple UI before owning a train. The visible overview control and train panel were inspected; pressing F after closing the planner had no visible effect. This is recorded as a coverage limit, not a confirmed broken follow feature or shortcut. Broader mixed English labels appeared in optional train tools, outside the assigned construction scope.

Some asynchronous transitions outlasted an early 3-second automation timeout; actions did subsequently complete. No performance defect is claimed from those automation timeouts. The first Node REPL lost its isolated browser binding on an automation timeout; remaining work used a separate owned Node process. This affected test tooling, not the product verdict.
