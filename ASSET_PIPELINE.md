# Asset pipeline

Graphics enhancement, 2026-09-14: [Norway graphics handoff](docs/art/NORWAY_GRAPHICS_PLAN.md) now includes a completed separate Blender scenery generator for fractured rocks and mixed vegetation. Period buildings and rolling-stock texture work continue in GFX-006/GFX-006B.

Planned texture extension: [Norway timber and rolling stock](docs/art/NORWAY_TEXTURES_AND_ROLLING_STOCK.md) defines curated wall/trim/door palettes, original colour/normal/ORM maps, shared atlas ownership, UV/LOD and residency limits, current steam/coach/freight detail, and separately dated future diesel/electric briefs. GFX-006B integrates current rolling stock after the building kit; later vehicle classes remain separate content work. These deliverables have not been generated.

Verified locally: Blender 4.0.2, Python 3.10.13, glTF 2.0 exporter, background CLI. Executable: `/Applications/Blender.app/Contents/MacOS/Blender`. Python and glTF export operator were inspected through the actual running application.

Generate:

```sh
"/Applications/Blender.app/Contents/MacOS/Blender" --background --factory-startup --python tools/blender/generate_probe.py
"/Applications/Blender.app/Contents/MacOS/Blender" --background --factory-startup --python tools/blender/generate_norway_pack.py
"/Applications/Blender.app/Contents/MacOS/Blender" --background --factory-startup --python tools/blender/generate_norway_scenery.py
npm run validate:assets
```

Use an equivalent Blender executable path on other machines. Script targets Blender 4.0+; other versions need the same validation before adoption. No manual editing is required.

Directories: `tools/blender/` contains authoritative generators; `assets/source/blender/` contains generated editable `.blend` intermediates (ignored); `assets/runtime/models/core/` retains the isolated architecture probes; `assets/runtime/models/norway/` contains the tracked production GLBs; and `assets/runtime/packs/norway.json` is the selected-campaign manifest. Generated runtime models are intentional distribution source assets, not bundled build output.

Units: metres, Blender scale_length=1. Source: +Z up and +Y vehicle forward. Runtime glTF: +Y up and −Z forward, right handed. X remains X. Runtime transform from source is `(x,z,-y)`. The exporter performs this conversion once; do not apply it a second time in the importer. Object scale applied, no nonuniform runtime scale. Root coordinate (0,0,0) is wheel-contact plane at vehicle center. Position origin remains identical across LODs.

Wagon test: 10 m body, 2.8 m width, 3.2 m overall height; forward-colored marker extends total length to 10.1 m. Named empty nodes: coupler_front, coupler_rear, forward_probe, up_probe. Tests confirm +6 m source-forward maps to runtime Z=−6 and +2 m source-up maps to runtime Y=2. Couplers are at ±5.2 m longitudinal distance. Proxy wheels are boxes; they are not production vehicle art.

Materials: three shared, original solid-color PBR materials, roughness .65, no textures, opaque. Names prefixed `RF_`. Mesh names identify component purpose. Mesh normals exported and NORMAL accessor count verified. Both GLBs now load through the actual Three.js GLTFLoader. Imported finite normal buffers, material count, lit appearance, dimensions and axis markers were checked; the close-camera screenshot is part of browser evidence. Textured/tangent-space normal maps remain outside this solid-color probe.

LOD0: body/chassis/marker/wheel proxies, 84 triangles, 11,736 bytes. LOD1: remove wheel proxies, 36 triangles, 5,672 bytes. Both have matching pivot, material names and attachment coordinates; geometry bounds intentionally differ where wheels are removed. Production uses Three.js LOD with a 180 m vehicle transition, longer prop thresholds and 15% hysteresis. Trees, houses and bridge parts use instancing rather than individual scene objects.

Validation checks GLB header/version/length, JSON structure, finite transforms, applied rotation/scale, bounded dimensions, positions/normals accessor presence/counts, material count, triangles, file size, attachment existence and axis marker positions. This structural CLI test intentionally reports engineImportValidated=false because it does not launch a browser. Separately, npm run test:browser proves runtime import, finite vertex normals, visual shading inspection, LOD switches and resource replacement/disposal. Untested extensions are not assumed supported. Initial probe limit: <2,000 triangles, ≤4 materials, <100 KB per LOD.

Production pack after GFX-005: 19 original asset types and 38 GLBs total 716 KB. The original eight railway/house assets remain, joined by four tree forms, two understorey forms and five rock/scree forms from `generate_norway_scenery.py`. Every vehicle preserves front/rear couplers and axis probes across LODs; props preserve ground, platform, track or span anchors. All remain below their per-file triangle and byte budgets.

Runtime selection: Three.js first requests `/packs/norway.json`, then loads exactly that manifest's model files in parallel. Vehicles and stations use distance-switched LOD objects. Vegetation and rocks use deterministic, frustum-cullable 4 km instance tiles; houses and bridge parts remain instanced. Collision remains on logical footprints and the track graph. GFX-005 records 1.40 million submitted regional triangles and 636 draw calls; GFX-007 owns draw-call consolidation. No compression extension is used.

Status: Blender → GLB → Three.js is validated for both the architecture probe and the production Norway pack. Blender 4.0.2 generated the checked-in artifacts locally; the browser validated all normals, bounds, LODs, selected-pack requests, close/strategic views and complete WebGL disposal. Astra is a Codex model, not an engine. GLB remains the runtime asset format.
