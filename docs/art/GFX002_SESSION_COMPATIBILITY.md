# GFX-002 — world and session compatibility

Completed 2026-09-14. This gate prepares versioned terrain replacement; V2 remains disabled until GFX-003.

`src/content/registry.ts` resolves a save from campaign ID, campaign version and generator version, then validates the complete V1 world descriptor including seed, biome, dimensions and cell size. Unsupported or altered combinations reject before terrain or scene publication.

`src/application/session-host.ts` stages replacement in this order: strict save validation → content resolution → matching heightfield generation → paused game construction → off-screen renderer construction and asset load → active-session publication → old scene disposal. If preparation or asset loading fails, the candidate is disposed and the old game/renderer remain active.

`FjordRenderHost` owns one WebGL renderer/context for the canvas. Individual `FjordRenderer` scene adapters own controls, listeners, geometry, materials and asset instances while borrowing that renderer. A successful switch prepares the new scene on the same context and disposes the previous scene only after publication. Final application disposal releases the scene and then the shared context.

The browser bootstrap now uses mutable active-session references, so UI commands, frame updates, selection, save handlers and diagnostics address the published game and renderer after a switch. Save writes are serialized and drained before publication. Autosave initiation is suspended during the short switching window. Successful loads restart paused, reset frame timing and select the neutral overlay. A failed candidate does not replace state or create a second WebGL context.

Validation:

- 81 Node tests pass, including staged success, failed asset preparation and unknown/modified content cases.
- `tests/browser/session-switch.spec.ts` saves and reloads exact V1 state, observes one unique WebGL context before and after replacement, and verifies a registry-rejected save leaves the paused live state untouched.
- Existing runtime asset/camera/save and renderer-disposal browser tests pass using the shared context.
- TypeScript check passes. No save-schema, terrain, economy or vehicle-value change was made.

Proceed with GFX-003: register V2 as distinct campaign/world content and leave this V1 entry available for existing saves.
