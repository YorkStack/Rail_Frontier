# Decision log

| ID | Decision | Rationale / status |
|---|---|---|
| D01 | Clone supplied remote into empty requested folder | Verified empty; no pre-existing changes to overwrite; preserve MIT |
| D02 | Work on architecture/foundation | Isolated source-control milestone; main unchanged |
| D03 | Pure strict TypeScript core | Browser-friendly, testable independent of unavailable engine |
| D04 | Do not assume an Astra graphics API or substitute engine | Actual repo contains no engine; identity clarification pending |
| D05 | Metres, +Y up, +X east, +Z south | Shared graph/terrain/physics coordinates; glTF-friendly, adapter conversion if necessary |
| D06 | Cubic Bézier + adaptive arc tables | Explicit endpoint tangents, distance-based motion; curvature/transition feasibility still open |
| D07 | Author track vertical profile independently of terrain | Allows bridges, tunnels and graded earthworks; simple sampled quote is prototype |
| D08 | 20 Hz fixed simulation, separate compressed economy day | Rendering frame rate must not change outcomes; tested timing foundation |
| D09 | Integer currency and signed transaction ledger | Reconciliation and exactly-once payment auditing; posting service pending |
| D10 | Stable typed IDs and strict versioned JSON state | Renderer-independent references and robust persistence |
| D11 | IndexedDB slots behind SaveStore | Browser durable structured storage; interface only |
| D12 | Scripted Blender → GLB LOD probes | Reproducible source with small web assets; importer compatibility pending |
| D13 | Original generated assets, no external media | Clear MIT distribution; no copied proprietary content |
| D14 | Norway passenger loop before freight/content expansion | Reduces coupled unfinished systems |
| D15 | No architecture-complete marker while engine gates fail | User requires actual engine experiments before Sol handoff |

Dependencies: TypeScript Apache-2.0 dev compiler, tsx MIT test runner, Node types MIT, Zod MIT runtime validation. Installed lockfile and local license texts establish exact versions/licenses; THIRD_PARTY_NOTICES.md records distribution obligations. No rendering library or frontend framework chosen yet.
