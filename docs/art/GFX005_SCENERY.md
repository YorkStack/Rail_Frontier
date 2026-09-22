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


## September 22 woodland revision

The current scenery script also owns the standard spruce (12 asset types total); the base-pack script preserves that entry. Both LODs of the five tree families retain crown lobes/branch tiers. Foliage vertices have deterministic contour variation and smooth normals; shrubs retain five overlapping crowns near the camera and three in the strategic LOD. These remain original procedural Blender meshes with flat material colours, without photographic alpha foliage.

Placement now uses 1,200 deterministic stand nuclei, mostly clustered tree proposals, wider shrub fringes and a smaller unclustered component. Existing environmental masks remain in force; high elevations progressively reduce tree size/density and favour birch. Counts remain bounded: 28,000 trees, 12,000 understorey groups and 1,800 rock groups. No simulation RNG, terrain or saved network changes. The previously documented tile/detail-sampling approach has been superseded: current batches are per asset/LOD, use distance hysteresis and individual conservative frustum bounds. Camera rotation and viewport-aspect changes invalidate culling.

Visual reference remains the [Ørnesvingen photo collection, Norwegian Scenic Routes](https://www.nasjonaleturistveger.no/en/routes/geiranger--trollstigen/ornesvingen/) documented in the graphics plan. It informs the contrast between wooded slopes and open terrain; no source photograph is bundled as an asset. The distribution is art-directed, not a vegetation survey.

Strategic vegetation meshes are decimated to 72% after modelling, preserving the multi-part silhouette. The final fixed views submit 1.04m (regional), 1.64m (shore), 1.72m (forest edge) and 0.94m (train) triangles with 205–243 draw calls. These are view-specific measurements, not a whole-world upper bound. Reproduce with `tools/capture-woodland.ts` against a fixed test build.
