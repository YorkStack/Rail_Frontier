# GFX-005 — Blender rocks and vegetation

Completed 2026-09-14 with the locally installed Blender 4.0.2. `tools/blender/generate_norway_scenery.py` reproducibly exports 11 new original scenery types at LOD0 and LOD1: narrow spruce, Scots-pine-inspired pine, birch, alder, shrub, fern, two boulders, two outcrops and a scree cluster. Together with the original spruce, the runtime has five distinct tree forms.

The generator creates faceted silhouettes with separate bark, conifer, deciduous, stone and lichen materials. LOD1 broadleaf crowns use low-poly icospheres; detailed forms retain multiple crown masses and branches. Irregular rock vertices, contrasting stone tones and clustered scree replace the previous terrain-colour-only treatment. Every asset keeps a matching ground anchor between LODs.

## Deterministic placement

`src/rendering/scenery-placement.ts` owns a private seed and returns immutable placement records without consuming simulation RNG. Placement uses the authoritative forest/rock masks, complete terrain slope, elevation and broad patch fields. It rejects sea, unsuitable cliffs, towns, industries, stations and sampled live rail geometry. Stable attempt IDs mean adding track removes intersecting records while preserving unaffected records; rebuilding or loading produces the same accepted placement.

The renderer batches records by 4 km tile, asset and LOD. Tiles outside the camera frustum are culled. LOD0 is reserved for a small deterministic detail sample; LOD1 carries the strategic forest. Instance geometry and materials are cloned from the hidden asset library so scenery replacement cannot dispose shared source resources. A rail revision rebuilds the affected deterministic scenery result.

## Evidence and budgets

- The reviewed Blender contact sheet is written to ignored `artifacts/evidence/gfx-005/blender-contact-sheet.png`.
- The Norway manifest now contains 19 unique assets / 38 GLBs, 716 KB total. All bounds, ground anchors, finite normals, LOD simplification, byte and triangle limits pass `npm run validate:assets`.
- `tests/scenery-placement.test.ts` proves determinism, all five tree forms, at least four rock forms, authoritative grounding/masks and live-track exclusion stability.
- `tests/browser/graphics-scenery.spec.ts` imports every GLB with the real Three.js loader and records fixed forest-edge and rock-face images without console warnings.
- The regional runtime capture reports 28,000 trees, 1.40 million submitted triangles and 636 draw calls. Frustum tiling brought triangles below the two-million target; draw-call consolidation remains explicitly assigned to GFX-007.

The new forest is visibly clustered and mixes conical and round crowns. Open meadow remains clear, while exposed slopes receive grouped stone forms rather than an even prop scatter. GFX-006 now replaces the still-repeated, widely scattered house treatment with coherent settlements.
