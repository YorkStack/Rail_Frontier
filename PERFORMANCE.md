# Performance evidence and budgets

## GFX-007 Norway production scene

Measured 2026-09-14 on the same Apple M2 Pro with installed headless Chrome 153 at 1440×900, DPR 1. A continuous 60-second regional-to-train camera path produced 16.8 ms frame p95 at 1× and 16.7 ms at 8×. CPU render submission p95 was 1.4/1.0 ms; fixed-tick batch p95 was 0.8/9.8 ms. The four fixed normal views measured 187–226 calls and 1.45–1.77 million triangles. The existing 20k-tree/2k-building/100-proxy scale fixture measured 79 calls, 2.29 million triangles and 16.8 ms frame p95. Full evidence and limitations: [GFX007_COMPOSITION_PERFORMANCE.md](docs/art/GFX007_COMPOSITION_PERFORMANCE.md).

Measured 2026-09-13 on Apple M2 Pro / macOS arm64 / Node v25.8.0. Browser harness: installed Google Chrome 153, headless, 1440×900 CSS pixels, DPR 1, default WebGL2 backend. Also visually inspected in the Codex in-app browser. These are local technical spikes, not a complete supported-hardware matrix or independent GPU timer measurements.

## Browser results

Detailed output: docs/evidence/browser-benchmark.json; regenerate with npm run test:browser. Normal scene: 6,500 trees, 90 buildings, one GLB train and detailed rail. Scaled scene: 20,000 trees, 2,000 buildings, 100 train bodies (99 instanced proxies), 5,000 strategic rail segments, simulation speed 8×.

Latest reference run: normal p50/p95 frame time approximately 16.7/16.8 ms (121 samples); stress 16.7/16.8 ms (300 samples, about five seconds). Normal/stress draw calls 36/38; rendered triangles approximately 358k/922k. Stress p95 JavaScript render submission 0.6 ms; fixed-tick batch 0.2 ms. Render submission time is **not GPU execution time**. Frame timing is refresh limited. Initial compilation/camera transitions and longer thermal/resource sessions need later testing.

Reverting stress mode returns allocations to baseline: 32 geometries, 3 textures. Browser test checks full disposal reaches zero geometry count and explicitly releases the WebGL context. Three.js retained a texture counter of 1 after normal disposal; actual context release is asserted instead of assuming internal counters must all reset. Asset LOD0→LOD1 transition uses hysteresis. All rendered values are measured, not simulated FPS labels. Hidden-tab frames are excluded; visible slow frames remain in timing samples.

The 5k visual rail segments are a rendering load and do not constitute 5k working constructed routes. The 99 extra train bodies are rendering proxies. Full traction, reservations, cargo and economy are not included in this scene; do not claim the complete 100-train game has been benchmarked.

## Core scale results

npm run spike:network builds an actual 5,000-edge graph snapshot. Reference run: compile ~49.5 ms once; 100 end-to-end shortest-path queries ~103.2 ms total; 100 logical trains advanced for 1,200 ticks in ~4.1 ms total (~0.0034 ms per 100-train tick). These are distance-motion kernels with no economy or occupancy. Retain the cache across queries; do not compile inside the tick loop. Stage large graph rebuilds as application work, then swap at a tick boundary.

Earlier geometry/terrain microbenchmark: 1,000 curves / 257k samples ~64 ms, 100k terrain queries ~25 ms before the interpolation revision. Re-run npm run spike for current comparisons; historical timing is not a CI promise.

## Distribution and future targets

Build is static and fonts are bundled locally. The STATION-002 production build reports app JavaScript 249.26 KB / 74.80 KB gzip, Three.js 640.71 KB / 160.48 KB gzip and CSS 23.28 KB / 6.10 KB gzip. The Norway campaign pack is loaded separately and contains 64 GLBs plus 12 PNGs (1.19 MiB downloaded; about 7.0 MiB decoded texture allocation including mipmaps). The 500 KB Three.js chunk advisory remains visible and is acceptable for this engine dependency; the complete initial payload is well below the 5 MB goal. Add menu/lazy campaign loading when content grows, not a warning suppression.

Targets remain preferred 60 FPS / minimum 30 on an explicitly tested device profile, simulation ≤4 ms at 1×, initial app/core under 5 MB compressed, Norway pack under 25 MB. Future tests must cover long sessions, real 100-train service/occupancy, weak GPUs, full 16 km terrain, larger saves and graphics-heavy production assets. Use uniform world buckets for coverage/collision, direct cells for terrain and bounded per-revision graph caches. Cluster vegetation spatially if culling becomes limiting; avoid individual object overhead.
