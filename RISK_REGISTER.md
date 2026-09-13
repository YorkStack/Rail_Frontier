# Technical risk register

| ID | Risk | Evidence / mitigation | State |
|---|---|---|---|
| R01 | Unidentified engine | User clarified model terminology; Three.js selected and validated | Closed |
| R02 | Browser/render integration | Actual scene, camera, shaders, picking, GLB and browser tests | Architecture proof passed |
| R03 | Non-buildable smooth curves | Conservative derivative-hull radius/grade/cusp certificate and tangent checks | Proof passed; preview optimization remains |
| R04 | Hidden narrow terrain hazards / mesh mismatch | Exact cell/diagonal/classification roots, narrow flood regression, raycast error <0.001 m | Closed for triangle heightfields |
| R05 | Blender import axes/normals/materials | Both real GLBs imported and visually inspected; close/far LOD tested | Closed for current asset conventions |
| R06 | Graphics scale / resource growth | Local 20k-tree/2k-building/100-proxy run near 60 FPS; replacement and disposal tests | Proof passed; production/long-session profile pending |
| R07 | Graph routing scale | Immutable adjacency+heap cache; 5k edges / 100 queries benchmark | Proof passed |
| R08 | Revenue duplication/cargo drift | Stable operational records, ledger invariant and exact transaction rules; systems still pending | Implementation tests required |
| R09 | Save compatibility | Schema 2 and validated 1→2 migration; strict invalid-state rejection | Foundation passed; future content version registry needed |
| R10 | Train conflicts | Exclusive corridor reservation design and persisted reference validation | Scheduling implementation pending |
| R11 | Hidden-tab catch-up / RAF timestamp | Visibility pause and nonnegative startup delta; browser reload test | Foundation passed |
| R12 | Browser storage errors | Atomic IndexedDB backend + actual reload test | Quota/multi-tab/import hardening pending |
| R13 | Scope spreads before playable economy | Norway first; study clearly labeled; stop now for Sol | Controlled |

No remaining blocker requires a new architecture decision before the implementation backlog. Pending risks are explicit acceptance tests, device expansion and bounded implementation tasks, not claims of completed gameplay.
