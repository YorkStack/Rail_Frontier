# Rendering capability matrix

Selected engine: Three.js 0.186.0, MIT. “Astra Engine” in the initial directive was clarified by the user to mean the Astra coding model. Evidence comes from the installed implementation and the running browser study, not an assumed API.

| Feature | Classification | Actual evidence |
|---|---|---|
| Scene / mesh / material / lights | Supported | Scene, BufferGeometry, MeshStandardMaterial, HemisphereLight and DirectionalLight in running study |
| Procedural terrain and track | Supported with custom generation | src/rendering meshes; same triangle surface as simulation |
| glTF / GLB | Supported | GLTFLoader.loadAsync imports both actual Blender GLBs; marker/bounds/normals checks |
| Coordinate conversion | Supported | Y-up, −Z forward, identity scale and correct attachment nodes |
| Instancing | Supported | Material-merged 8 km detail quadrants, sampled distant canopy, 20k-tree/2k-building/99-proxy stress scene |
| LOD / hysteresis | Supported | LOD.addLevel at 180 m with .15 hysteresis; close/far browser checks |
| Camera / damping / input | Supported with application policy | OrbitControls, zoom/pan/orbit/tilt, WASD, focus/follow/regional, terrain clearance |
| Picking | Supported | Raycaster terrain hits agree within 0.001 m (measured max ~0.00000742 m) |
| Water / waterfall | Requires custom implementation | ShaderMaterial animated water and surface-following waterfall strip proven |
| Shadows / haze / color pipeline | Supported | Camera-following 2,048² PCF sun shadows, FogExp2, ACES tone mapping, sRGB output |
| Asset normals / materials | Supported | Finite imported normal buffers, 12 manifest textures and material bindings; close views inspected |
| Animation / audio | Partially validated | Time-uniform animation and graph motion proven; skeletal clips/audio not needed/tested |
| Frustum culling / spatial | Supported for Norway scene | 8 km detailed quadrants plus hysteretic global distant-canopy representation |
| Physics / rail graph / economy | Requires custom implementation | Pure simulation owns these; no generic rigid-body engine selected |
| Persistence / UI | Requires custom implementation | IndexedDB backend and DOM study UI implemented outside renderer |
| Browser compatibility | Partially validated | Chrome 153 headless integration plus Codex in-app browser on local Mac; other browser/device profiles pending |
| WebGPU | Unsupported by selected adapter | Current adapter intentionally uses WebGLRenderer/WebGL2 |
| Resource lifecycle | Supported | Replacement returns to baseline; full disposal removes geometry and explicitly releases WebGL context |

Inspected installed source: three/src/renderers/WebGLRenderer.js, three/src/objects/LOD.js, three/examples/jsm/loaders/GLTFLoader.js. Reference documentation: [Three.js API](https://threejs.org/docs/), [glTF loader](https://threejs.org/docs/#GLTFLoader), [OrbitControls](https://threejs.org/docs/#OrbitControls). Installed code and tests take precedence over website wording.
