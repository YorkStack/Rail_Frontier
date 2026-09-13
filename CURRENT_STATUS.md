ASTRA_PHASE_COMPLETE=true
RECOMMENDED_MODEL=SOL
ASTRA_REVIEW_REQUIRED=false

# Current status — passenger implementation, 2026-09-13

Current milestone: architecture is complete and the Sol implementation pass is active. The user continued from IMPLEMENTATION_PLAN.md. The actual renderer remains Three.js; Astra and Sol refer only to Codex models.

## Implementation completed after handoff

- Production RailFrontierGame and GameSession with ordered atomic command commits, detached frozen snapshots, fixed-tick RAF interpolation, visibility pause, safe load replacement and complete disposal.
- Safe-integer finance service with ledger reconciliation, category signs, overdraft/overflow rejection, exactly-once command replay behavior and saved fractional train running costs.
- Versioned 16 km Norway heightfield with deterministic fjord/valley relief, sea, forest/rock/urban masks, authoritative settlement elevations and a stable seeded fingerprint.
- Construction handler with live terrain quote/revision checks, funds, engineering span persistence, terminal tangent checks, endpoint junction splitting, inherited infrastructure cost/upkeep and disconnected interior crossings.
- Station content, rail/ground placement and deterministic closest town coverage.
- Original Norway steam locomotive and coach content, atomic train purchase, connected route validation and route assignment from the train's current station.
- Physical train simulation with consist mass/power/tractive force, signed grade, service braking, exact station arrival, dwell, shuttle reversal and revision-owned graph caching.
- Deterministic edge reservations prevent opposing trains from sharing track and expose blocked service state.
- Destination-weighted daily passenger demand, capacity-bound oldest-first boarding, distance-tracked delivery, exactly-once fares, daily maintenance and monthly capital/operating reports.
- Connected-town, delivered-passenger and operating-profit campaign objectives with once-only completion.
- Transactional save manager covers manual/autosave, list/latest/delete, content compatibility and failure-preserves-session behavior. The browser shell now saves manually and autosaves daily.
- The visible fjord shell now runs RailFrontierGame rather than the demonstration clock. Live cash, date, passenger delivery, route result, service phase/speed/cargo, speed controls and camera controls read immutable snapshots. Surveyed parallel alignments can be committed through the real construction command and update rendering/cash immediately.
- A responsive main menu now presents the Norway campaign, new/continue flows, settings and credits. Its company archive creates named manual slots and can resume, rename or confirm-delete any slot; unavailable browser storage produces recovery guidance without changing the running company.
- The live HUD presents all three campaign goals from authoritative objective progress and marks completed goals directly from persisted completion state.
- Players can now pick two terrain points for a free straight alignment, snap to existing rail nodes, review engineering spans/cost/errors and commit or cancel through the real construction command. A separate map-pick station tool validates rail proximity, ground level, occupancy, funds and settlement coverage before purchase.
- The railway office now exposes consist purchase, two-stop route creation and stopped-train assignment through the command gateway. It also shows consist/cargo/service state, town demand, per-route result, reconciled cash/income/outgoings and recent ledger entries.
- The visible renderer now uses the deterministic 16 km Norway heightfield, production biome, 28,000 instanced trees, expanded settlement dressing, scaled fog/light/camera bounds and the full three-town corridor. The former 4 km scene remains only as an isolated architecture fixture.
- Every owned train is rendered. The initial service visibly combines a procedural steam locomotive with two Blender-exported GLB coaches; car placement samples distance behind the locomotive across graph legs, and load replacement hides absent consists.
- Responsive desktop/mobile layouts were visually checked. The regional and train-follow views were captured against the production world at roughly 56–57 FPS on the current machine.
- 67 Node tests and 5 real browser tests pass. Asset validation and the production build pass.

## Completed work

- Original repository cloned safely; MIT license preserved. Independent TypeScript simulation/rail/terrain/persistence foundation retained.
- Three.js 0.186.0 + Vite 8.3.0 browser study with 4 km seeded fjord terrain, forest, settlements, water, animated waterfall strip, track, bridge, tunnel portals and a graph-driven Blender wagon.
- Pan/orbit/zoom/tilt, WASD, focus/follow/regional camera; pause/1×/2×/4×/8×; explicit hidden-tab pause; RAF startup timing regression corrected.
- Actual Blender 4.0.2 → GLB → Three.js pipeline proven: axes, metres, pivots, couplers, finite normals, materials and close/far LOD with hysteresis.
- Triangle-exact terrain queries/rendering, cubic root isolation for terrain/water/engineering boundaries, conservative curve grade/radius/cusp certificate and tangent continuity.
- Immutable RailNetwork adjacency/min-heap/geometry cache; isolated frozen snapshots; fixed application, economic, vehicle/station/industry and operational-state contracts.
- Schema 2 plus strict 1→2 migration and semantic validation; real IndexedDB browser save/reload/load/resume with exact state equivalence.
- **67 Node tests and 5 browser tests pass**. Type check, Blender asset checks and production build pass. Browser tests also fail on console warnings; the removed Three.js shadow option was corrected to PCFShadowMap.
- Actual 5k-edge/100-query and 100-train movement kernel tests; local rendering scale test with 20k trees, 2k buildings, 100 train bodies and 5k strategic rail segments. Around 60 FPS on Apple M2 Pro / Chrome 153 at 1440×900. Full economy/occupancy is not part of that benchmark.
- Resource replacement returns to baseline; final disposal releases geometries and explicitly releases the WebGL context. License/font notices included in production distribution. Documentation, backlog and compact benchmark evidence updated.

## Currently working

Next: execute QA-001 as an empty-network player journey, then begin the first timber production chain.

Read ARCHITECTURE.md, IMPLEMENTATION_PLAN.md, DATA_MODEL.md, ECONOMIC_CONTRACT.md, SAVEGAME_FORMAT.md, DECISIONS.md and ASSET_PIPELINE.md. The plan marks architecture gates complete and explicitly identifies existing kernels to reuse.

## Stable contracts

- src/domain/model.ts + operations.ts: SI state, typed IDs, command sequence, operational/cargo/finance/content records.
- src/application/ports.ts + snapshot.ts: UI command/storage/render boundary and detached frozen state.
- src/world/terrain.ts + domain/curve-math.ts: triangle surface and exact crossing rules.
- src/rail/geometry.ts, constraints.ts, planner.ts, graph.ts: cubic/arc/traversal/quote/cache rules.
- src/simulation/clock.ts: 20 Hz fixed steps, preserved time debt and compressed calendar contract.
- src/persistence/save.ts: schema 2 and versioned migrations; indexeddb.ts: atomic slot backend.

Do not casually change units/axes, graph identity/connectivity, tick cadence/order, typed IDs, command atomicity or saved operational semantics. A genuine redesign follows ASTRA_ESCALATIONS.md; there is no open escalation now.

## Known limits and remaining product work

The preview commissions its first railway, stations, service and rolling stock automatically, although every passenger-operation command is exposed through the UI. QA-001 still needs a separate empty-network player journey. The complete Blender-authored production asset kit also remains; the current locomotive is procedural while the coaches use the validated Blender GLBs.

Conservative curve rejection, simple procedural art, one-chunk terrain/culling, short local performance samples and incomplete public-import/storage hardening are documented in TECH_DEBT.md. The default Vite 500 KB chunk advisory remains: Three.js is ~637 KB minified / 160 KB gzip; total initial payload stays below the 5 MB budget. No warning is suppressed.

## Git state and reproduction

Branch: implementation/passenger-slice. Remote: https://github.com/YorkStack/Rail_Frontier. The implementation branch starts from architecture checkpoint **3e65484**. No push, deployment or main-branch modification has been performed.

Development: npm ci; npm run dev → http://127.0.0.1:5173.
Production preview: npm run build; npm run preview → http://127.0.0.1:4173.
Checks: npm run check; npm test; npm run validate:assets; npm run test:browser.
Benchmarks: npm run spike; npm run spike:network. Browser tests use installed Google Chrome.
Blender generator: see ASSET_PIPELINE.md; generated GLBs are tracked so running the app does not require Blender.

The remaining work is now predominantly implementation rather than architecture. You can switch from Astra to Sol at this point to reduce token usage. After switching, tell Codex to continue from IMPLEMENTATION_PLAN.md.
