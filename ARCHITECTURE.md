# Rail Frontier architecture

Status: partial foundation, 2026-09-13. The rendering engine is unresolved. This document distinguishes implemented code from proposed systems. Do not mark the Astra phase complete before the engine and browser spikes pass.

## Discovery

The specified local directory was empty and not a Git checkout. Cloned the supplied remote into that directory, preserving the remote's `main` history. Initial commit: `66d6bb915b06b58ba393c305c3a1b472f2029ce2`. It contains only README.md and the MIT LICENSE, copyright 2026 York. No source, package manifest, framework, shaders, tests, asset loader, deployment, or engine dependency existed. Development branch: `architecture/foundation`.

No Astra Engine APIs have been found or assumed. The clarification requested from the user is the engine path, package, or documentation, or confirmation that Astra means the coding model. See ASTRA_CAPABILITIES.md and ASTRA_ESCALATIONS.md.

## Implemented dependency direction

`content → domain ← rail/world/simulation`; `persistence → domain + graph`; `application/ports → domain + engineering quote`. All implementation uses strict TypeScript. Zod validates untrusted saves. No browser globals, graphics imports, or engine object references enter the core. Tests run in Node through tsx.

Implemented modules:

| Module | Responsibility | Actual validation |
|---|---|---|
| domain/model | Persistent records, IDs, coordinates | Type check; allocation tests |
| world/terrain | Finite heightfield, bilinear queries | Borders, interpolation, invalid inputs, input isolation |
| rail/geometry | Cubic Bézier compilation and arc-distance evaluation | Straight/curved reference, degeneracy |
| rail/graph | Graph validation, bidirectional shortest-time path | Reverse/disconnected/alternative paths |
| rail/planner | Sampled earthworks/bridge/tunnel quote | Classification, grade and water rejection |
| simulation/clock | Fixed stepping with preserved backlog | 30/144 FPS equivalence, pause, 8× |
| simulation/motion | Distance crossing connected graph edges | Boundary crossing, reverse arrival |
| persistence/save | Schema, references, ledger reconciliation, roundtrip | Malformed/future/dangling state and continuation |
| application/ports | Command, storage, rendering contracts | Types only; no implementations |
| content/norway | Three provisional fictional settlements | Initial save roundtrip |

## Timing

20 fixed simulation steps per simulated second (`FIXED_DT = 0.05`). Rendering will interpolate previous/current poses; it must not change simulation state. UI speed is 0, 1, 2, 4, or 8. Economic interval: 1,200 steps = 60 simulated seconds = one economic day. This is compressed calendar time, while train physics use SI seconds. Monthly accounts will use 30 economic days; clearly label the simplified calendar. Dates, economic ticks and demand production are not implemented yet.

The accumulator caps work per call, retaining debt rather than silently losing time. Pause does not drain debt. Proposed browser driver auto-pauses while hidden, resets wall-clock reference on return, and requires explicit resume; no offline earnings. A save records only a completed tick. Fractional render accumulator is deliberately ephemeral. Commands must be applied in deterministic order before a tick, with sequence IDs in future replays.

## Coordinates and terrain

Simulation: right handed, metres; +X east, +Y up, +Z south; northwest map corner is (0,0,0), sea level Y=0. Norway configuration is 16,000 × 16,000 m, 25 m base cells (641 × 641 grid). Float64 simulation positions; no vertical exaggeration. Graphics coordinates will be converted at the adapter if needed. Floating origin is a proposed renderer optimization only; never rewrite saved coordinates.

The implemented heightfield owns a copy of finite elevation data. Queries outside its closed bounds fail. Biome/water/forest/rock/urban samples share one Terrain interface, although the initial heightfield supplies only elevation and optional constant water level. Rendering must consume this same surface. A renderer with triangulated rather than bilinear interpolation needs a matching query rule, verified by a spike before finalizing terrain meshing.

## Railway and construction

Graph nodes are logical connections. Edges own cubic centerlines, direction-independent speed limits and ownership. The curve and graph endpoints must agree within 1 mm. Traversal records store an edge ID plus orientation. Compiled arc tables are caches; never save them. Current routing recompiles and scans; production uses revision-keyed adjacency/geometry caches and a heap.

Cubic Bézier chosen for explicit endpoint/tangent control and predictable splitting. Adaptive de Casteljau subdivision bounds control-polygon span to 5 m and local flatness to 5 mm. Measured curved length agrees within 5 cm with a dense reference test. This does not certify railway curvature or grade extrema. Add derivative checks, minimum radius, cusps, grade extrema and tangent continuity before construction is accepted. Vertical curves and transition easements may need an Astra review after this spike.

Track elevation is an authored design profile; terrain does not pull the rail up every slope. Planner samples each interval midpoint, identifies water or >6 m fill as bridge, >4 m cut as tunnel, otherwise earthworks. Water requires 2 m clearance; provisional maximum grade is 4%. Cost includes length, clearance, forest, rock and urban factors. These are prototype rates, not balanced prices. Narrow terrain hazards can be missed: production must split at terrain cells/water boundaries and enforce bridge/tunnel entry/exit rules. Engineering intervals and quotes are not yet persisted or transactionally committed.

Proposed rendering: continuous generated rail/ballast ribbons, instanced sleepers and bridge/portal modules, strategic simplified centerline at far zoom. LOD geometry must not affect route distance or cost. Junction crossings do not connect unless the graph is split; matching tangents are required. Initial occupancy uses whole-edge exclusive reservations, with station holding and deadlock feedback. Full signals are deferred.

## Trains and economy

Current motion only demonstrates distance on graph geometry. Proposed fixed-step sequence: commands → route/occupancy → traction/braking → movement → station arrivals/dwell/transfers → economic production → objectives → publish snapshot. Derive speed from force/power limits, mass, drag, gradient and braking distance; limit each crossed edge. A consist samples route history at cumulative coupler distances, including previous edges. Never place coaches by a fixed world-space offset.

First passenger model: daily deterministic origin/destination queues, capped by population; station coverage picks one station deterministically to avoid duplicating demand. Cargo lots record destination, quantity, load tick and actual carried distance. Load within coach capacity; pay once at the destination on unload. Revenue uses rounded integer minor currency units; demand cannot be paid twice. Dwell is tick-based. All debits and credits use a single finance service and reconcile to opening cash. No finance mutation service or passenger transfer exists yet.

Next chain is forest → timber → sawmill → lumber → town. Production consumes inputs atomically with storage caps. Production recipes, vehicles, station classes and technology are content records, not renderer logic. Slow growth depends on delivered service, with deterministic expansion zones. Loans, advanced signaling and competitors remain out of scope.

## Application and presentation

UI submits typed commands; command handlers validate funds, availability, references and graph revision and either commit the complete change or reject without mutation. The service recomputes construction cost rather than trusting a stale preview. Snapshots must be immutable at runtime or isolated copies: TypeScript Readonly alone is shallow. Dispatch and snapshot services are interfaces only.

IndexedDB slot storage will hold schema-versioned JSON and separate slot metadata in one transaction. Renderer owns camera, instancing, selection, LOD, water, shaders, labels and GPU disposal. Web framework and rendering stack remain undecided pending engine discovery. No UI or web server exists.

## Outstanding architectural gates

Actual engine integration and license; Blender import including normals/materials; terrain query/render agreement; railway radius/junction feasibility; visible train following; representative fjord scene with water/trees/waterfall/bridge/portal; vegetation and train performance; browser persistence. See IMPLEMENTATION_PLAN.md for executable tasks and RISK_REGISTER.md for evidence and mitigations.
