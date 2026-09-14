# GFX-008 — Complete graphics regression and handback

Completed 2026-09-14 on branch `implementation/passenger-slice` after the map- and photo-informed Norway graphics pass.

## Final gates

- `npm run check`: strict TypeScript passes.
- `npm test`: 86/86 Node tests pass.
- `npm run validate:assets`: 32 asset types, 64 GLBs, 12 PNGs, marker/axis/detail/UV/bounds/LOD/budget checks and the 7,340,040-byte decoded texture estimate pass.
- `npm run build`: production build passes. App JavaScript is 241.98 KB / 73.45 KB gzip; Three.js is 640.71 KB / 160.48 KB gzip. The standard 500 KB Three.js advisory remains documented.
- `npm run test:browser`: 18/18 real Chrome tests pass in 5.7 minutes with one worker and clean console assertions.

The browser suite covers the original passenger, timber-freight, city, reporting, construction, operations, context/overlay, menu/archive and save/load flows. It also covers the V1 visual baseline, V2 terrain agreement, terrain PBR shader compilation, mixed scenery, all timber finishes, all current rolling-stock views, the 60-second composition/performance sweep, and final resource disposal.

Five alternating V1/V2 scene replacements keep exactly one WebGL context. Warm resource counters repeat at 91 geometries / 12 uploaded textures for the empty V2 company and 127 / 15 for the commissioned V1 save. One RAF driver records 73 frames in a 1.2-second sample. Final disposal returns the renderer geometry counter to zero and explicitly loses the shared context.

Desktop 1440×900 and mobile 390×844 screenshots were rendered and visually inspected under `artifacts/evidence/gfx-008/`. Mobile document and canvas width both remain 390 px, the map remains readable and the compact strategy/speed controls stay visible.

## Regression found and fixed

The legacy construction browser fixture still projected two V1 ground points that are about 37.7 m below V2 sea level. It also reused the map-label projection, which intentionally adds 25 m of vertical offset. The development probe now projects terrain picks at zero offset while labels retain their visual lift, and the construction case uses a stable, valid V2 land alignment. The construction test and the complete empty-company passenger journey both pass after the correction.

The graphics pass changes no vehicle catalogue values, physics, economy values, command semantics or schema-3 save fields. GFX-001 through GFX-008 are accepted; the deferred gameplay continuation is mail transport.
