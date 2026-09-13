# Rail Frontier

Original browser-based single-player railroad strategy game. Build networks through Norwegian fjords, then expand the same systems to Arizona and great river landscapes. MIT licensed.

**Current milestone: passenger simulation implemented, production UI in progress.** The browser runs the atomic game application over the validated 3D fjord scene. Construction, stations, vehicle purchase, routes, traction, occupancy, passenger demand/delivery, finance, objectives and transactional saves are implemented in the application/simulation layer. The current visible shell exposes live company status, train service, speed/camera controls, save/load/autosave and commit-ready engineering surveys. Full player-driven station/train/route panels and the generated 16 km renderer remain in progress.

Astra and Sol refer to Codex models. The actual rendering engine is **Three.js**, with TypeScript and Vite. The required Astra → Sol handoff is documented in [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Run

Node ≥22.12 and npm required. Tested on Apple M2 Pro with Node 25.8.0, npm 11.11.0 and Chrome 153.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Drag to orbit, right-drag to pan, scroll to zoom; WASD pans. F follows the train, R restores the regional camera, Space pauses/resumes, Escape closes the survey. Background tabs pause explicitly. Survey track compares coastal/bridge/tunnel elevation and cost without constructing infrastructure. Save/load persists the study to IndexedDB.

The diagnostics button exposes tree visibility and a clearly identified rendering stress scene. Debug programmatic inspection is available only in development builds. The visible shell is an implementation preview, not the finished game menu and management interface.

## Validate and build

```sh
npm run check
npm test
npm run validate:assets
npm run test:browser
npm run spike
npm run spike:network
npm run build
npm run preview
```

Browser tests require installed Google Chrome (Playwright channel chrome). They start/reuse the local Vite server. Build emits a static site in dist; preview serves on port 4173. No deployment configured or performed. Font assets are bundled locally. The 637 KB Three.js chunk produces Vite's normal size advisory; about 160 KB gzip, within the current total download budget.

## Reproduce Blender assets

Blender is optional to run tests because the small runtime GLBs are tracked. Tested generator: Blender 4.0.2 / Python 3.10.13.

```sh
"/Applications/Blender.app/Contents/MacOS/Blender" --background --factory-startup --python tools/blender/generate_probe.py
npm run validate:assets
```

Use the matching local Blender executable on other platforms. [ASSET_PIPELINE.md](ASSET_PIPELINE.md) defines units, axes, materials, naming, LOD and validation.

## Continue in Sol

Read [CURRENT_STATUS.md](CURRENT_STATUS.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_MODEL.md](DATA_MODEL.md), [ECONOMIC_CONTRACT.md](ECONOMIC_CONTRACT.md), [SAVEGAME_FORMAT.md](SAVEGAME_FORMAT.md), [DECISIONS.md](DECISIONS.md) and [ASSET_PIPELINE.md](ASSET_PIPELINE.md). The prepared study is isolated in spikes; reuse validated kernels without treating demonstration code as production simulation.

Tests: [TESTING.md](TESTING.md). Measured limits: [PERFORMANCE.md](PERFORMANCE.md). Engine evidence: [RENDERING_CAPABILITIES.md](RENDERING_CAPABILITIES.md). Dependency/art attribution: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
