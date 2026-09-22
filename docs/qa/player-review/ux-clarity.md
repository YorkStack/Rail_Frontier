# UX clarity review: second round

Date: 2026-09-22. Tested the coordinator's frozen first-fix preview at http://127.0.0.1:5174. Isolated Playwright installed-Chrome context, initially 1440 × 900, then 1280 × 720, UI scale 100%. All game changes used real UI controls. No application source was read, no probe mutated game state, no builds or app edits were made. Product context and Impeccable product/critique guidance informed the bounded assessment; this is not a full automated design-detector audit.

## Outcome

No new confirmed P1/P2 issue in the exercised path. OPS-01 and OPS-02 fixes pass in the guided-company journey, including a full browser reload. One remaining P3 navigation friction is documented below. Existing localization defects are visible in this frozen preview; the coordinator reports newer local changes already address these and will validate them separately.

## Exercised journey and passes

1. German fresh company → guided introduction → station planning → default Sundvik station → default Granli station. Both cost 25,000 NOK and were immediately valid. Placement now says “Bedient Sundvik”.
2. Track planning → “Von: Sundvik” → “Nach: Granli” → default checked route → build for 559,928 NOK. The route choice clearly distinguishes preview from the final purchase. Destination wording is now German.
3. Railway office → buy recommended Nord 2-6-0 with two coaches → keep prepopulated two stops → create line → assign. Exactly one train and one route were created.
4. While still paused, guidance says “Die Linie ist zugewiesen. Die Zeit ist angehalten. Setze sie fort, damit der Zug abfährt.” Service card says “Linie zugewiesen · pausiert” and offers “Zeit fortsetzen und Zug folgen”. This fixes OPS-01's false main success messaging. At 1280 × 720, activating it closes the office, follows the service, and changes time to LÄUFT. Subsequent train card showed 59 km/h and 24 NOK operating cost, confirming simulated movement.
5. Game menu → main menu → Save & leave → Load game → Resume. Reopened office correctly recognizes train 41 and route 43, shows assigned/paused guidance, and supplies the resume/follow CTA. It no longer marks purchase as the current step. This passes OPS-02.
6. Settings → English → full page reload → Continue latest → Trains & lines. The same train and assigned route remain; English guidance says “The service is assigned. Time is paused. Resume time to let the train depart.” The service card and resume CTA remain available. This covers loss of transient selection state beyond a menu-only load.
7. Scroll office → Resume and follow train → reopen office. RUNNING is visible and office changes to “Your service is running” / “Travelling to Granli”. The saved service resumes without buying a second train.

Evidence: `artifacts/player-review/ux-clarity/01-station-de.png`, `02-train-purchase-de.png`, `03-assigned-paused-de.png`, `04-assigned-paused-de-1280.png`, `05-follow-running-de-1280.png`, `06-loaded-office-de-1280.png`, `07-reload-office-en-1280.png`, `08-reload-office-scroll-en-1280.png`, `09-resumed-office-en-1440.png`.

## UX-CLARITY-01 · P3 · Reopening an existing service hides its next action below completed setup forms

**Reproduction:** Create and assign the guided service; Save & leave; Resume, or full reload → Continue latest; open Trains & lines at 1280 × 720.

**Expected:** The current service and its resume/follow action are immediately reachable near the loaded-service summary; completed train purchase and a new route editor are secondary.

**Actual:** The office starts at its top. The top guidance correctly says the service is assigned and paused, but the visible controls are the purchase station, locomotive, service, and car selectors. The operational CTA is below the full purchase section and an empty stop editor. Its bounding box was x=907, y=1444, width=308, height=44 while the visible office ended at about y=619. The user must scroll more than a panel-height through completed setup to act on the status instruction. Normal wheel scrolling reaches it, and it works; this is friction rather than a progression blocker.

**Evidence:** `07-reload-office-en-1280.png` shows the initial viewport; `08-reload-office-scroll-en-1280.png` shows the lower action after scrolling. German load exhibits the same structure in `06-loaded-office-de-1280.png`.

**Recommendation:** Put the active service summary with resume/follow CTA immediately below the step summary, or collapse completed purchase/route-creation forms behind “Buy another train” and “Create another route”. Keep those advanced actions available without making them the first visible actions on returning to an existing service.

## Existing P3 observations, not new blockers

- This frozen preview still includes English details in the German office: Coach, SEATS, UPKEEP, day, TRAIN/ROUTE, running, revenue/cost/result, passengers aboard, shuttle explanation, and English success feedback. “2 coachs” remains in English. These duplicate ONB-01 / OPS-03 scope; coordinator owns newer fixes.
- The status toast after starting time still says to resume time, because it retains the preceding assignment message. Main time status and service guidance update correctly, so this did not prevent progress.
- The guide's paused hint says “The simulation is paused while you build” after loading the completed service. Its primary instruction correctly says resume time; this is imprecise supporting copy rather than contradictory primary guidance.

## Limits

This was a bounded first-service audit, not a freight, multi-route, multi-train, accessibility, keyboard-only, mobile, or full economic-simulation test. No clipping blocked the tested controls at either viewport; scrollable office content is intentionally taller than the viewport. No claim is made that all accessibility or overflow cases pass. The inspector's follow behaviour was observed through camera/UI and subsequent service speed/cost, without mutating a test probe. One locator timeout came from the exact accessible button name including an icon/space; a regex matching the visible label worked, so this is not reported as a product defect. The isolated browser was closed at the end.
