ASTRA_PHASE_COMPLETE=true
RECOMMENDED_MODEL=SOL
ASTRA_REVIEW_REQUIRED=false
GRAPHICS_PLANNING_COMPLETE=true
GRAPHICS_IMPLEMENTATION_STARTED=true
GRAPHICS_IMPLEMENTATION_COMPLETE=false
CONSTRUCTION_DESIGN_COMPLETE=true
CONSTRUCTION_IMPLEMENTATION_STARTED=true
UX_PLANNING_COMPLETE=true
UX_IMPLEMENTATION_STARTED=true
UX_IMPLEMENTATION_COMPLETE=false
AWAITING_USER_MODEL_SWITCH=false

# Current status — graphics and station-first construction implementation, 2026-09-16

Current milestone: **SOL implementation in progress; GFX-R01–04, the UX-001 readability foundation and CON-01–03 are complete. GFX-R05 is next.** Norway and Arizona use biome-specific terrain materials and camera-selected vegetation. A new company starts by placing oriented stations on open ground, shaping a live horizontal and vertical spline, choosing a track standard and connecting visible rail ports. Active plans: [station-first construction architecture](docs/construction/STATION_TRACK_DESIGN.md), [graphics rework](docs/art/GRAPHICS_REWORK_PLAN.md) and [controls/tutorial/progression](docs/ux/ONBOARDING_AND_CONTROLS_PLAN.md).

Runtime checkpoint: `b92f8d240db8f14a8c846995efbb15f190b61669`. The runtime uses Three.js; Astra and Sol refer only to Codex models. Local Blender 4.0.2 remains the asset-production tool. GFX-R04 removes RNG-selected Norway LOD, retains all 28,000 trees and selects richer crowns around the camera. Arizona keeps 10,500 objects in habitat patches and selects near/far forms for shrub, grass, saguaro, juniper and mesquite; a fixed vegetation camera supports honest review.

## Implementation completed after handoff

- Production RailFrontierGame and GameSession with ordered atomic command commits, detached frozen snapshots, fixed-tick RAF interpolation, visibility pause, safe load replacement and complete disposal.
- Safe-integer finance service with ledger reconciliation, category signs, overdraft/overflow rejection, exactly-once command replay behavior and saved fractional train running costs.
- Versioned 16 km Norway heightfield with deterministic fjord/valley relief, sea, forest/rock/urban masks, authoritative settlement elevations and a stable seeded fingerprint.
- Construction handler with live terrain quote/revision checks, funds, engineering span persistence, terminal tangent checks, endpoint junction splitting, inherited infrastructure cost/upkeep and disconnected interior crossings.
- Station content, rail/ground placement and deterministic closest town coverage. Six classes now progress from Rural Halt to Major Terminal; atomic upgrades charge only the cost difference, expand catchment/storage/platform capability, recalculate the served town and raise daily upkeep. Purchases and routes reject trains that exceed platform length.
- Original Norway steam locomotive and coach content, atomic train purchase, connected route validation and route assignment from the train's current station.
- Physical train simulation with consist mass/power/tractive force, signed grade, service braking, advance braking for slower downstream track, exact station arrival, dwell, shuttle reversal and revision-owned graph caching.
- Deterministic full-leg reservations prevent opposing trains from entering the same single-track corridor, retain safety for the whole consist until arrival and expose blocked service state.
- Destination-weighted daily passenger demand, capacity-bound oldest-first boarding, distance-tracked delivery, exactly-once fares, daily maintenance and monthly capital/operating reports.
- FIN-002 adds live company, month, train and route reports without changing schema 3. The Railway Office separates revenue, operating cost and capital; exposes historical track cost, owned asset value and cash-plus-assets company value; and shows profitability for assigned and unassigned rolling stock.
- Connected-town, delivered-passenger and operating-profit campaign objectives with once-only completion.
- Transactional save manager covers manual/autosave, list/latest/delete, content compatibility and failure-preserves-session behavior. The browser shell now saves manually and autosaves daily.
- The visible fjord shell now runs RailFrontierGame rather than the demonstration clock. Live cash, date, passenger delivery, route result, service phase/speed/cargo, speed controls and camera controls read immutable snapshots. Surveyed parallel alignments can be committed through the real construction command and update rendering/cash immediately.
- A responsive main menu now presents the Norway campaign, new/continue flows, settings and credits. Its company archive creates named manual slots and can resume, rename or confirm-delete any slot; unavailable browser storage produces recovery guidance without changing the running company.
- The live HUD presents all three campaign goals from authoritative objective progress and marks completed goals directly from persisted completion state.
- Station placement now begins on open ground. The player picks a location, rotates a live level platform preview, reviews relief, cost and nearby settlement, and confirms a single atomic purchase. Each new station owns two visible rail ports; its internal platform track alone does not activate catchment or train purchase.
- Players connect available station/network ports with a live cubic spline chain. Left click adds intermediate waypoints, mouse movement updates the ghost, another rail connection finishes the draft, and right click or the visible Undo action removes the latest point. All sections retain terrain, grade, radius and engineering checks and commit as one atomic expense and graph revision.
- CON-03 separates the vertical profile from horizontal alignment, makes platform approaches level, preserves continuous waypoint grades and certifies grade plus vertical curvature. Local, regional and main-line standards apply progressively tighter grade/radius rules, distinct construction premiums and authoritative operating speeds; versioned engineering rules are revalidated at commit.
- GFX-R03 replaces the shared periodic sine tile with original Norway meadow/forest-floor/gravel/rock and Arizona dust/talus/compacted-soil/sandstone families. Forest, rock and urban masks drive material regions; steep rock uses triplanar sampling, macro variation is non-periodic, Arizona strata have irregular widths, and explicit sRGB/linear maps, mipmaps and anisotropy preserve stable distance detail without moving authoritative terrain.
- The railway office now exposes consist purchase, ordered multi-stop shuttle/loop creation and stopped-train assignment through the command gateway. It also shows consist/cargo/service state, town demand, per-route result, reconciled cash/income/outgoings and recent ledger entries.
- The visible renderer now uses the deterministic 16 km Norway heightfield, production biome, 28,000 instanced trees, expanded settlement dressing, scaled fog/light/camera bounds and the full three-town corridor. The former 4 km scene remains only as an isolated architecture fixture.
- Every owned train is rendered from the Blender Norway pack. The initial service visibly combines the authored Nord 2-6-0 with two passenger coaches; passenger and freight car placement samples distance behind the locomotive across graph legs, and load replacement hides absent consists.
- QA-001 now passes as a separate empty-network browser journey: Norway selection, camera navigation, free track, two stations, locomotive/coach purchase, route assignment, physical service, passenger delivery, revenue and operating cost, reconciled cash, speed/pause, save, reload, exact load and resumed ticks with a clean console.
- ECON-003 now supplies the first production chain. Granli Forest creates timber into capped storage; Sundvik Sawmill atomically consumes timber and produces lumber. Covered stations transfer both goods through capacity-bound freight wagons, towns consume delivered lumber, distance-based freight revenue posts once, and blocked partial cargo remains aboard.
- The commissioned preview begins with a small working stock so a player can buy a freight consist and operate the full Granli–Sundvik chain immediately. A new company starts with empty industries and must wait for production. The railway office shows recipe progress, storage, timber/lumber inventory and typed onboard cargo.
- The Blender 4.0.2 Norway pack supplies two LODs each for 36 asset types / 72 GLBs plus 12 shared PNG maps, totaling 2.51 MiB: the detailed current railway kit, the 1922 Nord El 1, 1960 Nord Di 3B, 1981 Nord Di 4 and 1996 Nord El 18, mixed vegetation/rocks, eight timber-house finishes and dedicated farm/industry structures. No unrelated model pack is requested.
- Three.js renders material-merged rolling stock/stations as LOD objects and batches the authored scenery, houses and bridge pieces. The final fixed Norway views measure 187–226 calls and 1.45–1.77 million triangles while preserving a 16.8 ms frame p95 in the documented local run.
- The renderer now lives at the production boundary in `src/rendering/fjord-renderer.ts`. Trains and stations carry ephemeral pick identities; town and industry map labels use the same `WorldSelection` contract. A live contextual card reports authoritative state for all four entity kinds and follows a selected moving train.
- EXP-001/002 establish the multi-campaign presentation and terrain boundaries. Registered campaign content selects and validates its renderer, biome, optional asset manifest, camera set and `WorldGenerator` before atomic scene creation. Norway V1/V2 expose their exact terrain, masks, corridor, water banks, anchors and waterfall through separate generator objects; shared orchestration no longer switches on Norway generator numbers.
- EXP-003 registers the independent 24 km Arizona Basin terrain study. Its stable basin/range/plateau/mesa/canyon grammar provides three flat settlement sites and two feasible long corridors, including a direct 1.2 km canyon bridge. Layered desert materials, 10,500 procedural scrub/grass/cactus/dry-tree instances, 180 settlement blockouts and five content-owned cameras run without a Blender asset manifest.
- Station catchment, industry-site and rail-traffic overlays are available from the strategy toolbar. Overlay geometry rebuilds only when the relevant station, industry or reservation signature changes, and map labels yield pointer input while a construction tool is active.
- Schema 3 adds one economy record per town with local lumber demand and delivery, waiting mail, activity, service duration and fractional population growth. A pure 2→3 migration initializes these values while preserving all prior operations; schema 1 still migrates sequentially through schema 2.
- ECON-004 turns waiting mail into addressed train cargo. Every passenger coach has 24 mail units beside its 48 seats; mail selects the farthest other settlement on the route, accrues real rail distance, remains aboard at intermediate stops and posts one dedicated income transaction at delivery. Schema 4 adds the global mail-delivery total through a strict 3→4 migration.
- TECH-001 removes the hardcoded 1900 purchase path. Campaign start year is authoritative in schema 5, a shared 360-day calendar drives the HUD and availability checks, and the Railway Office fills its locomotive selector from eligible vehicle content. The 4→5 migration restores the historical 1900 epoch without changing older operations.
- TECH-002 persists electrification status, historical construction cost and separate daily upkeep per rail edge. The Railway Office quotes missing route sections and commits them atomically; electrical purchase, assignment and departure paths require powered track. Three.js derives visible portals, contact and messenger wires from this state. Schema 6 migrates all schema-5 edges to explicit unelectrified records.
- VEHICLE-003 adds the 1922 Nord El 1 with researched dimensions and performance, distinct purchase/running balance, and two locally generated Blender LODs. Its coupled rods, side pipework, louvres, glazing, doors, paired diamond pantographs and insulators are validated and rendered in Chrome; pantograph contact height matches the derived overhead wire.
- VEHICLE-004 adds the official 1981 Di 4 delivery boundary and specifications with a distinct angular six-axle Blender model, sloping framed windscreens, high radiator banks, roof fans, exhaust and snowploughs. Both LODs carry complete UVs and remain inside the unchanged vehicle budgets.
- VEHICLE-005 completes the researched locomotive set with the 1996 El 18: a separate swept four-axle electric Blender model with sealed glazing, doors, handholds, intakes and paired pantographs. Its exact 18.50 m rendered length and official performance values are tested against the existing power gates.
- SAVE-003 adds versioned `.railfrontier.json` export and atomic import for every company slot. Imports accept portable or raw saves, enforce UTF-8 byte plus entity/geometry/operational collection limits before graph validation, reject unsupported content before writing, and never replace the live session. The archive reports browser storage usage and actionable quota/private-mode failures; one rejected write cannot poison later saves.
- ROUTE-002 exposes arbitrary ordered station drafts plus shuttle/loop service in the Railway Office. The dispatcher now reserves every edge to the next station before departure and keeps that leg until arrival, so opposing trains wait outside a single-track corridor. A station-blocked service retries after its route or electrification becomes valid.
- Towns count as connected only when a route uses their covered station. Connection and same-day lumber supply raise economic activity; activity above the threshold produces deterministic population growth. Lumber delivery is capped by local demand, with unpaid excess retained aboard.
- Town context cards and the railway office show population, passenger queues, economic activity, lumber demand/supply, mail, connected days and latest growth. A browser run observes the first daily update from 35 to 60 activity in the commissioned corridor.
- Responsive desktop/mobile layouts were visually checked. The regional, station and train-follow views were captured against the production world at roughly 53–60 FPS on the current machine.
- 136 Node tests pass. Focused real-browser terrain, construction and passenger journeys pass: six fixed Norway/Arizona material views with a clean shader console, waypoint/undo/port/atomic-build assertions, and the complete station → alignment → consist → route → passenger/mail delivery → save/reload loop. Browser tests run a static test-mode production bundle; its startup allowance covers slower local Vite builds. The prior 19-case browser baseline remains the wider regression target. Asset validation and the production build pass.

## Completed work

- Original repository cloned safely; MIT license preserved. Independent TypeScript simulation/rail/terrain/persistence foundation retained.
- Three.js 0.186.0 + Vite 8.3.0 browser study with 4 km seeded fjord terrain, forest, settlements, water, animated waterfall strip, track, bridge, tunnel portals and a graph-driven Blender wagon.
- Pan/orbit/zoom/tilt, WASD, focus/follow/regional camera; pause/1×/2×/4×/8×; explicit hidden-tab pause; RAF startup timing regression corrected.
- Actual Blender 4.0.2 → GLB → Three.js pipeline proven: axes, metres, pivots, couplers, finite normals, materials and close/far LOD with hysteresis.
- Triangle-exact terrain queries/rendering, cubic root isolation for terrain/water/engineering boundaries, conservative curve grade/radius/cusp certificate and tangent continuity.
- Immutable RailNetwork adjacency/min-heap/geometry cache; isolated frozen snapshots; fixed application, economic, vehicle/station/industry and operational-state contracts.
- Schema 7 plus strict sequential 1→2→3→4→5→6→7 migrations and semantic validation; real IndexedDB browser save/reload/load/resume with exact state equivalence.
- **136 Node tests pass; the focused GFX-R03 terrain, GFX-R04 Norway scenery, CON-03 construction and complete passenger/save journeys pass in Chrome.** The GFX-R04 proof reports 293 detailed plus 27,707 simplified trees near the forest and all 28,000 simplified trees regionally, with no extinction or WebGL errors. Type check, Blender asset checks and the test build pass.
- Actual 5k-edge/100-query and 100-train movement kernel tests; local rendering scale test with 20k trees, 2k buildings, 100 train bodies and 5k strategic rail segments. Around 60 FPS on Apple M2 Pro / Chrome 153 at 1440×900. Full economy/occupancy is not part of that benchmark.
- Resource replacement returns to baseline; final disposal releases geometries and explicitly releases the WebGL context. License/font notices included in production distribution. Documentation, backlog and compact benchmark evidence updated.

## Currently working

The 2026-09-15 review reopens visual acceptance. Confirmed defects include inverted exported Norwegian roof slopes, RNG-assigned low-detail trees, repeated terrain patterns, an Arizona shadow-depth mismatch, untextured Arizona building blockouts and excessively distant opening cameras. UI inspection confirms tiny fonts, hidden station prerequisites and fragmented train/service setup. Historical GFX-008 technical results remain evidence of that build, not acceptance of the appearance or intuitiveness.

Implementation sequence: **GFX-R01 ✓ → GFX-R02 ✓ → UX-001 foundation ✓ → CON-01 ✓ → CON-02 ✓ → CON-03 ✓ → GFX-R03 ✓ → GFX-R04 ✓ → GFX-R05 next → GFX-R06–07 → CON-04–06 → UX-003 + UX-004–005 / CON-07 → GFX-R08–09 + UX-006**. Camera-selected vegetation and habitat grouping now join the completed roofs, cameras, controls, construction planning and terrain materials.

Completed Norway gameplay, locomotive eras, electrification, portable saves and safe dispatch remain intact. EXP-001–003 provide expansion foundations; Arizona is a terrain-only study, not a playable campaign. The Arizona architecture part of EXP-004 moves into GFX-R07; economy, full campaign selection and Great River wait until the rework review. Do not duplicate art work or restart completed systems.

The user’s construction brief supersedes the earlier track-first UX: standalone stations, visible ports, editable spline alignment, automatic engineering and whole-route purchase are required. Architecture review is recorded in ASTRA_ESCALATIONS.md. CON-01–03 are implemented on schema 7; semantic terrain operations begin with CON-04 and the next coordinated migration.

Read the three active plans and IMPLEMENTATION_PLAN.md first. Continue with GFX-R05: Norway V3 landforms, cliffs, shore detail and visible waterfall.

## Stable contracts

- src/domain/model.ts + operations.ts: SI state, typed IDs, command sequence, operational/cargo/finance/content and town-economy records.
- src/application/ports.ts + snapshot.ts: UI command/storage/render boundary and detached frozen state.
- src/world/terrain.ts + domain/curve-math.ts: triangle surface and exact crossing rules.
- src/rail/geometry.ts, constraints.ts, planner.ts, graph.ts: cubic/arc/traversal/quote/cache rules.
- src/simulation/clock.ts: 20 Hz fixed steps, preserved time debt and compressed calendar contract.
- src/persistence/save.ts: schema 7 and sequential versioned migrations; indexeddb.ts: atomic slot backend.

Do not casually change units/axes, graph identity/connectivity, tick cadence/order, typed IDs, command atomicity or saved operational semantics. A genuine redesign follows ASTRA_ESCALATIONS.md; there is no open escalation now.

## Known limits and remaining product work

Graphics and first-use UX are not yet visually/product accepted. Readable UI scaling, station-first placement and continuous horizontal/vertical waypoint planning are implemented; semantic earthworks and the hands-on tutorial remain. The full Node suite plus focused construction and passenger browser journeys were rerun for this checkpoint.

The preview commissions its first railway, stations, passenger service and industry stock automatically, while “Start new company” begins with empty track and empty industry inventories. The Norway production objects use the authored Blender pack, including dedicated farm, timber-yard and sawmill structures.

Conservative curve rejection, one-chunk terrain and remaining release-only cross-tab/save-fixture work are documented in TECH_DEBT.md and SAVEGAME_FORMAT.md. The default Vite 500 KB chunk advisory remains: Three.js is 643.43 KB minified / 161.56 KB gzip; total initial payload stays below the 5 MB budget. No warning is suppressed.

## Git state and reproduction

Branch: implementation/passenger-slice. Remote: https://github.com/YorkStack/Rail_Frontier. Completed milestones are synchronized to both `implementation/passenger-slice` and `main`, as requested. No deployment has been performed.

Development: npm ci; npm run dev → http://127.0.0.1:5173.
Production preview: npm run build; npm run preview → http://127.0.0.1:4173.
Checks: npm run check; npm test; npm run validate:assets; npm run test:browser.
Benchmarks: npm run spike; npm run spike:network. Browser tests use installed Google Chrome.
Blender generator: see ASSET_PIPELINE.md; generated GLBs are tracked so running the app does not require Blender.

Next: implement GFX-R04 camera-dependent vegetation and credible crowns, then GFX-R05–07 before CON-04. Commit and push each completed checkpoint to both branches and verify their remote hashes. Great River and advanced signaling remain later systems.
