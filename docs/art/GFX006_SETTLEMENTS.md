# GFX-006 — Norwegian settlements and industry kit

Completed 2026-09-14 with Blender 4.0.2. The Norway pack now contains three residential silhouettes across eight curated finishes: red/white, red/dark, ochre/white, ochre/cream, charcoal/white, charcoal/dark, warm-white/red and warm-white/dark. Separate mesh/material regions preserve slate roofs, glazing, doors, masonry, corner boards, window surrounds and contrasting eaves when wall colour changes.

`tools/blender/generate_norway_architecture.py` also exports a weathered barn, raised stabbur, boathouse, sawmill and timber yard. All have LOD0/LOD1, UVs, ground anchors and footprint corner nodes. The sawmill and forest industry now receive distinct world structures rather than relying only on labels.

## Shared original texture set

The generator writes six original 256 px tileable PNG maps: timber and slate base colour, tangent normal and roughness. They are listed once in the Norway manifest with role and colour-space metadata. Material-prefix bindings apply the same texture objects to compatible wall and roof materials; base colour maps use sRGB and normal/roughness maps remain linear. Neutral texture colour multiplies each curated material tint, so wall variation never recolours roof, glass or masonry. The six maps use about 2 MiB decoded including mip levels.

The Three.js asset owner loads and tags the shared textures before binding them to imported materials. Temporary instances can be rebuilt without disposing library-owned maps; full scene disposal releases them. Missing texture loads reject staged session creation through the existing failure-preserves-live-session boundary.

## Settlement composition

`src/rendering/settlement-placement.ts` creates three deterministic layouts: Sundvik harbour rows, Granli farm courts and Fjellhavn mountain terraces. Each uses 15 homes, all eight finishes and stable limited repetition. Terrain slope, water, railway clearance, industry clearance and footprint overlap are checked before acceptance. Vegetation uses a 330 m settlement exclusion, leaving a natural open meadow in the terrain mask. A restrained local path establishes each street/farm axis without covering the terrain with a hard-edged meadow decal.

The two industries add six grounded operational buildings, bringing the normal scene to 51 buildings. Foundations absorb small ground changes; residential footprints stay disjoint and off the commissioned line.

## Evidence

- The reviewed eight-finish Blender contact sheet is written to ignored `artifacts/evidence/gfx-006/blender-houses.png`.
- `tests/settlement-placement.test.ts` proves deterministic three-layout output, all eight finishes, authoritative grounding and non-overlapping residential footprints.
- `npm run validate:assets` checks all architecture UVs, footprint nodes, dimensions, normals, LOD simplification and all six PNG/manifest colour-space references.
- `tests/browser/graphics-villages.spec.ts` imports 64 GLBs and six shared maps, captures all three villages and fails on shader, image or console errors.

The complete Norway runtime art set is now 32 asset types / 64 GLBs plus six shared PNGs, 1.10 MiB downloaded. The current Fjellhavn capture submits 2.28 million triangles and 1,191 draw calls because forest tiles retain many separate asset/material batches. GFX-007 owns their consolidation after GFX-006B finishes the rolling stock.
