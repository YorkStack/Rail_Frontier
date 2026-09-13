# Rail_Frontier
Web-based single-player railroad tycoon simulation with beautiful 3D landscapes, campaigns, economy, train routing, savegames and dynamic terrain. Build rail networks through Norwegian fjords, Arizona red-rock country and major river landscapes with bridges, tunnels, cities and industries.

## Current status

Architecture foundation only; there is no playable browser application yet. The repository initially contained this README and the MIT license. The intended Astra Engine integration is missing and needs identification before browser/renderer work. See [CURRENT_STATUS.md](CURRENT_STATUS.md).

Implemented: strict TypeScript domain model, terrain queries, rail curves and graph routing, terrain-aware engineering quotes, fixed-step clock, distance-based train motion proof, validated save serialization and original scripted Blender wagon exports at two LODs.

## Reproduce the current foundation

Requirements: Node 22+ and npm; Blender 4.0+ for asset regeneration. Tested with Node 25.8.0/npm 11.11.0 and Blender 4.0.2 on macOS arm64.

```sh
npm ci
npm run check
npm test
npm run validate:assets
npm run spike
```

Small runtime GLBs are included, so Blender is optional for these checks. Regenerate original assets with:

```sh
"/Applications/Blender.app/Contents/MacOS/Blender" --background --factory-startup --python tools/blender/generate_probe.py
```

Use your local Blender executable on other platforms. There is no `npm run dev` or browser build command yet; adding one depends on confirming the engine. No deployment has been configured.

## Continue development

Read [ARCHITECTURE.md](ARCHITECTURE.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), [DATA_MODEL.md](DATA_MODEL.md), [SAVEGAME_FORMAT.md](SAVEGAME_FORMAT.md), [DECISIONS.md](DECISIONS.md), [ASSET_PIPELINE.md](ASSET_PIPELINE.md) and [CURRENT_STATUS.md](CURRENT_STATUS.md).

The required Astra → Sol handoff has **not** been reached. See [ASTRA_ESCALATIONS.md](ASTRA_ESCALATIONS.md). Do not claim engine validation from CPU tests or GLB file inspection. The first product milestone remains the Norwegian passenger vertical slice, followed by timber/lumber freight.

MIT license preserved. Dependency notices: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
