# U04 — Critical inclusive-layout review

Reused the P10/A03 worker for a separate role with fresh Chrome browser/context/storage. Baseline fb5f666 on port 5190, English. This is a focused agent review, not a real older-person study, assistive-technology certification or full WCAG audit. Approximately 5 minutes, 12 logged action/inspection batches; keyboard sequences include sixteen Tab presses.

## Findings

### U04-01 — P2: large interface leaves only a single line of station controls on narrow screens

Corroborates P03's cramped station panel, with an important additional breakpoint. New menu → Settings → Interface size 150% → Campaign → New game → Guided introduction → Stations, at **390 × 844**. Panel is x12/y80, width366, height503.69. Its independently scrolling body is only **52.94 px high**, enough for one line of the initial instruction. Actual class, orientation and alignment controls are hidden far below this tiny scroll window while the fixed heading and purchase footer dominate the panel. The inspected `narrow-station150.png` shows this directly. No horizontal document overflow (390 px viewport and scrollWidth390).

At 1280 × 720 and 150%, body is **126.56 px**, corroborating P03. `desktop-station150.png` was inspected. Keyboard Tab does bring individual controls into the scroll window, so this is not an absolute input block, but mouse discovery and reading are very poor.

Expected: a useful minimum scrolling region for actual station decisions. Recommendation: compact title/instructions at narrow width as well as short height, preserve commit accessibility and test the usable body area. A rule only covering max-height800 misses the 844-high narrow case. Regression: 390×844/150%, 1280×720/150%, verify orientation/class are discoverable and usable without a single-line viewport.

### U04-02 — P3: accessible name differs from visible primary start choice

Visible control says **Guided introduction**; its overriding aria-label is **Start new company with introduction**. A role lookup by the visible phrase did not find it; corrected lookup by its actual accessible name/ID worked. This is a concrete naming inconsistency relevant to voice-control and screen-reader consistency, not a tested failure of those technologies. Other captions also differ from their accessible wording, e.g. Stations versus Build station. Recommendation: include the visible phrase in the accessible name or let the existing button text name the control. The primary start choice is the clearest candidate. Low priority; no purchase/state error.

### U04-03 — P3: reduced-motion setting reflects OS preference only after reload

In Settings, `page.emulateMedia({reducedMotion:'reduce'})` changed the emulated OS preference after load. The visible preference remained OFF. Reloading with the same media setting correctly showed ON. This verifies initial preference detection, but suggests live preference changes are not reflected. Did not measure all camera/animation paths, so no claim that every animation violates reduced motion. Recommendation: document for polish; if live settings are supported, subscribe to matchMedia changes and update the status. No duplicate in-game toggle is required by this finding.

## Positive observations

- Default 1440×900 menu controls measured 44 px high; primary construction toolbar controls 52 px high. Clock controls are 38×44 px; station close control is 44×44 px. The woodland checkbox visual is 18×18, but the clickable label area was not separately measured, so no target-failure claim.
- Interface sizes 100%, 125% and 150% selectable; 150% survives reload. At 390×844 settings wrap and vertically scroll with no horizontal document overflow. Inspected `narrow-settings150.png` shows readable enlarged labels and selects.
- Keyboard station sequence: Placement tips → class → orientation → rotate left → rotate right → facing settlement → align → commit. Focus outlines were present (`auto` for summary, `solid` for tested form controls). Keyboard navigation remained possible despite U04-01.
- The solid commit button's rendered foreground/background contrast measured approximately **7.71:1**. Calculation converted computed Lab colors via a one-pixel canvas to sRGB and applied relative-luminance contrast. This applies to that control only; it does not certify translucent scenery-backed text, disabled controls or the entire UI.
- While the main settings menu was open, Tab after its final control passed through document/world canvas then returned to menu navigation; underlying gameplay action buttons were not entered in the eight-step sample. No keyboard trap or accidental purchase observed. Did not assert a complete modal focus audit.
- Reduced-motion preference is correctly detected on fresh load/reload.

## Limits and cleanup

No full railway built and no screen reader, voice-control product, touch device, color-vision simulation or exhaustive contrast scan used. 125% was exercised in Settings, not claimed as a full game walkthrough. Zero page errors. One initial guided-start locator had the naming mismatch above; application activation itself worked.

Own script and session JSON under `artifacts/swarm/scripts/u04-inclusive-layout-critic.mjs` and `artifacts/swarm/evidence/u04-inclusive-layout-critic/`. All three referenced screenshots were inspected. Browser/context closed in finally and printed CLOSED; EOF ended the readline runner; pgrep confirmed no matching process. No app, tests, server or user profile changes.
