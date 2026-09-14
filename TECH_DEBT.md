# Technical debt and implementation limits

| ID | Description / reason | Impact | Resolution | Priority |
|---|---|---|---|---|
| TD01 | Resolved: RailNetwork adjacency/min-heap and one revision-owned simulation cache | 5k-edge kernel and graph-edit tests pass | Preserve cache ownership when adding routing systems | Closed |
| TD02 | Resolved: triangle-exact crossings and persisted engineered spans are used by production construction | Narrow water and construction regressions pass | Extend biome cost masks only with new content | Closed |
| TD03 | Resolved: physical fixed-tick traction, braking, dwell and service replace demonstration motion | Passenger and freight end-to-end tests pass | Keep the small motion fixture isolated | Closed |
| TD04 | Conservative cubic certificate may reject some feasible curves; no easements | Preview can be strict; repeated marginal cases may cost ~0.2 s | Keep conservative validity; bounded worker/preview debounce; optimize only with reference tests | Medium |
| TD05 | Resolved: schema 4 persists Norway operations, town economies and mail delivery totals through sequential migrations | Mid-run save continuation is deterministic | Preserve v2, v3 and v4 fixtures at release | Closed |
| TD06 | Save limit is characters, not byte/entity/array counts | Potential expensive malicious payload | Bound entities/geometry before public save import | High before import |
| TD07 | Resolved: production renderer handles graph edits, all owned consists/stations, selection and overlays | Renderer no longer imports from `spikes/` | Split campaign composition only when a second biome is implemented | Closed |
| TD08 | Resolved for Norway: original Blender LOD pack replaces vehicle/station/scenery/infrastructure proxies | Industry buildings still use landscape context | Add dedicated industry structures with later content depth | Low |
| TD09 | Resolved: real schema 1→2 migration and progress guard | Tested old-state preservation | Preserve v2 fixture at first release | Normal |
| TD10 | Three.js chunk exceeds default 500 KB warning threshold | ~160 KB gzip; total payload within budget | Keep advisory, lazy-load menu/campaigns with content expansion | Low |
| TD11 | Norway full-system and stress profiles pass on the current target machine | No universal device support claim | Run a compatibility matrix before a public support claim | Medium before release |
| TD12 | Resolved: named/manual/autosave slots, resume, rename, delete and storage errors are exposed | Save lifecycle passes browser tests | Add quota telemetry only if public imports are added | Closed |
| TD13 | Day/month/year time is compressed 60 s/30 d/360 d | Intentionally simplified calendar | Label consistently in actual HUD | Low |
| TD14 | Terrain mesh is one chunk and forest two instanced batches | Coarse culling; tested fine for study | Terrain/vegetation chunks for the 16 km map | Medium |
