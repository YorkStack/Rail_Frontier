# GFX-004 — Norway surface materials and daylight

Completed 2026-09-14. Norway V2 now uses an original generated PBR terrain surface and a restrained summer palette. Terrain shape and all construction/raycast heights remain unchanged.

## Surface treatment

`src/rendering/terrain-material.ts` creates repeatable 128 px base-colour, tangent-space normal and roughness maps at runtime. The base colour is tagged sRGB; the normal and roughness maps remain linear. Periodic multi-frequency source functions keep every map tileable. Low contrast and a broad 720 m repeat prevent the procedural grain from reading as a regular grid in the regional camera.

`src/rendering/terrain-mesh.ts` derives slope from both horizontal axes. It combines the authoritative forest and rock masks with lowland, exposed stone, scree, shore soil and sparse high sheltered snow. Large colour variation uses several non-aligned frequencies, while the PBR maps supply only near-surface breakup. UVs and tangents are generated without displacing geometry.

The biome uses darker blue-green water, restrained lowland greens, neutral grey rock and cool haze. ACES exposure, directional sun, hemisphere fill and fog were tuned together. The water shader responds to view angle and sky colour; terrain remains opaque and physically rough.

## Validation

- `tests/terrain-material.test.ts` verifies colour spaces, repeat wrapping, UVs, tangents and material ownership.
- `tests/browser/graphics-materials.spec.ts` compiles the production shader paths in Chrome, requires all three terrain textures, checks sub-millimetre renderer/heightfield agreement and fails on browser warnings or errors.
- Fixed regional and rock-face captures are written to ignored `artifacts/evidence/gfx-004/` for visual review.

The final regional capture has no white summer blanket or directional green stripes. Meadow, forest, exposed rock and shore are distinct at strategy distance. Close terrain detail stays deliberately subtle because GFX-005 adds geometric rock and vegetation forms.
