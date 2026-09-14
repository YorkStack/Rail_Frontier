# Testing

Commands: npm ci; npm run check; npm test; npm run validate:assets; npm run build; npm run test:browser; npm run spike:network. Browser tests use installed Google Chrome through Playwright, one worker. On another machine install Chrome or configure an available Playwright browser explicitly. The dev server is started automatically if port 5173 is free. Do not let an unrelated server occupy the fixed port.

Current Norway passenger/freight/city/art/inspection milestone: **75 Node tests**, **9 browser integration/end-to-end tests**, strict TypeScript, Blender GLB pack validation and production build. Browser screenshot/trace/temp outputs are ignored under artifacts/. Compact reference benchmark JSON is copied to docs/evidence/ for review.

Core tests cover triangle interpolation/borders/copy isolation, seeded generation/RNG continuation, arc length and distance, graph validity/weighted/reverse/disconnected paths, tangent/grade/radius/cusp constraints, exact terrain boundary crossing with narrow flooded-cell regression, ground/bridge/tunnel quotes, clock frame-rate/speed/pause/debt invariants, train edge crossing, save/load with dwell/turnaround, schema migration/progress guard, invalid saves/ledger/references/reservations, ID allocation and snapshot isolation.

Browser tests exercise all 16 campaign-selected production GLBs through the actual GLTFLoader, finite normals/bounds, production 16 km terrain raycasts, multi-car motion, pause/1×/8×, IndexedDB save + browser reload + exact loaded-state comparison, alignment/station tools, passenger and freight consist purchase/route assignment, close/far LOD, 1440×900 and 390×844 layouts, console errors, 20k-tree/2k-building/100-train scaling and resource replacement/full disposal. The passenger QA journey starts with no railway, builds track and two stations, buys and assigns a passenger consist, waits for real loading/delivery/revenue/operating cost, reconciles cash, reloads the exact save and resumes simulation. A separate commissioned-line journey carries timber into the sawmill and returned lumber to town over the physically simulated route, while checking visible inventory and reconciled freight income. Screenshots are visually reviewed; no test substitutes mocked WebGL for the engine.

Bug found and fixed: initial RAF timestamp can precede setup performance.now(), causing negative clock input and a stopped first frame. The real browser startup/reload test now passes. Terrain query/render mismatch was eliminated by standardizing the same NW→SE triangle split.

Rendering performance tests report sampled measurements rather than asserting universal FPS on unknown hardware. Node geometry/graph timing is not a graphics benchmark. Shader/GLB visual tests prove the current simple materials; future texture/animation imports require their own tests.

QA-001, ECON-003 and ART-001 are complete. The automatic commissioned preview remains the attractive landing state, while selecting “Start new company” creates the empty railway and empty-industry state used by the player-action gate.

Later system tests: longer consists and tail occupancy, richer service conflicts, demand expiry, objective rewards, historical accounting, storage quota/content failures and general renderer empty states. No architecture redesign is implied by these missing implementations.
