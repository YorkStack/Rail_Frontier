# Decision log

| ID | Decision | Rationale / evidence |
|---|---|---|
| D01 | Clone supplied remote into empty requested folder | No pre-existing work to overwrite; MIT preserved |
| D02 | Work on architecture/foundation | Main remains unchanged; local meaningful checkpoints |
| D03 | Strict TypeScript simulation independent of graphics | Pure core tests, stable serializable boundaries |
| D04 | Astra/Sol are coding models; choose Three.js r186 | User clarification resolved incorrect engine assumption; actual MIT renderer verified |
| D05 | Metres, X east/Y up/Z south; no exaggeration | Graph/terrain/physics/imports use one convention |
| D06 | Cubic Bézier with arc tables and conservative constraints | Tangent control, tested radius/grade/cusp rejection; no initial clothoid dependency |
| D07 | Track elevation independent of terrain | Bridges/tunnels/earthworks; split at exact triangle and clearance boundaries |
| D08 | 20 Hz fixed physics and compressed economic calendar | Frame-rate-independent motion; visibility pause; tested saves |
| D09 | Integer ledger + per-train running-cost remainder | Avoid rounding drift and support auditable revenue/costs |
| D10 | Typed stable IDs and schema 2 operational state | Explicit v1→v2 migration; references/finance/reservations checked |
| D11 | IndexedDB atomic slots behind SaveStore | Actual browser reload test; production management UI remains |
| D12 | Scripted Blender GLB pipeline with two LODs | Real imports validate size, axes, normals/materials and hysteresis |
| D13 | Original game art + licensed local fonts | No proprietary game assets; runtime notices distributed |
| D14 | Norway passenger loop before freight/content expansion | Architecture study proves integration without broad unfinished gameplay |
| D15 | Stop at validated Astra→Sol handoff | User requires explicit pause before routine implementation |
| D16 | Triangular terrain queries match GPU topology | Eliminates bilinear/mesh discrepancy; <0.001 m raycast agreement |
| D17 | RailNetwork immutable per-revision adjacency/heap cache | 5k-edge/100-query scale proof; no path compilation per simulation tick |
| D18 | Prototype composition belongs in spikes/ | Prevent automatic demo shuttling and fixed world becoming production architecture |
| D19 | Exclusive station-to-station corridor reservation first, signals later | Deterministic train-ID arbitration is implemented; blocks, platforms and priorities remain later work |
| D20 | Vite + native DOM; no large UI framework | Small study/control surface; typed application boundary supports later UI growth |
| D21 | Explicit WebGL context release on complete renderer disposal | Resource test revealed residual texture counter after normal dispose; context release verified directly |

No open architectural escalation. Known implementation limitations and remaining acceptance gates live in TECH_DEBT.md, RISK_REGISTER.md and IMPLEMENTATION_PLAN.md.
