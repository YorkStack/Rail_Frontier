ASTRA_PHASE_COMPLETE=true
RECOMMENDED_MODEL=SOL
ASTRA_REVIEW_REQUIRED=false
GRAPHICS_PLANNING_COMPLETE=true
GRAPHICS_IMPLEMENTATION_STARTED=true
GRAPHICS_IMPLEMENTATION_COMPLETE=true
AWAITING_USER_MODEL_SWITCH=false

# Current status — Norway management implementation, 2026-09-14

Current milestone: the Norway passenger, mail, freight, production-asset, world-inspection, city-economy and company-reporting gates are complete. The actual renderer remains Three.js; Astra and Sol refer only to Codex models.

## Implementation completed after handoff

- Production RailFrontierGame and GameSession with ordered atomic command commits, detached frozen snapshots, fixed-tick RAF interpolation, visibility pause, safe load replacement and complete disposal.
- Safe-integer finance service with ledger reconciliation, category signs, overdraft/overflow rejection, exactly-once command replay behavior and saved fractional train running costs.
- Versioned 16 km Norway heightfield with deterministic fjord/valley relief, sea, forest/rock/urban masks, authoritative settlement elevations and a stable seeded fingerprint.
- Construction handler with live terrain quote/revision checks, funds, engineering span persistence, terminal tangent checks, endpoint junction splitting, inherited infrastructure cost/upkeep and disconnected interior crossings.
- Station content, rail/ground placement and deterministic closest town coverage. Six classes now progress from Rural Halt to Major Terminal; atomic upgrades charge only the cost difference, expand catchment/storage/platform capability, recalculate the served town and raise daily upkeep. Purchases and routes reject trains that exceed platform length.
- Original Norway steam locomotive and coach content, atomic train purchase, connected route validation and route assignment from the train's current station.
- Physical train simulation with consist mass/power/tractive force, signed grade, service braking, exact station arrival, dwell, shuttle reversal and revision-owned graph caching.
- Deterministic edge reservations prevent opposing trains from sharing track and expose blocked service state.
- Destination-weighted daily passenger demand, capacity-bound oldest-first boarding, distance-tracked delivery, exactly-once fares, daily maintenance and monthly capital/operating reports.
- FIN-002 adds live company, month, train and route reports without changing schema 3. The Railway Office separates revenue, operating cost and capital; exposes historical track cost, owned asset value and cash-plus-assets company value; and shows profitability for assigned and unassigned rolling stock.
- Connected-town, delivered-passenger and operating-profit campaign objectives with once-only completion.
- Transactional save manager covers manual/autosave, list/latest/delete, content compatibility and failure-preserves-session behavior. The browser shell now saves manually and autosaves daily.
- The visible fjord shell now runs RailFrontierGame rather than the demonstration clock. Live cash, date, passenger delivery, route result, service phase/speed/cargo, speed controls and camera controls read immutable snapshots. Surveyed parallel alignments can be committed through the real construction command and update rendering/cash immediately.
- A responsive main menu now presents the Norway campaign, new/continue flows, settings and credits. Its company archive creates named manual slots and can resume, rename or confirm-delete any slot; unavailable browser storage produces recovery guidance without changing the running company.
- The live HUD presents all three campaign goals from authoritative objective progress and marks completed goals directly from persisted completion state.
- Players can now pick two terrain points for a free straight alignment, snap to existing rail nodes, review engineering spans/cost/errors and commit or cancel through the real construction command. A separate map-pick station tool validates rail proximity, ground level, occupancy, funds and settlement coverage before purchase.
- The railway office now exposes consist purchase, two-stop route creation and stopped-train assignment through the command gateway. It also shows consist/cargo/service state, town demand, per-route result, reconciled cash/income/outgoings and recent ledger entries.
- The visible renderer now uses the deterministic 16 km Norway heightfield, production biome, 28,000 instanced trees, expanded settlement dressing, scaled fog/light/camera bounds and the full three-town corridor. The former 4 km scene remains only as an isolated architecture fixture.
- Every owned train is rendered from the Blender Norway pack. The initial service visibly combines the authored Nord 2-6-0 with two passenger coaches; passenger and freight car placement samples distance behind the locomotive across graph legs, and load replacement hides absent consists.
- QA-001 now passes as a separate empty-network browser journey: Norway selection, camera navigation, free track, two stations, locomotive/coach purchase, route assignment, physical service, passenger delivery, revenue and operating cost, reconciled cash, speed/pause, save, reload, exact load and resumed ticks with a clean console.
- ECON-003 now supplies the first production chain. Granli Forest creates timber into capped storage; Sundvik Sawmill atomically consumes timber and produces lumber. Covered stations transfer both goods through capacity-bound freight wagons, towns consume delivered lumber, distance-based freight revenue posts once, and blocked partial cargo remains aboard.
- The commissioned preview begins with a small working stock so a player can buy a freight consist and operate the full Granli–Sundvik chain immediately. A new company starts with empty industries and must wait for production. The railway office shows recipe progress, storage, timber/lumber inventory and typed onboard cargo.
- The Blender 4.0.2 Norway pack supplies two LODs each for 36 asset types / 72 GLBs plus 12 shared PNG maps, totaling 2.51 MiB: the detailed current railway kit, the 1922 Nord El 1, 1960 Nord Di 3B, 1981 Nord Di 4 and 1996 Nord El 18, mixed vegetation/rocks, eight timber-house finishes and dedicated farm/industry structures. No unrelated model pack is requested.
- Three.js renders material-merged rolling stock/stations as LOD objects and batches the authored scenery, houses and bridge pieces. The final fixed Norway views measure 187–226 calls and 1.45–1.77 million triangles while preserving a 16.8 ms frame p95 in the documented local run.
- The renderer now lives at the production boundary in `src/rendering/fjord-renderer.ts`. Trains and stations carry ephemeral pick identities; town and industry map labels use the same `WorldSelection` contract. A live contextual card reports authoritative state for all four entity kinds and follows a selected moving train.
- Station catchment, industry-site and rail-traffic overlays are available from the strategy toolbar. Overlay geometry rebuilds only when the relevant station, industry or reservation signature changes, and map labels yield pointer input while a construction tool is active.
- Schema 3 adds one economy record per town with local lumber demand and delivery, waiting mail, activity, service duration and fractional population growth. A pure 2→3 migration initializes these values while preserving all prior operations; schema 1 still migrates sequentially through schema 2.
- ECON-004 turns waiting mail into addressed train cargo. Every passenger coach has 24 mail units beside its 48 seats; mail selects the farthest other settlement on the route, accrues real rail distance, remains aboard at intermediate stops and posts one dedicated income transaction at delivery. Schema 4 adds the global mail-delivery total through a strict 3→4 migration.
- TECH-001 removes the hardcoded 1900 purchase path. Campaign start year is authoritative in schema 5, a shared 360-day calendar drives the HUD and availability checks, and the Railway Office fills its locomotive selector from eligible vehicle content. The 4→5 migration restores the historical 1900 epoch without changing older operations.
- TECH-002 persists electrification status, historical construction cost and separate daily upkeep per rail edge. The Railway Office quotes missing route sections and commits them atomically; electrical purchase, assignment and departure paths require powered track. Three.js derives visible portals, contact and messenger wires from this state. Schema 6 migrates all schema-5 edges to explicit unelectrified records.
- VEHICLE-003 adds the 1922 Nord El 1 with researched dimensions and performance, distinct purchase/running balance, and two locally generated Blender LODs. Its coupled rods, side pipework, louvres, glazing, doors, paired diamond pantographs and insulators are validated and rendered in Chrome; pantograph contact height matches the derived overhead wire.
- VEHICLE-004 adds the official 1981 Di 4 delivery boundary and specifications with a distinct angular six-axle Blender model, sloping framed windscreens, high radiator banks, roof fans, exhaust and snowploughs. Both LODs carry complete UVs and remain inside the unchanged vehicle budgets.
- VEHICLE-005 completes the researched locomotive set with the 1996 El 18: a separate swept four-axle electric Blender model with sealed glazing, doors, handholds, intakes and paired pantographs. Its exact 18.50 m rendered length and official performance values are tested against the existing power gates.
- SAVE-003 adds versioned `.railfrontier.json` export and atomic import for every company slot. Imports accept portable or raw saves, enforce UTF-8 byte plus entity/geometry/operational collection limits before graph validation, reject unsupported content before writing, and never replace the live session. The archive reports browser storage usage and actionable quota/private-mode failures; one rejected write cannot poison later saves.
- Towns count as connected only when a route uses their covered station. Connection and same-day lumber supply raise economic activity; activity above the threshold produces deterministic population growth. Lumber delivery is capped by local demand, with unpaid excess retained aboard.
- Town context cards and the railway office show population, passenger queues, economic activity, lumber demand/supply, mail, connected days and latest growth. A browser run observes the first daily update from 35 to 60 activity in the commissioned corridor.
- Responsive desktop/mobile layouts were visually checked. The regional, station and train-follow views were captured against the production world at roughly 53–60 FPS on the current machine.
- 109 Node tests and 18 real browser tests pass. Asset validation and the production build pass.

## Completed work

- Original repository cloned safely; MIT license preserved. Independent TypeScript simulation/rail/terrain/persistence foundation retained.
- Three.js 0.186.0 + Vite 8.3.0 browser study with 4 km seeded fjord terrain, forest, settlements, water, animated waterfall strip, track, bridge, tunnel portals and a graph-driven Blender wagon.
- Pan/orbit/zoom/tilt, WASD, focus/follow/regional camera; pause/1×/2×/4×/8×; explicit hidden-tab pause; RAF startup timing regression corrected.
- Actual Blender 4.0.2 → GLB → Three.js pipeline proven: axes, metres, pivots, couplers, finite normals, materials and close/far LOD with hysteresis.
- Triangle-exact terrain queries/rendering, cubic root isolation for terrain/water/engineering boundaries, conservative curve grade/radius/cusp certificate and tangent continuity.
- Immutable RailNetwork adjacency/min-heap/geometry cache; isolated frozen snapshots; fixed application, economic, vehicle/station/industry and operational-state contracts.
- Schema 6 plus strict sequential 1→2→3→4→5→6 migrations and semantic validation; real IndexedDB browser save/reload/load/resume with exact state equivalence.
- **109 Node tests and 18 browser tests pass**. Type check, Blender asset checks and production build pass. Browser tests fail on console warnings and exercise both world versions, the full gameplay slice, graphics composition and resource disposal.
- Actual 5k-edge/100-query and 100-train movement kernel tests; local rendering scale test with 20k trees, 2k buildings, 100 train bodies and 5k strategic rail segments. Around 60 FPS on Apple M2 Pro / Chrome 153 at 1440×900. Full economy/occupancy is not part of that benchmark.
- Resource replacement returns to baseline; final disposal releases geometries and explicitly releases the WebGL context. License/font notices included in production distribution. Documentation, backlog and compact benchmark evidence updated.

## Currently working

The map- and photo-informed Norway graphics enhancement is complete through [GFX-008](docs/art/GFX008_REGRESSION.md). V1 saves retain their exact terrain. V2 has two fjord banks, original PBR surfaces, mixed clustered forest/rocks, three deterministic villages with eight timber finishes plus dedicated industry buildings, detailed current steam/passenger/freight vehicles and camera-scaled scenery/shadows. Local Blender 4.0.2 generated the reproducible pack.

Mail transport, six-class station progression, the campaign calendar/catalogue boundary, the El 1, Di 3B, Di 4 and El 18 vehicle eras, route electrification and portable save archives are complete. Town demand, onboard cargo, station capability, global deliveries, vehicle eligibility, overhead-line infrastructure and dedicated ledger income are visible in the browser and survive save/reload. Arizona/River expansion and release/deployment remain later work.

Read ARCHITECTURE.md, IMPLEMENTATION_PLAN.md, DATA_MODEL.md, ECONOMIC_CONTRACT.md, SAVEGAME_FORMAT.md, DECISIONS.md and ASSET_PIPELINE.md. The plan marks architecture gates complete and explicitly identifies existing kernels to reuse.

## Stable contracts

- src/domain/model.ts + operations.ts: SI state, typed IDs, command sequence, operational/cargo/finance/content and town-economy records.
- src/application/ports.ts + snapshot.ts: UI command/storage/render boundary and detached frozen state.
- src/world/terrain.ts + domain/curve-math.ts: triangle surface and exact crossing rules.
- src/rail/geometry.ts, constraints.ts, planner.ts, graph.ts: cubic/arc/traversal/quote/cache rules.
- src/simulation/clock.ts: 20 Hz fixed steps, preserved time debt and compressed calendar contract.
- src/persistence/save.ts: schema 6 and sequential versioned migrations; indexeddb.ts: atomic slot backend.

Do not casually change units/axes, graph identity/connectivity, tick cadence/order, typed IDs, command atomicity or saved operational semantics. A genuine redesign follows ASTRA_ESCALATIONS.md; there is no open escalation now.

## Known limits and remaining product work

The preview commissions its first railway, stations, passenger service and industry stock automatically, while “Start new company” begins with empty track and empty industry inventories. The Norway production objects use the authored Blender pack, including dedicated farm, timber-yard and sawmill structures.

Conservative curve rejection, one-chunk terrain and remaining release-only cross-tab/save-fixture work are documented in TECH_DEBT.md and SAVEGAME_FORMAT.md. The default Vite 500 KB chunk advisory remains: Three.js is 640.71 KB minified / 160.48 KB gzip; total initial payload stays below the 5 MB budget. No warning is suppressed.

## Git state and reproduction

Branch: implementation/passenger-slice. Remote: https://github.com/YorkStack/Rail_Frontier. The implementation branch starts from architecture checkpoint **3e65484** and is synchronized to the remote after each completed milestone. No deployment or main-branch modification has been performed.

Development: npm ci; npm run dev → http://127.0.0.1:5173.
Production preview: npm run build; npm run preview → http://127.0.0.1:4173.
Checks: npm run check; npm test; npm run validate:assets; npm run test:browser.
Benchmarks: npm run spike; npm run spike:network. Browser tests use installed Google Chrome.
Blender generator: see ASSET_PIPELINE.md; generated GLBs are tracked so running the app does not require Blender.

The next work is route and dispatch depth, then the separately scoped Arizona/River expansion.
