# Astra Engine capability matrix

Inspection date: 2026-09-13. No engine files or dependency exist in the supplied repository. Engine identity has been requested. Absence of evidence is not evidence that an engine feature is unsupported.

| Feature | Classification | Evidence / next experiment |
|---|---|---|
| Scene/entity model | Needs technical spike | Obtain actual source/package, construct/dispose scene |
| Mesh buffers, procedural geometry | Needs technical spike | Import API, build track ribbon |
| Materials/textures/lighting/shadows | Needs technical spike | Display exported wagon with lit materials |
| Cameras/controls/picking | Needs technical spike | Pan/orbit/zoom/pick terrain |
| Animation/shaders/particles/audio | Needs technical spike | Inspect installed code before selecting APIs |
| Instancing/culling/spatial structures | Needs technical spike | 20,000-tree scene and GPU counters |
| Terrain/water | Needs technical spike | Heightfield agreement, depth, waterfall scene |
| glTF/GLB import | Needs technical spike | Load both generated LODs and check coordinate markers |
| LOD switching/disposal | Needs technical spike | Switch assets without pop in pivot or resource growth |
| Physics/UI/browser support | Needs technical spike | Inspect integration, browser compatibility |
| Rail graph/pathfinding/economy | Requires custom implementation | Pure TypeScript graph foundation exists; economy planned |
| Fixed simulation clock | Requires custom implementation | Tested independent of engine |
| Save schema and migrations | Requires custom implementation | Initial schema validator and empty migration registry exist |

No feature has been certified “supported” by the actual Astra Engine. No substitute engine has been silently introduced. Blender export and GLB structural validation do not constitute runtime import validation.
