# UX and accessibility review, second round

Date: 2026-09-22. Read-only gameplay audit of the frozen `http://127.0.0.1:5174` preview after the three novice-player reviews. Isolated headless Chrome/Playwright context; no injected game state, saved-game manipulation, builds, commits, or interaction with Safari/5173. Inputs were visible buttons, select controls, and keyboard/mouse events. Browser closed at completion.

Scope: 1280×720 and 390×844; German and English; 100% and 150% UI size; menu/settings, dialogs, free play, construction-school route preview, keyboard route handles, and disabled controls. Applied Impeccable audit guidance; product context loaded from PRODUCT.md. DESIGN.md absent. No application edits by this reviewer.

## Reproduced findings

### P1 — Space on a focused button changes simulation speed instead of activating the button

- Steps: Start construction school. Open Game menu, press Escape. Focus returns to the canvas; press Tab twice to focus Game menu (German: Spielmenü). Press Space.
- Expected: Native button activation opens the menu, which pauses gameplay.
- Actual: No dialog opens; `#run-state` changes from `PAUSIERT` to `LÄUFT`. This makes ordinary keyboard activation perform an unrelated state-changing action.
- Evidence: `artifacts/player-review/ux-accessibility/space-focused-game-menu.png`, `keyboard-dom.txt`. Direct observation before Space: active element text `Spielmenü`, run state `PAUSIERT`; after: visible dialog count 0, run state `LÄUFT`.
- Cause location: gameplay keydown handler in `src/main.ts` around line 630; global Space handling needs to exclude native interactive targets. Parent began patching this during the audit; this result describes the frozen preview, not the updated source.
- Regression: Tab to a gameplay button, press Space, verify its action and no unrelated speed change. Also test Enter; retain Space pause when canvas is focused.

### P2 — Narrow-screen map controls have glyph-only accessible names

- Steps: Start gameplay at 390×844, either language, 100% UI size. Inspect accessibility tree for camera controls.
- Expected: Controls named Overview/Overlays, or Übersicht/Kartenebenen, independent of visible icon-only presentation.
- Actual: Accessibility tree exposes button `⌖` and button `◉`. `#overlays` lacks a descriptive accessible name; `#regional` has a title, but its glyph remains the exposed accessible name. CSS hides the text spans.
- Evidence: `track-mobile-en.png`, `mobile-dom.json`; captured pre-fix HTML of `#overlays`: `<button id="overlays" aria-expanded="false">◉ <span data-ui-copy="overlays">Overlays</span></button>`.
- Cause locations: controls in `src/main.ts` around line 227, responsive `.view-controls button span{display:none}` in `src/ui/game-shell.css` around line 35. Parent began adding localized aria-labels during the audit.
- Regression: At 390px, assert both map controls resolve by their descriptive localized accessible names in EN and DE.

### P2 — At 150% UI size the narrow-screen toolbars overlap

- Steps: At 390×844, Settings → Interface size 150%, language German. Return to railway and open Tracks.
- Expected: Expanded construction buttons, camera controls, and speed controls occupy separate space and remain readable/clickable.
- Actual: The enlarged construction toolbar grows upward while camera/speed controls retain fixed bottom offsets. Speed controls cover the top of Trains & lines/Operations buttons; camera controls cover the Stations region. At 100%, they are separated.
- Evidence: `track-mobile-de-150.png`, `mobile-dom.json`. Build buttons measured y=701–826; speed buttons y=699–743. Example Züge & Linien x=206.86–285.11 intersects Pause x=221–251. Desktop 1280×720 at150% fits (`track-desktop-de-150.png`).
- Cause location: `src/ui/game-shell.css` narrow breakpoint uses fixed `.clock-deck{bottom:98px}` and `.view-controls{bottom:100px}`, while construction text scales and wraps.
- Regression: At390×844 in both languages, check 100/125/150% setting. Assert construction toolbar rectangles do not intersect camera/speed rectangles and each control’s center hit-tests to itself.
- This is an actionable DOM layout problem even if full touch-based world editing remains unsupported.

## Passed and useful behavior

- Main menu and settings fit 390px without horizontal document overflow (body scrollWidth390). Native selects expose descriptive labels. Settings can be scrolled to lower controls.
- Focus outline is visibly clear on language selection (`settings-mobile-en.png`).
- At1280×720, 150% settings text enlarges and lower content can be reached through focus/scroll (`settings-150-desktop.png`).
- Main menu, Game menu, save-before-leaving prompt, and construction controls provide meaningful button text in EN/DE.
- Game menu initial focus goes to its close control, and Tab generally cycles between its four actions. One cycle produced a transient body focus observation, but it was not reproduced sufficiently and is not filed as a finding.
- Escape closes the Game menu. Leaving an unsaved company offers Save & leave, Leave without saving, and Keep playing.
- Construction start/destination buttons permit selecting the two prepared stations without map clicking. A route handle is reachable through Tab and retains focus after ArrowRight; its accessible label explicitly describes arrow-key editing.
- Empty track workflow explains that a station must be built first. Disabled build during calculation accompanies `Checking your route…`; undo/redo disabled states follow available history.
- At100% narrow layout, route review keeps construction cost and Build button visible while its central content scrolls (`track-mobile-en.png`).
- German route handle label was localized after reopening the planner; no persistent untranslated handle issue reproduced.

## Limits and recommendations

No claim of WCAG compliance, measured contrast, performance score, or comprehensive theming audit: this was a bounded experiential pass. Touch gestures were not exercised, and the route panel covers most of the world at390px; mobile construction usability therefore remains unvalidated. If desktop keyboard/mouse is the supported target, state that limitation explicitly while retaining usable settings and navigation on narrow windows.

One low-impact translation observation: the second German route option retained `Terrain variant`; captured in `track-mobile-de-150.png`. This is P3 copy polish, not a blocker.

Prioritize keyboard activation, descriptive map labels, then scaled toolbar spacing. Suggested Impeccable commands: harden for keyboard/labels, adapt for toolbar layout, polish after regression checks. Re-run the focused audit against the rebuilt preview after parent fixes.
