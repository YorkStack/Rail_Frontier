# P05 — keyboard-first experienced player

Simulated experienced computer user aged 70, preferring keyboard navigation and readable controls. This is an interaction constraint, not an actual participant or a claim about older people. Baseline fb5f666, immutable server http://127.0.0.1:5190; English; viewport 1280×800; 125% interface scale for gameplay. Approximately 9–11 minutes and 270 keyboard actions including redundant navigation; one diagnostic selectOption action, zero pointer gameplay actions. No application source or existing tests read.

## Achieved journey

- Opened Settings with Tab/Shift+Tab/Enter. Controls had visible focus outlines. Native scale select did not change with ArrowDown, Space/ArrowDown/Enter, or repeated arrows in this headless macOS Chrome session. Used `selectOption('1.25')` once to establish the requested scale; this was diagnostic assistance, **not keyboard success**. Later type-ahead `g` on the station-facing select worked. The native-select result alone is insufficient to claim an application defect.
- Started New game → Guided introduction through keyboard. Activated Show station tool. The preview began at a buildable Sundvik site, removing a pointer placement requirement. Typed `g` in Face a settlement, used Align toward settlement (55°), and built the NOK 25,000 halt using Enter.
- Used guided station tool for the second halt. It previewed a valid Granli location. Built with Enter. Cash moved from NOK 5,000,000 → 4,975,000 → 4,950,000.
- Opened track tool, tabbed to From: Sundvik and To: Granli, activated both with Enter. After route validation, tabbed through route alternatives and engineering controls to Build for NOK 524,331. Visible focus ring and auto scrolling kept the build action accessible at 125%. Built the 2,934 m alignment; cash NOK 4,425,669.
- Opened Railway Office, bought recommended Nord 2-6-0 with two coaches for NOK 180,000. Two ordered stops were present. Created route 47, assigned train 45, and activated Resume and follow train. Advanced to tutorial step 7 and ran at 8×. Connect settlements advanced to 2/2. Train initially carried 48 mail and 0 passengers. Passenger delivery/first fare completion was not reached during bounded exploration.
- Saved with keyboard. Opened Game menu, navigated Return to main menu → Save & leave. Dialog correctly focused Save & leave. After save completion, reloaded the page (browser lifecycle action), then used Tab/Enter on Continue latest. Recovered Day 4, paused, cash NOK 4,244,814, step 7, 2/2 connected settlements. The recovered amount exactly matched the pre-exit paused amount.

## Findings

No confirmed P0–P2 defects in the completed keyboard journey.

### P05-01 — P3 UX friction: tutorial route instruction omits the working keyboard route

Environment: English, 1280×800, 125%.

Steps: Build both guided stations. Read step 3 “Plan the railway.” Open Show track tool, then use Tab/Enter on From: Sundvik and To: Granli.

Expected: Instruction gives keyboard users an actionable way to proceed or directs them toward the available endpoint buttons.

Actual: Tutorial says “Drag from a highlighted station end to draw your route. Release at the other station. You can reshape the line by dragging its handles.” This implies pointer work, although the planner's From/To buttons successfully build an end-to-end railway entirely by keyboard.

Evidence: Actual keyboard activation produced a valid 2,934 m alignment, followed by successful construction for NOK 524,331. The inspected `keyboard-build-focus.png` shows visible build-button focus. This is confirmed wording friction, not a keyboard gameplay blocker. Observed once in this complete guided journey; deterministic text. Recommendation: mention “choose From and To in the track tool” alongside dragging. Suggested regression: keyboard-only guided station→From/To→build journey, plus assertion that step 3 guidance includes the endpoint-button path.

## Focus and accessibility observations

Menu, station controls, endpoint buttons, construction confirmation, train purchase, route creation, assignment, and save/exit dialogs were reachable and operable by keyboard. Railway Office use initially involved extra tab cycles because I continued tabbing after the interface had automatically focused the next useful control. Inspection confirmed auto-focus on Resume and follow train after assignment; these extra cycles are tester error, not a reported application defect.

Some rapid focus logs briefly showed BODY text between dynamically rebuilt route-stop controls. This was transient, not isolated or reproduced, and did not block completion. No confirmed focus-loss bug is asserted. At 125%, the track planner scrolls; focusing Build brought it clearly into view. Arbitrary route-handle editing and manual station repositioning by keyboard were not tested and are not claimed supported.

## Evidence inspected

All paths are under `artifacts/swarm/evidence/p05/`:

- `settings125.png`: inspected after overwriting with actual 125% selected; larger Settings typography and visible select focus.
- `first-station.png`: inspected. Captured during a transition: station built and success toast visible while tutorial/cash had not yet repainted. Subsequent settled DOM showed step 2 and NOK 4,975,000. Do not use the transient old cash/tutorial text as evidence of a bug.
- `keyboard-build-focus.png`: inspected; bright outline around Build for NOK 524,331 at bottom of scrolled planner.
- `recovered.png`: inspected; Day 4, paused, NOK 4,244,814, step 7 and 2/2 settlements after full reload and Continue latest.

## Limits and cleanup

No page errors captured. Console/network errors were not separately instrumented. No write probes, state injection, camera helpers, source diagnosis, or fixtures used. No negative cash or unexplained duplicate purchase observed. Passenger revenue, tutorial completion, charter completion, third settlement, free-play station positioning, and fine route reshaping were not reached/tested.

The initial non-TTY runner received stdin EOF and exited through finally before interactive testing; the actual journey ran in one fresh headless Chrome context. There was never more than one P05 browser active. Actual context closed and `BROWSER CLOSED` confirmed from finally. No application/server changes, commits, or delegated agents. Own helper: `artifacts/swarm/scripts/p05-keyboard-older.mjs`.
