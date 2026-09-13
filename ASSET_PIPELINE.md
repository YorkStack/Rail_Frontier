# Asset pipeline

Verified locally: Blender 4.0.2, Python 3.10.13, glTF 2.0 exporter, background CLI. Executable: `/Applications/Blender.app/Contents/MacOS/Blender`. Python and glTF export operator were inspected through the actual running application.

Generate:

```sh
"/Applications/Blender.app/Contents/MacOS/Blender" --background --factory-startup --python tools/blender/generate_probe.py
npm run validate:assets
```

Use an equivalent Blender executable path on other machines. Script targets Blender 4.0+; other versions need the same validation before adoption. No manual editing is required.

Directories: `tools/blender/` contains authoritative generators; `assets/source/blender/` contains generated editable `.blend` intermediates (ignored); `assets/runtime/models/core/` contains small tracked GLB distribution assets. Future custom authored .blend files need an explicit source-control/LFS decision before adding large binary sources. These generated runtime probes are intentional source assets, not bundled builds.

Units: metres, Blender scale_length=1. Source: +Z up and +Y vehicle forward. Runtime glTF: +Y up and −Z forward, right handed. X remains X. Runtime transform from source is `(x,z,-y)`. The exporter performs this conversion once; do not apply it a second time in the importer. Object scale applied, no nonuniform runtime scale. Root coordinate (0,0,0) is wheel-contact plane at vehicle center. Position origin remains identical across LODs.

Wagon test: 10 m body, 2.8 m width, 3.2 m overall height; forward-colored marker extends total length to 10.1 m. Named empty nodes: coupler_front, coupler_rear, forward_probe, up_probe. Tests confirm +6 m source-forward maps to runtime Z=−6 and +2 m source-up maps to runtime Y=2. Couplers are at ±5.2 m longitudinal distance. Proxy wheels are boxes; they are not production vehicle art.

Materials: three shared, original solid-color PBR materials, roughness .65, no textures, opaque. Names prefixed `RF_`. Mesh names identify component purpose. Mesh normals exported and NORMAL accessor count verified. Both GLBs now load through the actual Three.js GLTFLoader. Imported finite normal buffers, material count, lit appearance, dimensions and axis markers were checked; the close-camera screenshot is part of browser evidence. Textured/tangent-space normal maps remain outside this solid-color probe.

LOD0: body/chassis/marker/wheel proxies, 84 triangles, 11,736 bytes. LOD1: remove wheel proxies, 36 triangles, 5,672 bytes. Both have matching pivot, material names and attachment coordinates; geometry bounds intentionally differ where wheels are removed. The validated study uses Three.js LOD with a 180 m transition and 15% hysteresis. Production may convert this to projected-size thresholds; preserve pivots and test each switch. Trees use instancing and distant clusters/culling; do not create individual heavy scene objects for every tree.

Validation checks GLB header/version/length, JSON structure, finite transforms, applied rotation/scale, bounded dimensions, positions/normals accessor presence/counts, material count, triangles, file size, attachment existence and axis marker positions. This structural CLI test intentionally reports engineImportValidated=false because it does not launch a browser. Separately, npm run test:browser proves runtime import, finite vertex normals, visual shading inspection, LOD switches and resource replacement/disposal. Untested extensions are not assumed supported. Initial probe limit: <2,000 triangles, ≤4 materials, <100 KB per LOD.

Proposed production budgets: close vehicle ≤12k triangles; LOD1 ≤3k; strategic proxy ≤300; shared textures up to 2K with smaller prop atlases. Collision uses logical footprints/track graph, not detailed triangle physics. Rails use runtime generated ribbons; sleepers, bridge pieces and tree variants use instances where the actual engine supports them. Use no texture compression extension until engine support is verified.

Status: Blender → GLB → Three.js is validated. Astra is the coding model, not an engine. GLB is the selected runtime asset format. Pipeline standards are ready for original production assets after the passenger-loop milestone; do not expand content volume before gameplay.
