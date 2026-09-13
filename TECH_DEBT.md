# Technical debt and implementation limits

| ID | Description / reason | Impact | Resolution | Priority |
|---|---|---|---|---|
| TD01 | Resolved: graph scan replaced by RailNetwork adjacency/min-heap | 5k-edge kernel benchmark passes | Wire one cache per revision into actual application | Normal implementation |
| TD02 | Resolved: exact triangle/classification crossing replaces midpoint-only hazards | Narrow water regression now passes | Add biome cost masks and engineered-span policy in production construction | High before construction |
| TD03 | Demonstration motion uses constant speed and prepared service | Not a physical/economic train simulation | TRAIN-003/004 + ECON-002 | High before gameplay |
| TD04 | Conservative cubic certificate may reject some feasible curves; no easements | Preview can be strict; repeated marginal cases may cost ~0.2 s | Keep conservative validity; bounded worker/preview debounce; optimize only with reference tests | Medium |
| TD05 | Schema 2 exists, but operational systems not implemented | No released gameplay/save compatibility claim | Consume defined operations fields; migrate explicit changes | High before release |
| TD06 | Save limit is characters, not byte/entity/array counts | Potential expensive malicious payload | Bound entities/geometry before public save import | High before import |
| TD07 | Scene compositor is intentionally spike-specific | Assumes one prepared train, fixed map, no general graph edits | Implement production renderer adapter; reuse terrain/track/asset kernels | High |
| TD08 | Proxy art: cone trees, block wagon, basic waterfall strip/portals | Technical visual study, not final premium art | Original production assets after passenger loop | Medium |
| TD09 | Resolved: real schema 1→2 migration and progress guard | Tested old-state preservation | Preserve v2 fixture at first release | Normal |
| TD10 | Three.js chunk exceeds default 500 KB warning threshold | ~160 KB gzip; total payload within budget | Keep advisory, lazy-load menu/campaigns with content expansion | Low |
| TD11 | Short local benchmark, not complete game or device coverage | No universal FPS support claim | Full-system sustained profile during QA-001 | High before release |
| TD12 | Single study slot UI; full slot lifecycle/quotas not exposed | Backend supports multiple IDs, UX unfinished | SAVE-002 implementation and error tests | High before release |
| TD13 | Day/month/year time is compressed 60 s/30 d/360 d | Intentionally simplified calendar | Label consistently in actual HUD | Low |
| TD14 | Terrain mesh is one chunk and forest two instanced batches | Coarse culling; tested fine for study | Terrain/vegetation chunks for the 16 km map | Medium |
