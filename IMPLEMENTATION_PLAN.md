# Implementation plan

Read CURRENT_STATUS.md first. Engine identity is unresolved; **do not start routine renderer implementation or claim Astra → Sol handoff**. No model switch is requested yet. Task status reflects actual code and tests, not only planned design.

## Completed foundation tasks

| ID | Purpose / files | Interfaces | Acceptance / tests | Dependencies | Status |
|---|---|---|---|---|---|
| DISC-001 | Clone/inspect supplied repository, preserve MIT; README, LICENSE | Git | Remote/history confirmed; no original user changes | None | Done |
| CORE-001 | Define SI records/IDs; src/domain/model.ts | GameState, RailGraph | Strict types and ID allocation test | DISC-001 | Done foundation |
| TERR-001 | Bilinear sampling; src/world/terrain.ts | Terrain, Heightfield | Finite/bounded queries, copy isolation | CORE-001 | Done |
| RAIL-001 | Compile curves; src/rail/geometry.ts | CubicCurve, TrackGeometry | Length convergence, distance sampling, degeneracy tests | CORE-001 | Done foundation |
| RAIL-002 | Weighted graph pathfinding; src/rail/graph.ts | RailGraph, Traversal | Reverse, disconnected and faster-alternative tests | RAIL-001 | Done proof |
| RAIL-003 | Engineering quote; src/rail/planner.ts | Terrain, TrackGeometry | Ground/bridge/tunnel costs, grade/water tests | TERR-001, RAIL-001 | Done proof |
| SIM-001 | Fixed time; src/simulation/clock.ts | SimulationClock | Same ticks across frame rates, speeds and catch-up | CORE-001 | Done core |
| TRAIN-001 | Graph-distance movement; src/simulation/motion.ts | MotionState | Multiple edges, reversed arrival | RAIL-002, SIM-001 | Done proof |
| SAVE-001 | Strict envelope/refs/reconciliation; src/persistence/save.ts | GameState | Mid-run fixture roundtrip and identical continuation | CORE-001, TRAIN-001 | Done foundation |
| ASSET-001 | Script two wagon GLBs; tools/blender, tools/validate-assets.ts | glTF 2.0 candidate | Blender CLI/export, bounds/axis/LOD checks | DISC-001 | Done export half |
| PERF-001 | CPU core baseline; spikes/core.ts | Geometry, Terrain, Clock | Record actual timing and avoid graphics claims | Above core tasks | Done limited |

## Architecture gates — continue with Astra

Each task is bounded to one technical proof and its documentation. Dependencies order the work; no engine-specific code before ARCH-001.

### ARCH-001 — Establish actual engine
Purpose: resolve ESC-001. Files: package.json, ASTRA_CAPABILITIES.md, DECISIONS.md, THIRD_PARTY_NOTICES.md. Interfaces: actual installed source/API, no invented methods. Behavior: inspect engine source/license/version and supported browser stack, select explicit adapter. Acceptance: known executable engine package and scene smoke test. Tests: launch/dispose scene, report actual APIs and console. Depends: user engine identity or clarification that Astra means model.

### ARCH-002 — Import probe and select runtime format
Purpose: close Blender/runtime compatibility. Files: spikes/asset-import.*, src/rendering/*, ASSET_PIPELINE.md. Interfaces: WorldRenderer proposal, actual engine importer. Behavior: load both wagon LODs, show marker axes, couplers and dimensions. Acceptance: correct metres/up/forward/pivots/materials/normals, unload releases resources. Tests: bounds plus visible lit inspection, repeat load/dispose. Depends: ARCH-001, ASSET-001.

### ARCH-003 — Terrain/track technical scene
Purpose: validate sampling, meshes and camera. Files: spikes/norway-scene.*, src/rendering/*, src/world/*. Interfaces: Terrain, TrackGeometry. Behavior: small seeded fjord with water, steep slopes, trees, waterfall, rail, bridge, tunnel portal and train proxy. Acceptance: picked/rendered terrain agrees with planner, train follows graph path visibly, orbit/zoom stable. Tests: terrain comparison points, console capture and screenshots. Depends: ARCH-002, TRAIN-001.

### ARCH-004 — Railway geometry feasibility
Purpose: verify physically buildable centerlines. Files: src/rail/geometry.ts, src/rail/planner.ts, tests/geometry.test.ts. Interfaces: CubicCurve/EngineeringQuote. Behavior: tangent-compatible junctions, minimum radius, cusps, grade extrema, terrain-cell/water boundary splits and valid portal transitions. Acceptance: reject adversarial tight/steep/hidden-water alignments without false approval; document easement choice. Tests: analytic/reference curves, narrow-ridge/water fixtures and connected-curve visual. Depends: RAIL-003; visual component ARCH-003.

### ARCH-005 — Graphics/scale budget proof
Purpose: validate major performance risk. Files: spikes/benchmark.*, PERFORMANCE.md. Interfaces: engine instancing/LOD/renderer counters. Behavior: 20k trees, 2k buildings, 100 moving proxies, 5k edges; reuse assets and camera trajectories. Acceptance: recorded p50/p95 CPU/GPU/frame data, memory stability and quality at close/far zoom; mitigation if below targets. Tests: sustained 1×/8× runs, repeated scene unload, LOD transitions. Depends: ARCH-003.

### ARCH-006 — Freeze foundation and hand off
Purpose: resolve architectural gaps before routine implementation. Files: domain/model.ts, application/ports.ts, all architecture/status docs. Interfaces: commands/snapshots, world profiles, occupancy, save/content versions, finance and demand state. Behavior: incorporate proved engine/geometry choices and missing gameplay state, specify immutable snapshot ownership and storage. Acceptance: all handoff gates satisfied by evidence, backlog implementable without redesign. Tests: full foundation suite and browser proofs; contract review. Depends: ARCH-004, ARCH-005. Then set ASTRA_PHASE_COMPLETE=true and RECOMMENDED_MODEL=SOL, present the exact requested handoff message and **stop for user**.

Handoff response must begin `ASTRA ARCHITECTURE PHASE COMPLETE`, then state architectural decisions, implemented work, actual-engine validations, Blender/tooling validations, remaining work, stable files/modules, protected contracts, implementation backlog, known risks and recommended next action. Include exactly: “The remaining work is now predominantly implementation rather than architecture. You can switch from Astra to Sol at this point to reduce token usage. After switching, tell Codex to continue from IMPLEMENTATION_PLAN.md.” Wait for the user; do not perform large-scale routine implementation automatically.

## Sol backlog — after explicit handoff and continuation

### APP-001 — Browser bootstrap and simulation driver
Purpose: start/stop a coherent game session. Files: src/application/game.ts, src/main.*, browser build config. Interfaces: SimulationClock, WorldRenderer. Behavior: RAF interpolation, fixed ticks, speed and visibility auto-pause. Acceptance: hidden-tab return produces no offline catch-up; dispose removes listeners/GPU resources. Tests: browser pause/speed/restart and console. Depends: ARCH-006.

### FIN-001 — Atomic ledger posting
Purpose: reliable construction/purchase/revenue accounting. Files: src/simulation/finance.ts, tests/finance.test.ts. Interfaces: Company, Transaction, Money. Behavior: reject invalid/overflow amounts; spending checks funds and posts once. Acceptance: cash reconciles after every command, failed commands leave state identical. Tests: overdraft, boundary integers and duplicate command handling. Depends: ARCH-006.

### APP-002 — Command gateway and snapshots
Purpose: isolate UI writes. Files: src/application/game.ts, commands.ts. Interfaces: GameApplication, GameCommand, CommandResult. Behavior: ordered command validation, atomic state changes, immutable snapshots. Acceptance: no deep UI mutation and no partial failure. Tests: stale revision, invalid references and attempted snapshot mutation. Depends: APP-001, FIN-001.

### WORLD-001 — Norway terrain generation
Purpose: reproducible playable map. Files: src/world/generator.ts, biome.ts, src/content/norway.ts. Interfaces: frozen terrain/biome profiles and seed RNG. Behavior: fjord/valleys/rocks/water/forest masks and three valid settlement sites. Acceptance: same seed/version yields same query results; towns sit on land and plausible corridors exist. Tests: seeded hash, bounds, water/settlement placement. Depends: ARCH-006.

### RAIL-004 — Commit construction and engineering spans
Purpose: convert approved preview to network. Files: src/application/construction.ts, src/rail/graph.ts. Interfaces: buildTrack, EngineeringQuote, ledger. Behavior: revalidate quote/revision, split graph at connections, persist spans, debit funds. Acceptance: affordable legal routes build atomically; unrelated crossings remain disconnected. Tests: insufficient cash, stale quote, junction/split and save roundtrip. Depends: APP-002, WORLD-001.

### RAIL-005 — Cache graph/geometry and route invalidation
Purpose: scale routing. Files: src/rail/cache.ts, graph.ts. Interfaces: graph revision, compiled geometry, Traversal. Behavior: adjacency/heap pathfinding and dirty-edge caching. Acceptance: same paths as reference algorithm; changed graph invalidates affected routes. Tests: generated graphs against reference, 5k-edge timing. Depends: RAIL-004.

### STATION-001 — Station placement and coverage
Purpose: connect demand physically/logically. Files: src/application/stations.ts, src/simulation/coverage.ts, station content. Interfaces: buildStation, Station, Terrain spatial buckets. Behavior: valid rail attachment and unique town/industry coverage assignment. Acceptance: no floating stations or duplicate demand capture; construction posts costs. Tests: off-rail rejection, overlap tie-break, funds and persistence. Depends: RAIL-004.

### TRAIN-002 — Vehicle content and purchase
Purpose: owned consist creation. Files: src/content/vehicles.ts, src/application/trains.ts. Interfaces: purchaseTrain, Train, FIN-001. Behavior: locomotive+coaches require available tech/funds and station; derive capacity/mass. Acceptance: one original steam locomotive and coach purchasable with valid IDs and no partial debits. Tests: unavailable year, no station, mixed invalid vehicles, roundtrip. Depends: STATION-001.

### ROUTE-001 — Ordered station service
Purpose: assign usable routes. Files: src/application/routes.ts, src/simulation/routing.ts. Interfaces: createRoute, assignRoute, findPath. Behavior: validate all legs; shuttle/loop service and route revision handling. Acceptance: disconnected stops reject clearly; assigned train gets logical traversal. Tests: reversed legs, repeated stops, edited graph. Depends: TRAIN-002, RAIL-005.

### TRAIN-003 — Traction/braking and station dwell
Purpose: believable movement. Files: src/simulation/traction.ts, motion.ts, station-service.ts. Interfaces: frozen train physical/phase state. Behavior: grade/mass acceleration, curve/edge speed limits, braking to stop, tick dwell and turnaround. Acceptance: no stop overshoot; heavier trains respond to gradient; movement independent of FPS. Tests: stopping distance, short edges, steep load and pause. Depends: ROUTE-001.

### TRAIN-004 — Occupancy and consist placement
Purpose: avoid collisions and render coaches accurately. Files: src/simulation/occupancy.ts, src/rendering/trains.ts. Interfaces: edge reservations, motion route history, coupler nodes. Behavior: station holds, edge reservations, blocked feedback and coaches sampling travelled path. Acceptance: opposing trains cannot share reserved edges; coaches stay on curves across junctions. Tests: conflict/release/deadlock feedback and visual reversal. Depends: TRAIN-003.

### ECON-001 — Destination passenger demand
Purpose: create transportable demand. Files: src/simulation/demand.ts, coverage.ts. Interfaces: Town, Station, demand queues, economy tick. Behavior: deterministic capped daily OD generation influenced by population/distance. Acceptance: one source of demand, bounded queues and reproducible totals. Tests: population effects, overlap, caps, cadence/save. Depends: STATION-001.

### ECON-002 — Passenger loading and delivery
Purpose: complete first revenue loop. Files: src/simulation/transfer.ts, station-service.ts. Interfaces: CargoLot, demand, consist capacity, ledger. Behavior: board correct-destination passengers, unload once, pay distance-based fare and charge running costs. Acceptance: quantities conserved, no duplicate revenue and route profitability observable. Tests: full/empty capacity, intermediate stops, reload during dwell and exact ledger. Depends: ECON-001, TRAIN-003, FIN-001.

### SAVE-002 — Transactional IndexedDB slots
Purpose: durable browser sessions. Files: src/persistence/indexeddb.ts, save.ts. Interfaces: SaveStore, frozen schema/content registry. Behavior: manual/auto slots, rename/delete/list/continue, validated load and content compatibility. Acceptance: browser reload resumes correct train phase and accounts; failed load preserves running state. Tests: fake or real IndexedDB transactions, quota/corrupt/unknown-version cases, browser restart. Depends: APP-002, ECON-002.

### CAM-001 — Objectives and campaign lifecycle
Purpose: reward measurable progress. Files: src/simulation/objectives.ts, src/content/norway.ts. Interfaces: objective definitions and progress/reward state. Behavior: connect/deliver/profit goals evaluated on ticks, rewards once. Acceptance: three initial goals progress accurately and survive reload. Tests: reconnection, repeat evaluations, exactly-once reward. Depends: ECON-002.

### UI-001 — Menu/HUD and strategy camera
Purpose: usable session controls. Files: src/ui/*, src/rendering/camera.ts. Interfaces: GameApplication, SaveStore, WorldRenderer. Behavior: campaign/new/continue/load/settings/credits; cash/date/speed/objectives; pan/orbit/zoom/tilt/focus/follow/reset. Acceptance: keyboard and mouse input work, labels readable, no terrain clipping or stuck capture. Tests: browser input/accessibility/resize/console. Depends: APP-002, SAVE-002, CAM-001. Apply relevant UI design skills when implementing.

### UI-002 — Construction/station interaction
Purpose: player-built network. Files: src/ui/construction.*, station-panel.*, picking adapter. Interfaces: previewTrack/buildTrack/buildStation. Behavior: pick controls, smooth preview with validity/cost/grade/span breakdown, confirm/cancel. Acceptance: explicit understandable invalid reasons and no money spent on cancelled preview. Tests: complete browser placement, insufficient funds, tool switching. Depends: UI-001, RAIL-004, STATION-001.

### UI-003 — Train/routes/finance panels
Purpose: make operations observable and editable. Files: src/ui/train.*, routes.*, finance.*, context.*. Interfaces: typed commands and immutable snapshots. Behavior: buy coaches, assign ordered service, inspect speed/cargo/dwell/income/cost/profit and town demand. Acceptance: user completes passenger loop entirely through UI; reports reconcile. Tests: browser purchase/assignment/selection and ledger totals. Depends: UI-001, TRAIN-004, ECON-002.

### QA-001 — Norwegian passenger vertical slice gate
Purpose: prove actual playable loop. Files: tests/browser/passenger.*, TESTING.md, CURRENT_STATUS.md. Interfaces: user UI only plus read-only assertions. Behavior: start campaign, construct rail/two stations, buy locomotive/coaches, assign route, board/deliver/pay/cost, pause/speed, save/browser-reload/load/continue. Acceptance: all directive section 68 criteria including visible attractive 3D environment, three towns, resumed train and clean console. Tests: automated end-to-end plus visual inspection and sustained performance. Depends: UI-002, UI-003, SAVE-002, ARCH-005.

### ECON-003 — Timber production and sawmill conversion
Purpose: first freight chain. Files: src/content/industries.ts, src/simulation/industry.ts, transfer.ts. Interfaces: inventory/recipe definitions, stations, cargo and ledger. Behavior: forest outputs timber, train delivers to sawmill, sawmill consumes and outputs lumber, town consumes delivered lumber. Acceptance: each inventory visible, no negative/overflow/duplicated production. Tests: conservation, full storage, starvation, freight fare and save/reload. Depends: QA-001.

### ART-001 — Original production Norway asset kit
Purpose: replace proxies after gameplay works. Files: tools/blender/*, runtime pack manifests, src/rendering/*. Interfaces: validated pipeline, couplers, LOD/material standards. Behavior: original loco/coach/station/house/tree/bridge/portal kits with reusable materials. Acceptance: budgets, scale and silhouettes hold at strategic/close camera; selected campaign lazy loads only its pack. Tests: structural plus runtime visual LOD validation and bundle/download report. Depends: QA-001, ARCH-002.

For each later task: inspect → implement → tests → run browser where relevant → fix → console/save/performance check → update this plan and CURRENT_STATUS.md → checkpoint. No task is complete merely because it type-checks. Future Arizona/River expansion begins only after the Norway passenger and freight gates.
