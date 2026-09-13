ASTRA_PHASE_COMPLETE=true
RECOMMENDED_MODEL=SOL
ASTRA_REVIEW_REQUIRED=false

# Current status — architecture handoff, 2026-09-13

Current milestone: architecture and technical validation complete. **Stop here for the requested Astra → Sol handoff.** The user clarified Astra and Sol are Codex models; the actual game renderer is Three.js. There is no missing engine dependency.

## Completed work

- Original repository cloned safely; MIT license preserved. Independent TypeScript simulation/rail/terrain/persistence foundation retained.
- Three.js 0.186.0 + Vite 8.3.0 browser study with 4 km seeded fjord terrain, forest, settlements, water, animated waterfall strip, track, bridge, tunnel portals and a graph-driven Blender wagon.
- Pan/orbit/zoom/tilt, WASD, focus/follow/regional camera; pause/1×/2×/4×/8×; explicit hidden-tab pause; RAF startup timing regression corrected.
- Actual Blender 4.0.2 → GLB → Three.js pipeline proven: axes, metres, pivots, couplers, finite normals, materials and close/far LOD with hysteresis.
- Triangle-exact terrain queries/rendering, cubic root isolation for terrain/water/engineering boundaries, conservative curve grade/radius/cusp certificate and tangent continuity.
- Immutable RailNetwork adjacency/min-heap/geometry cache; isolated frozen snapshots; fixed application, economic, vehicle/station/industry and operational-state contracts.
- Schema 2 plus strict 1→2 migration and semantic validation; real IndexedDB browser save/reload/load/resume with exact state equivalence.
- **28 core tests and 2 browser tests pass**. Type check, Blender asset checks and production build pass. Current browser tests also fail on console warnings; removed Three.js shadow option was corrected to PCFShadowMap.
- Actual 5k-edge/100-query and 100-train movement kernel tests; local rendering scale test with 20k trees, 2k buildings, 100 train bodies and 5k strategic rail segments. Around 60 FPS on Apple M2 Pro / Chrome 153 at 1440×900. Full economy/occupancy is not part of that benchmark.
- Resource replacement returns to baseline; final disposal releases geometries and explicitly releases the WebGL context. License/font notices included in production distribution. Documentation, backlog and compact benchmark evidence updated.

## Currently working

No active implementation work. Awaiting user model switch and explicit continuation. Do not continue routine gameplay implementation automatically after this handoff.

Next three tasks after switching to Sol:

1. APP-001: adapt the validated study bootstrap/clock/camera into the production game session shell; keep prototype composition in spikes/.
2. FIN-001: implement atomic ledger posting, spending checks, running-cost remainder and replay/overflow tests using ECONOMIC_CONTRACT.md.
3. APP-002: implement GameApplication command validation/commit and snapshot flow; then proceed through WORLD-001/RAIL-004 in dependency order.

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

The study prepares its railway and automatically shuttles a proxy. It is **not the complete playable economic game**. Actual construction commands, station coverage, locomotive/coach purchasing, traction/braking/occupancy, passenger/freight transfers, ledger posting, objectives, reports, production menus and full save-slot/autosave UX remain. QA-001's end-to-end player-action acceptance test is pending. The 16 km Norway campaign and final original art kits also remain.

Conservative curve rejection, simple procedural art, one-chunk terrain/culling, short local performance samples and incomplete public-import/storage hardening are documented in TECH_DEBT.md. The default Vite 500 KB chunk advisory remains: Three.js is ~637 KB minified / 160 KB gzip; total initial payload stays below the 5 MB budget. No warning is suppressed.

## Git state and reproduction

Branch: architecture/foundation. Remote: https://github.com/YorkStack/Rail_Frontier. Latest code checkpoint: **f712b97**, Validate Three.js fjord study and freeze simulation architecture contracts. This handoff documentation and benchmark evidence are committed immediately afterward. Working tree clean at handoff; no push, deployment or main-branch modification performed.

Development: npm ci; npm run dev → http://127.0.0.1:5173.
Production preview: npm run build; npm run preview → http://127.0.0.1:4173.
Checks: npm run check; npm test; npm run validate:assets; npm run test:browser.
Benchmarks: npm run spike; npm run spike:network. Browser tests use installed Google Chrome.
Blender generator: see ASSET_PIPELINE.md; generated GLBs are tracked so running the app does not require Blender.

The remaining work is now predominantly implementation rather than architecture. You can switch from Astra to Sol at this point to reduce token usage. After switching, tell Codex to continue from IMPLEMENTATION_PLAN.md.
