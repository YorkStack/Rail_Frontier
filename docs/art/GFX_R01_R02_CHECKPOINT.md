# GFX-R01/R02 implementation checkpoint

Date: 2026-09-15

## Result

All Norwegian houses and pitched-roof working buildings were regenerated locally with Blender 4.0.2. Roof panels now rise from both eaves to a central ridge. Closed gable infill, ridge caps and four sloped verge trims remove the former inverted and open roof silhouette. Both exported LODs expose `roof_ridge`, `roof_eave_left` and `roof_eave_right`; asset validation proves the ridge is above and between the eaves.

Norway and Arizona now open with content-owned settlement cameras. `Regional view` remains the deliberate overview. The Arizona light shadow range covers the 24 km study, its settlement blockouts are clustered more tightly, and its visible study panel states that railway construction and company play are currently available in Norway. Town, canyon and overview camera buttons plus a Norway return link remain usable while the normal Norway HUD is hidden.

## Visual review

- Blender contact sheet: all eight red, ochre, charcoal and white house variants have a central high ridge and closed gable ends.
- Norway entry: Sundvik houses, station and train read at useful scale with the fjord and opposite slope behind them. The camera no longer introduces the whole 16 km map as a board.
- Granli: roof ridges and gable faces remain legible in the running Three.js scene.
- Arizona entry: the camera begins among a tighter Coyote Wells cluster with a mesa on the horizon. The buildings remain temporary two-box blockouts; their replacement is explicitly GFX-R07 and is not visually accepted here.
- The repeating Arizona strata and simple Norway vegetation remain visible defects assigned to GFX-R03–R07.

## Verification

- `npm run check`
- `npm test` — 120 tests
- `npm run validate:assets`
- `npm run build`
- `npx playwright test tests/browser/graphics-villages.spec.ts tests/browser/arizona-terrain.spec.ts`

Browser evidence is generated under `artifacts/evidence/gfx-006` and `artifacts/evidence/exp-003`. Final reviewed README images will be refreshed at GFX-R08/R09.
