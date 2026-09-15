# UX-001 readability checkpoint

Date: 2026-09-15

## Implemented

- Presentation preferences use a small versioned local-storage record and recover safely when browser storage is unavailable or corrupt.
- Interface size can be selected at 100%, 125% or 150% before starting and persists across reloads. The setting changes task/control typography and spacing while leaving the Three.js landscape camera unchanged.
- German is selected from a German browser locale, English otherwise. The user can override it persistently. Main menu, save/load and the permanent build/camera toolbar have paired German and English labels.
- Essential task text starts at 14 px, main actions at 16 px, and buttons/selects use at least 44 px hit targets.
- The decorative campaign headline no longer occupies the active play view. Settlement navigation, current service and campaign objectives remain visible.
- Task panels are wider, vertically scrollable and bounded between header and toolbar. Their primary action remains reachable at 150%.
- At narrow effective viewports, including browser-zoom-like layouts, the toolbar becomes a labelled three-column grid instead of shrinking labels to icons.
- At 150%, the compact company strip shows cash/date while the objective card remains readable below it.

## Evidence and limits

The real browser run covers settings persistence, German/English switching, 150% settings and gameplay, a fully scrolled station action, a 720 px compact layout and horizontal-overflow checks. Screenshots are generated under `artifacts/evidence/ux-001`.

The existing station and route panels still describe the withdrawn track-first workflow. Their complete German/English first-service copy will be written against CON-01–03's station-first replacement so the obsolete interaction is not translated and preserved. UX-001 remains open until those paths and 200% browser zoom are verified together.
