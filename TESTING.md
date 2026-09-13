# Testing

Run `npm ci`, `npm run check`, `npm test`, `npm run validate:assets`, `npm run spike`.

Validated 2026-09-13: strict TypeScript check and 18 Node tests pass. Tests cover terrain borders/interpolation/copy isolation, straight and curved lengths, invalid curves, route direction/disconnection/weighted alternatives, endpoint validation, engineering classification and rejection, 30/144 FPS clock equivalence, 8×/pause/backlog, multi-edge reverse motion, populated fixture save/reload/continuation, malformed/future/dangling saves, money reconciliation, stale IDs and arrival/path invariants.

Asset test reads generated GLBs and checks coordinates/scale, applied transforms, attachments, accessors, counts, material and size budgets, and lower LOD triangle count. Reproduce exports with the command in ASSET_PIPELINE.md. No renderer-based test has run. No console/performance test can run until the engine and browser harness exist.

The populated save fixture supplies construction, stations, train/coach, route and passenger state directly. It verifies deterministic persistence, not player commands, finance spending, boarding or fare payments. Mandatory end-to-end regression remains open: start → construct rail/stations → purchase locomotive/coaches → create route → advance through loading/delivery/revenue/expenses → save → browser reload → load → compare → continue. Do not mark this acceptance test complete based on the fixture.

Next tests: malformed terrain masks; minimum curve radius/grade extrema/junction continuity; transactional insufficient-funds rejection; finance overflow; commodity conservation; exactly-once passenger fares; braking and dwell; reservation conflicts; campaign objectives/rewards; save migrations; IndexedDB quota/corruption; browser camera/input/picking; asset visual normals/LOD transitions; renderer resource disposal and sustained performance.

Vertical slice gate additionally requires an attractive 3D Norway environment, three settlements, understandable live construction preview, visible train operation, responsive HUD, speed controls, save slot UI and no major browser console errors. All gameplay/browser criteria are pending.
