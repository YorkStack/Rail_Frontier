# GFX-003 — Norway V2 landforms

Completed 2026-09-14. New companies now use campaign version 2 / world generator 2. Existing campaign version 1 saves remain registered against the frozen V1 generator and are never remapped.

## Authored composition

`src/world/norway-landforms.ts` defines a fictional five-section fjord centreline with varying width, both shores, a four-anchor inland valley and a versioned waterfall location. `src/world/norway-v2.ts` combines these forms with deterministic multi-scale value noise, asymmetric side-wall mass, shoulders, a tributary depression and settlement flattening. The geometry is sampled into the same authoritative 25 m triangle heightfield used by construction, raycasts and rendering.

The fjord stays inside the 16 km map at five tested cross-sections, leaving land on both banks. Sundvik sits on the east shore terrace. The low valley follows Sundvik → Granli → Fjellhavn and continues inland; the commissioned first two railway legs remain valid. Town X/Z IDs and population are unchanged, while V2 town and industry Y values come from the V2 surface.

V2 biome masks now use complete X/Z surface gradients: steep/high terrain produces rock, forest tapers with slope and elevation, and town masks suppress both. This is landform/mask work; GFX-004 still owns the visible PBR material and snow correction.

## Version and loading behavior

- `norwayV1` is campaign version 1 / generator 1; `norwayV2` and the default `norway` export are version 2 / generator 2.
- The content registry validates and generates both combinations independently. New game and the commissioned preview use V2. The browser-only `?world=v1` switch exists for regression captures.
- The objectives registry recognizes both campaign versions. Save schema remains 3 because the existing world descriptor already carries campaign and generator versions.
- Waterfall/corridor rendering selects its matching V1 or V2 descriptor. No V1 shoreline function is used to place V2 scenery landmarks.

## Evidence

- V1 fingerprint remains `5e0a5b63073156cc412b17986651d1e777270198ab10f9e902e78e3cce5e7f1e`.
- V2 sampled fingerprint is `de823d1afe68daa35aa9ec8f6e28a16596b1807beb21c445637e02c4ee26e031`.
- 82 Node tests pass, including both-bank sections, distinct/stable fingerprints, grounded towns and the valid commissioned corridor.
- `tests/browser/session-switch.spec.ts` performs V1 → V2 → exact V1 replacement on one WebGL context.
- `tests/browser/graphics-v2.spec.ts` records a neutral terrain blockout with terrain/render agreement below 0.001 m. Ignored evidence: `artifacts/evidence/gfx-003/v2-regional-blockout.png` and `manifest.json`.

The blockout visibly resolves the largest V1 composition fault: water runs between continuous west/east mountain masses, and the inland playable valley is distinct from the fjord. The heightfield still looks smooth under the temporary material; fractured rock, scree, forest structure, lighting and summer snow belong to GFX-004/GFX-005.
