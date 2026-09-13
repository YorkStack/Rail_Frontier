# Technical risk register

| ID | Risk and evidence | Mitigation / acceptance | State |
|---|---|---|---|
| R01 | No Astra Engine in actual repository | Obtain identity/source, inspect installed APIs and license, run import/render spike | Blocking architecture |
| R02 | No browser or renderer exists | Representative scene, console checks, camera/picking and actual GPU metrics | Open |
| R03 | Curve smoothness alone does not guarantee buildable rail | Derivative/radius/cusp/grade-extrema checks, tangent tests, transition experiments | Open |
| R04 | Sampled engineering can miss narrow hazards; bilinear terrain can differ from triangles | Split at terrain/water boundaries; terrain mesh/query agreement test | Open |
| R05 | GLB export does not prove importer coordinates/materials | Compare named markers, dimensions, normals and lit visual at both LODs | Export half validated |
| R06 | Vegetation/track detail could exhaust draw calls and GPU budget | 20k instanced trees, camera trajectories, renderer stats and LOD test | Untested |
| R07 | Large graphs may stall browser | Current O(V² + VE)-style scan prototype; cached adjacency and heap; bounded compile jobs | Core microbench only |
| R08 | Finance/cargo could duplicate earnings or drift | Integer ledger, atomic transfers, destination delivery tests and conservation assertions | Loader checks only |
| R09 | Partial schema will change during gameplay implementation | No release guarantee yet; add all mandatory fields before v1 release, migration fixtures thereafter | Open |
| R10 | Trains can collide without occupancy | Whole-edge reservations, station hold, deadlock feedback; multi-train regression | Not implemented |
| R11 | Hidden browser tabs cause runaway catch-up | Visibility auto-pause, explicit resume, no offline simulation | Clock validated; driver pending |
| R12 | Browser storage may fail or content versions mismatch | Transactional IndexedDB slots, quota/error handling and content compatibility registry | Not implemented |
| R13 | Content spread prevents playable loop | Norway only until passenger vertical slice passes; timber second | Enforced scope |

Do not interpret CPU timing in Node as evidence of 60 FPS graphics performance.
