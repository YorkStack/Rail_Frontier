# GFX-001 — V1 baseline and isolation

Completed 2026-09-14 on branch `implementation/passenger-slice`.

## Protected simulation baseline

- Campaign `norwegian-fjords`, campaign version 1, generator version 1, seed 140919.
- World dimensions 16,000 × 16,000 m, 25 m cells, 641 × 641 vertices and sea level 0 m.
- The sampled height/forest/rock/urban fingerprint remains `5e0a5b63073156cc412b17986651d1e777270198ab10f9e902e78e3cce5e7f1e`.
- `src/world/norway-v1.ts` now owns frozen V1 generation inputs, sites and analytic functions. `src/world/biome.ts` owns mutable-by-version art direction such as palette, daylight and decorative vegetation density. A future palette edit can no longer change V1 heights or masks through the biome object.
- Save schema remains 3. Existing campaign and vehicle identifiers, terrain sampling, rails and finance are unchanged.

## Reproducible views

`src/rendering/norway-camera-presets.ts` defines seven named cameras. Target elevation is sampled from the active terrain, while X/Z and camera offsets remain fixed. The browser capture is `tests/browser/graphics-baseline.spec.ts`; it pauses the simulation, records the environment and renderer counters, and writes the following ignored evidence:

| Preset | Baseline purpose | V1 observation |
|---|---|---|
| `regional` | Whole composition and both shores | The one-sided water sheet and repeated smooth white ridges dominate. Mountain bands lack rock structure and atmospheric depth. |
| `shore` | Settlement-to-slope relationship | The current angle exposes scattered houses on open slopes, identical red shells and cone trees. The fjord itself is not legible from the settlement. |
| `station` | Foundation, track and nearby housing | Station and houses are grounded but visually plain. Settlement spacing is random and lacks paths, plots and farm courts. |
| `train` | Current consist close view | Fixed initial-motion camera for locomotive/coach comparison; the baseline lacks the planned pipes, windows, doors and authored surface maps. |
| `forest-edge` | Near/mid vegetation transition | Uniform spruce cones are individually scattered rather than grouped into mixed canopy masses. There is no understorey or natural forest edge. |
| `rock-face` | High mountain material and silhouette | The surface reads as smooth white waves with directional colour stripes. There are no fractures, ledges, scree or summer material transitions. |
| `village` | Building variety and station context | One house geometry and finish repeats across the hillside; railway and houses have no composed street/farm relationship. |

Evidence paths: `artifacts/evidence/gfx-001/{regional,shore,station,train,forest-edge,rock-face,village}.png` and `manifest.json`. The images are intentionally ignored so generated browser evidence does not expand the repository. Generate them again with:

```sh
npx playwright test tests/browser/graphics-baseline.spec.ts
```

The first capture used installed Chrome 153 at 1440 × 900, DPR 1. Renderer counters varied by frustum from 82–146 calls and 3.44–3.55 million submitted triangles; the scene reported 28,000 trees, 360 buildings, one train and terrain/render agreement below 0.001 m. These are comparison measurements, not performance approval for the new graphics.

## Exit gate

The exact V1 fingerprint, frozen-profile test, TypeScript check and seven-camera real-browser capture pass. No V2 content, graphics asset or save migration has been introduced. Continue with GFX-002 session/content compatibility before enabling V2.
