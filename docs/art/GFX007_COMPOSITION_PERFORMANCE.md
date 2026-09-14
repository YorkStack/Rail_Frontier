# GFX-007 — Norway composition and performance

Completed 2026-09-14 on Apple M2 Pro with headless installed Chrome 153, 1440 × 900 CSS pixels and DPR 1.

## Renderer changes

- Static Blender meshes are merged by shared material before runtime cloning or instancing. Vehicle/station clones own their merged geometry and material while retaining the named axis and attachment markers; disposal therefore cannot invalidate the asset library.
- Detailed scenery remains in four frustum-cullable 8 km quadrants. Regional views switch to a global distant-canopy representation derived from every third tree and every second rock placement; understorey is omitted at that scale. The subset uses the same deterministic positions and 450/550 m hysteresis, so the camera does not flicker between representations around one distance.
- Scenery does not cast thousands of tiny distant shadows. A 2,048² directional shadow map follows the active camera target over a 1.4 km square, preserving useful train/building shadows at a much higher texel density.
- The V2 fjord has a five-metre translucent contact strip on both procedural banks. It follows the same analytical fjord centre and width used by the terrain rather than introducing another shoreline source.
- The fixed composition set keeps regional, shore and forest framing, while the train gate now follows the moving consist after a timed run.

## Measured result

`tests/browser/graphics-composition.spec.ts` performs one continuous 60-second regional → shore → forest → train sweep: 30 seconds at 1× followed by 30 seconds at 8×. It then captures four composed UI views and measures the existing 20,000-tree / 2,000-building / 100-train-proxy scale fixture for 300 frames.

| Measurement | Result |
|---|---:|
| 1× frame p50 / p95 | 16.70 / 16.80 ms |
| 1× render submission p95 | 1.40 ms |
| 1× fixed-tick batch p95 | 0.80 ms |
| 8× frame p50 / p95 | 16.70 / 16.70 ms |
| 8× render submission p95 | 1.00 ms |
| 8× fixed-tick batch p95 | 9.80 ms |
| Continuous-sweep maximum | 240 calls / 2.49 M triangles |
| Scale fixture | 79 calls / 2.29 M triangles / 16.80 ms frame p95 |

| Fixed view | Calls | Triangles |
|---|---:|---:|
| Regional | 187 | 1,473,214 |
| Shore | 190 | 1,453,126 |
| Forest edge | 198 | 1,720,270 |
| Train follow | 226 | 1,767,162 |

All fixed normal views remain below the 300-call and two-million-triangle tuning gates; the scale fixture remains below 450 calls. The interpolated middle-distance sweep briefly submits 2.49 million triangles while remaining below 240 calls and a 16.8 ms frame p95. That transient value is recorded rather than folded into the fixed near-view claim. Frame duration is refresh-limited wall time, and render submission time is CPU-side rather than a direct GPU measurement.

The 12 shared pack textures decode to an estimated 7,340,040 bytes including mipmaps, below the 128 MiB allocation target. The separate Norway download remains 1.19 MiB. Ignored evidence is written under `artifacts/evidence/gfx-007/`, including the four screenshots and `runtime.json`.
