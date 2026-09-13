# Technical debt

| ID | Description / reason | Impact | Resolution | Priority |
|---|---|---|---|---|
| TD01 | Graph recompiles geometry and scans nodes/edges; intentionally small proof | Poor large-network routing | Revision cache, adjacency and priority queue after correctness tests | High before scale |
| TD02 | Sample-midpoint engineering and constant material masks | Narrow hazards and biome costs absent | Terrain-boundary subdivision, masks and span transition validation | High before construction |
| TD03 | Motion proof uses fixed externally supplied speed | No traction/braking/dwell/occupancy | Dedicated tick systems per implementation backlog | High before gameplay |
| TD04 | Curve compilation lacks railway radius/grade-extrema tests | Smooth-looking invalid alignments possible | Geometry technical spike before approving construction | Architecture gate |
| TD05 | Experimental save has future gameplay fields missing | Cannot promise released-save compatibility | Complete fields and migration fixtures before first release | High |
| TD06 | Save resource guard is character limit only | Huge nested/entity payload may be expensive | Byte/entity/geometry limits before IndexedDB/import exposure | High before browser imports |
| TD07 | Renderer port and Readonly snapshot are type-only contracts | Mutation isolation and graphics assumptions unverified | Implement snapshot ownership and actual-engine adapter tests | High |
| TD08 | Probe wheels are cubes; LOD removes them | Only axis/scale validation, unsuitable final art | Replace after pipeline gate with original procedural vehicle kit | Low until pipeline passes |
| TD09 | Migrations registry has no real predecessor fixture | Migration mechanism unproven | Implement version bump with progress guard and 1→2 fixture | Medium before release |
