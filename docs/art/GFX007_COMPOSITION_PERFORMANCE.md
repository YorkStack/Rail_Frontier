# GFX-007 — Norway composition and performance

Completed 2026-09-14 and remeasured 2026-09-20 on Apple M2 Pro with headless installed Chrome 153, 1440 × 900 CSS pixels and DPR 1.

## Renderer changes

- Static Blender meshes are merged by shared material before runtime cloning or instancing. Vehicle/station clones own their merged geometry and material while retaining the named axis and attachment markers; disposal therefore cannot invalidate the asset library.
- All 28,000 deterministic tree placements remain in the world. Runtime batches submit detailed trees inside 300 m, simplified trees through the fog-relevant 2.6 km range, understorey through 1.1 km and rock scenery through 6.5 km. Separate hysteresis thresholds prevent flicker as the camera moves.
- Scenery does not cast thousands of tiny distant shadows. A 2,048² directional shadow map follows the active camera target over a 1.4 km square, preserving useful train/building shadows at a much higher texel density.
- The V2 fjord has a five-metre translucent contact strip on both procedural banks. It follows the same analytical fjord centre and width used by the terrain rather than introducing another shoreline source.
- The fixed composition set keeps regional, shore and forest framing, while the train gate now follows the moving consist after a timed run.

## Measured result

`tests/browser/graphics-composition.spec.ts` performs one continuous 60-second regional → shore → forest → train sweep: 30 seconds at 1× followed by 30 seconds at 8×. It then captures four composed UI views and measures the existing 20,000-tree / 2,000-building / 100-train-proxy scale fixture for 300 frames.

| Measurement | Result |
|---|---:|
| 1× frame p50 / p95 | 16.70 / 16.80 ms |
| 1× render submission p95 | 5.40 ms |
| 1× fixed-tick batch p95 | 0.70 ms |
| 8× frame p50 / p95 | 16.70 / 16.80 ms |
| 8× render submission p95 | 4.40 ms |
| 8× fixed-tick batch p95 | 9.10 ms |
| Continuous-sweep maximum | 229 calls / 2.53 M triangles |
| Scale fixture | 81 calls / 2.29 M triangles / 16.80 ms frame p95 |

| Fixed view | Calls | Triangles |
|---|---:|---:|
| Regional | 200 | 1,046,912 |
| Shore | 216 | 1,229,696 |
| Forest edge | 199 | 1,638,666 |
| Train follow | 245 | 1,948,806 |

All fixed normal views remain below the 300-call and two-million-triangle tuning gates at 199–245 calls and 1.05–1.95 million triangles; the scale fixture remains below 450 calls. Camera-distance submission keeps every deterministic placement in the world while omitting simplified trees beyond the fog-relevant range. The interpolated middle-distance sweep briefly submits 2.53 million triangles while remaining below 229 calls and a 16.8 ms frame p95. That transient value is recorded rather than folded into the fixed near-view claim. Frame duration is refresh-limited wall time, and render submission time is CPU-side rather than a direct GPU measurement.

The 12 shared pack textures decode to an estimated 7,340,040 bytes including mipmaps, below the 128 MiB allocation target. The complete Norway model and texture pack is 2.51 MiB. Ignored evidence is written under `artifacts/evidence/gfx-007/`, including the four screenshots and `runtime.json`.
