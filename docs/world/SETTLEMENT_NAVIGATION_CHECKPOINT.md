# LIV-01c: navigable settlement paths

Implemented 2026-09-22. This completes the initial junction/entrance contract with a conservative no-unmanaged-crossing policy. It provides routing infrastructure for LIV-02; it does not add moving residents yet.

## Behaviour

The existing checked road/footpath geometry now produces a derived navigation graph. Intersections, T junctions and collinear overlaps split into shared nodes and edges. A house or station has an explicit entrance node; each settlement has the same hub chosen by its corridor planner. Disconnected lanes stay disconnected even when they are very close on screen. Junctions have at least three outgoing edges.

`SettlementNavigator` finds the shortest centre-line route between two entrance IDs or from an entrance to its town hub. Missing, blocked and remote entrances return no route. The access generator now calls the real routing query before claiming an entrance is connected. It runs in both the station-preview worker and the built scene, preserving their agreement.

Paths, hubs, component identifiers and entrances are deterministic derived data. They are rebuilt after relevant railway/terrain changes and on load; no new save field or schema migration is required. The renderer still uses the original checked road geometry and material system. There is no visual redesign in this checkpoint.

## Rail crossing decision

The first stage retains the conservative corridor rule:

1. A public footpath cannot cross a railway corridor without an explicit crossing component.
2. New railway geometry causes the settlement paths and their navigation graph to be rebuilt together. If a checked route around a finite rail obstruction exists, the new route follows that detour.
3. A cut-off entrance is blocked rather than connected by an invisible edge. Existing station access messages show the derived status. The town's chosen hub remains the definition of connected access; disconnected neighbourhoods are not silently given independent hubs.
4. Paths are ground-level. At this stage even the projected line of a bridge or tunnel remains an obstacle; no unverified vertical-clearance shortcut is invented.
5. Gates, managed level crossings, underpasses, crossing prices and route-build impact previews remain separate future work. Catchment-based passenger demand and current station construction eligibility are unchanged.

A deterministic fixture cuts a connected house/station network with a railway extending across the map: the station becomes blocked and no route crosses the line. Removing that obstruction reconstructs the original network exactly. A finite obstruction yields a validated walk around its end instead.

## Implementation contract

- `src/world/settlement-paths.ts` supplies checked centre lines and explicit town hubs.
- `src/world/settlement-navigation.ts` splits geometry with spatially bucketed intersection comparisons, deduplicates common edges, marks components/junctions and indexes route queries. Node keys normalise floating-point noise at micrometre precision; the algorithm does not bridge small road gaps.
- `src/world/settlement-access.ts` builds topology from the exact current entrances, paths and forecourts. Invalid station forecourts cannot create an accessible entrance.
- `src/rendering/fjord-renderer.ts` exposes the current derived snapshot to the test probe and reconstructs it through the existing scene/rail/terrain invalidation flow.

The graph is an **XZ centre-line network**. LIV-02 must sample the actual ground and supported forecourt surface for character height, honour revision changes and pause, and add verified doorway-to-platform/waiting-area links. It must not interpolate a straight shortcut between separate route bends or treat the street-side door as a boarding position. Reuse a navigator for a network revision rather than rebuilding it for every person/frame. Door sockets remain the authored rotated/scaled entrances; this checkpoint does not replace them with building centres.

## Verification

Final checks: 238 core tests, TypeScript/production build and seven focused Chrome journeys pass. The existing build chunk advisory remains. No new frame-time budget or browser compatibility certification is claimed.

Four new core cases cover true intersections/T joins, interior hubs, collinear overlaps, deterministic path-order reversal, shortest route length, tiny gaps/parallel lanes, unavailable destinations, a full railway barrier, removal/restoration and a finite-rail detour. The existing actual-Norway test now checks route queries for all 45 residential entrances. Both regional preview/actual-construction tests compare the complete navigation snapshot as part of their existing private-state, cash and layout checks.

The seven browser cases cover forward and reverse station-to-station construction, Norway house-to-station navigation and reload, Arizona entrance reachability, DE/EN station access preview, and cancellation/failure/retry. After real railway purchases, every navigation edge is tested against the resulting railway clearance mask; each reported connected entrance reaches its hub. Save/reload reconstructs exactly the same network. Arizona remains a scenery study.

Logs are retained in ignored `artifacts/liv-01c/`. Test browsers and the isolated server are stopped after verification; the generated acceptance site is removed from the workspace. Previous graphics screenshots remain representative because this changes connectivity data, not the appearance.

## Next

LIV-02a: public-door/forecourt/platform route heights and waiting positions, then a small 1900 Norwegian resident set tied to existing demand and actual stopped trains. Use those routes for representative movement without generating passengers or income a second time. Moving characters, animations, period traffic and animals remain unimplemented. STX physical station expansion follows the shared entrance/crossing contract.
