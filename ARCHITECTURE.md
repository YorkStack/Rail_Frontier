# Rail Frontier architecture

Architecture handoff, 2026-09-13. The user clarified that **Astra and Sol are Codex models, not game engines**. Three.js 0.186.0 is the selected renderer. Vite 8.3.0 builds the browser app; strict TypeScript implements the independent core. This milestone is a runnable technical study, not the finished economic game.

## Repository and scope

The originally empty local directory was populated by cloning https://github.com/YorkStack/Rail_Frontier. The original commit 66d6bb9 held README and MIT LICENSE only. Branch: architecture/foundation. Existing MIT copyright 2026 York remains unchanged. There was no existing application infrastructure to replace.

Core production candidates live in src/domain, world, rail, simulation, persistence and application. Scene composition and automatic demonstration operation live explicitly in **spikes/fjord-renderer.ts** and **spikes/study-state.ts**. src/main.ts boots this study with src/ui/study.css. Sol must implement the actual application service and command-driven game, reusing the validated kernels. Do not mistake demonstration shuttling or its prepared graph for a implemented player economy.

## Boundaries and stable modules

| Layer / files | Owns | Actual state |
|---|---|---|
| domain/model, operations, curve-math | Serializable records, SI coordinates, IDs, content contracts and math | Implemented types; operations fields validated but economic systems pending |
| world/terrain, random, profiles | Authoritative triangular heightfield, seed stream, biome parameters | Implemented; fjord-study supplies a representative 4 km generator |
| rail/geometry, constraints, planner, graph | Cubic alignment, arc length, validity, engineering and routing | Implemented/tested |
| simulation/clock, motion | Fixed tick, traversal-distance motion | Implemented; physical traction, occupancy and transfers pending |
| application/ports, snapshot | Commands, storage, render boundary and frozen UI snapshots | Contracts and snapshot implementation; dispatcher pending |
| persistence/save, indexeddb | Schema 2, 1→2 migration, validation, durable slot backend | Implemented; production slot management/autosave UI pending |
| rendering/terrain-mesh, track-mesh | Meshes derived from simulation geometry | Implemented proofs reusable by production renderer |
| spikes/fjord-renderer | Actual Three.js camera/assets/instancing/water/LOD/benchmark | Validated study adapter; not general campaign renderer |

Dependency rule: simulation never imports Three.js, DOM, IndexedDB or UI objects. All renderer identities, GPU buffers, caches, wall timestamps and camera poses are ephemeral. Domain cross-imports between model/operations are type-only, with no runtime cycle. UI commands validate and commit atomically through GameApplication. snapshotState returns a detached recursively frozen snapshot. Render interpolation must never write into authoritative state.

## Engine selection and browser delivery

Three.js was selected for direct procedural geometry, existing glTF loading, instancing, raycasting and independent simulation integration. A full physics/game engine is unnecessary for graph-constrained rail motion. WebGL2 is the current baseline, not WebGPU. Vite produces a static site; no backend is required for single-player. Browser target is initially desktop Chrome, validated locally on Apple M2 Pro. Other devices/browsers require compatibility testing before support claims.

Actual installed APIs and behavior were inspected. See RENDERING_CAPABILITIES.md. Fonts are locally packaged OFL assets; no remote font request is required. A dedicated Three.js chunk is about 637 KB minified / 160 KB gzip. The build's default 500 KB advisory is retained and documented, not suppressed. Total initial distribution is comfortably under the 5 MB target; see PERFORMANCE.md.

## Coordinates and terrain agreement

Right handed simulation in metres: X east, Y up, Z south. Northwest corner is (0,0,0); sea is Y=0. Float64 simulation positions, Float32 GPU vertices; no vertical exaggeration. Study map: 4,000 × 4,000 m, 20 m cells (201² vertices), generator version 2. The planned Norway campaign remains 16 km square / 25 m cells; production content placement is a later task.

Blender source +Z up / +Y forward exports to glTF +Y up / −Z forward through (x,z,−y). Exporter converts once; Three.js receives identity scale without another axis rotation. Coupler and axis marker tests pass in the actual importer. Floating origin is not necessary for the current 4–16 km scale; if introduced, it belongs only in the renderer.

Terrain queries and rendered triangles use the **same NW→SE diagonal**. Each cell is a pair of planes, not bilinear interpolation. Four runtime raycast samples differ from Float64 queries by at most 0.00000742 m. Heightfields copy their source data; external mutation cannot change the surface. Water masks/forest/urban cost factors share TerrainSample; current Heightfield implements elevation and constant water level, with material masks pending production content work.

Heightfield.curveBreakpoints isolates cubic crossings of X/Z grid lines and diagonals using derivative-monotone root isolation, including tangencies. Planner splits again at clearance and water boundaries using each triangle's plane. This detects narrow hazards even when the rail arc table has only endpoint samples. Arbitrary Terrain implementations cannot be approved unless they implement equivalent certified intersection analysis; current planner deliberately rejects non-Heightfield construction.

## Rail geometry, engineering and routing

Graph nodes are logical connections; graph edges own cubic Bézier control points, endpoints, speed limits and owner. Crossing lines do not connect automatically. Each edge endpoint matches its node within 1 mm. Routes hold oriented edge traversals. Compiled arc tables and RailNetwork adjacency/heap are derived caches. Rebuild the network once when graph revision changes; reuse it for all queries. The snapshot isolates geometry from later graph mutation. Routing minimizes free-running time, with stable ID tie ordering.

Cubic Bézier centerlines give explicit endpoint/tangent control. Adaptive de Casteljau compilation limits local control-polygon span to 5 m and local flatness to 5 mm. Train position samples by arc distance, not raw curve parameter. The conservative derivative-hull constraint checker certifies ≤4% grade, ≥100 m horizontal radius and nonzero horizontal derivative; it rejects unresolved intervals rather than approving sparse samples. It also rejects actual midpoint violations early. tangentCompatible verifies direction and slope agreement within 0.015 rad. Construction must use this at connected endpoints, reversing curve orientation where necessary.

No clothoid solver is required for the first low-speed line. Use connected cubic segments and limit speed by curvature. True transition easements and banking are deferred upgrades, not prerequisites for this slice. Conservative rejection may reject feasible alignments; explain that in preview rather than weakening constraints.

Rail elevation is a design profile, not terrain draping. Engineering intervals classify >6 m clearance/water as bridge, >4 m burial as tunnel, otherwise ground/earthworks; 2 m clearance above water is mandatory. Surface and classification roots yield contiguous spans, and engineeringSpans merges adjacent identical types. Portal positions are span boundaries. Current demo portals use equivalent sampled transitions; production placement must use exact spans. Short sliver spans and bridge structural design remain construction-policy work (minimum bridge 4 m, tunnel 12 m; absorb a shorter shallow ground gap into the neighboring engineered span only if revalidated).

Prototype cost rates are minor currency units/metre: ground 12,000, bridge 120,000, tunnel 180,000, plus clearance/material costs. They are balance parameters, not market estimates. Quote is recomputed against current graph/world before any debit. Store built spans, construction total and daily maintenance in operations.infrastructure. Do not derive old asset book cost from a newly rebalanced rate.

Track rendering is hybrid: continuous rail/ballast strips, instanced sleepers/piers/trusses/portals, simplified far-view line segments. Logical distances and connectivity do not depend on render LOD. Actual imported wagon follows the actual compiled graph, including reverse movement and endpoint dwell in the study.

## Timing, commands and simulation sequence

20 fixed steps per second (0.05 s). Speeds 0/1/2/4/8. Catch-up is capped per render call but time debt is preserved. Pause never drains debt. Render interpolation uses previous/current poses; clock fractional time is not saved. Browser visibility loss pauses and resets the wall reference; the user resumes explicitly, with no offline income. RAF timestamps can precede setup timestamps; driver clamps negative elapsed time to zero (regression found and fixed during browser tests).

Economic interval: 1,200 ticks = 60 simulation seconds = one compressed economic day. 30-day accounting months and 360-day years are intentional game-time simplifications; SI train motion still uses seconds. Production tick sequence is fixed: ordered commands → route/edge reservations → force/braking → motion → arrival/dwell/transfers → daily demand/industry/maintenance → objectives → publish snapshot. Seeded simulation randomness uses its saved Mulberry32 state. Vegetation uses a separate stream and cannot change economic outcomes.

CommandEnvelope has a monotonic sequence. Handler requires sequence=lastCommandSequence+1, validates on a working state and commits state+sequence together only on success. Failed commands leave state unchanged. Ownership and IDs are allocated by the application, never supplied by arbitrary UI input. Rail anchors may be existing nodes or new positions. See application/ports.ts. Actual command handlers are the first Sol tasks.

## Train/economy/occupancy contracts

VehicleDefinition fixes mass/power/tractive-force/speed/length/capacity/cost fields. StationDefinition fixes coverage/storage/platform capacity and costs. IndustryRecipe fixes consumed and produced quantities and tick interval. OperationsState now holds destination demand, service stop cursor/direction, condition/age, running-cost remainder, reservations, constructed spans/costs, industry cycle progress, delivery totals, completed/rewarded objectives, monthly accounts and command sequence. These fields persist in schema 2; implementing the systems does not require ad-hoc render state or new identities.

Train traction: F=min(tractiveForceN,powerW/max(v,1)); subtract rolling resistance 0.002×mass×g and mass×g×signedGrade, divide by mass and integrate fixed dt. Brake using min(line/vehicle/curve speed, sqrt(2×0.6×distanceToStop)); clamp at destination and consume residual edge motion correctly. Wagons sample prior route history at cumulative coupler distances. Keep enough oriented traversal history while any coach occupies an edge. Derived history can be reconstructed from service route+direction and current path; reservations remain until the tail clears.

Initial safety: one exclusive reservation per edge, station holds, deterministic train-ID priority, no overlapping occupied edge. Reserve the full next single-track corridor to the next station before departing; release behind the tail. A fully occupied bidirectional corridor waits with clear feedback. No train should drive into a deadlock; advanced blocks/platform selection/signals are deferred. Reservation validation prevents duplicate edge grants; the scheduling system is not yet implemented.

Economic formulas and conservation/transaction rules are fixed in ECONOMIC_CONTRACT.md. No real passenger revenue, freight transfer, city growth or purchase UI is implemented in this milestone. These are routine implementation tasks after handoff.

## Saves and evidence

Schema 2 stores all authoritative state and operations. Version 1 migrates explicitly to 2 by initializing operational state; old state is validated and migration must advance exactly one version. Future versions, invalid references, disconnected movement, nonfinite values, conflicting reservations and inconsistent ledger/spans fail before adoption. IndexedDB uses atomic slot transactions. Details and known hardening tasks: SAVEGAME_FORMAT.md.

28 core tests, 2 browser integration tests, Blender structural checks and production build pass at handoff. Browser tests cover runtime import, close/far LOD, survey validity, pause/speed, exact save/browser-reload/load state, responsive viewport and GPU-resource baseline after replacement and explicit WebGL context release on disposal. Separate 5k-edge/100-train CPU and 20k-tree/100-proxy rendering benchmarks reduce scale risks; full economy/occupancy performance remains a later integration gate. The architecture is ready for Sol, while the complete passenger vertical slice remains unfinished by design.
