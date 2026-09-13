# Performance

Measured on 2026-09-13, local macOS arm64, Node v25.8.0. One `npm run spike` run compiled 1,000 approximately 1.1 km curves (257,000 samples) in 64.0 ms and performed 100,000 bilinear terrain queries in 25.2 ms. Initial save: 735 bytes. A 10-second 60 FPS clock feed at 8× produced exactly 1,600 simulation steps. Timings are microbenchmarks without GPU, rendering, economy, graph scale, allocations over a long session or trains at target population. Re-run for comparisons; do not use these single-run values as fixed CI thresholds.

Targets, not results: preferred 60 FPS, minimum 30 on a recorded supported hardware/browser profile; simulation ≤4 ms of a 16.7 ms render-frame budget under normal 1× load. Benchmark 100 trains, 20k vegetation instances, 2k buildings and 5k rail edges at 1× and 8×. Record p50/p95 frame and tick times, draw calls, visible triangles, memory, load times and save latency. Establish actual supported device/browser list with engine discovery.

Proposed browser budgets: initial compressed application/core content <5 MB, initial Norway pack <25 MB, no future-campaign eager downloads. Current runtime probe assets total 17,408 bytes uncompressed; no application bundle exists. These are targets pending renderer/package selection.

Spatial plan: direct cell indexing for terrain, uniform world buckets for construction/coverage/settlement search, engine or chunk frustum culling for graphics. Confirm density before adding more complex indices. Track geometry cached by edge ID + graph revision; adjacency rebuilt incrementally. Background geometry preparation must not mutate simulation asynchronously; commit validated results at command boundary.

LOD plan: terrain chunks; instanced tree variants; shared materials; strategic rail simplification; buildings and vehicles selected by projected size. Geometry caches are bounded and disposed on replacement. No GPU or large-vegetation claim is validated yet. The mandatory Norway benchmark must report water, waterfall, bridge, tunnel portal, trees and visibly moving train with production-like camera movement.
