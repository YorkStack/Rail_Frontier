# Rail Frontier

Original browser-based single-player railroad strategy game. Build networks through Norwegian fjords, then expand the same systems to Arizona and great river landscapes. MIT licensed.

**Current milestone: the Norway passenger, mail, timber-freight, first town-economy, management-reporting, electrification, portable-save and safe-dispatch gates are complete.** The browser runs the atomic game application across the generated 16 km fjord. Players can build track and six progressively larger station classes, upgrade stations, buy passenger or freight consists from a year-aware vehicle catalogue, create ordered shuttle or loop routes, electrify routes, carry people, mail and timber, grow connected towns, inspect live trains/stations/towns/industries, compare company/train/route profitability, read three map overlays, import/export save archives and complete campaign objectives. Station-to-station path reservations keep opposing trains outside occupied single-track corridors. The production scene uses an original two-LOD Blender pack with mixed Norwegian vegetation and rocks, timber settlements, industries, detailed current rolling stock and researched El 1, Di 3B, Di 4 and El 18 era locomotives; electrified edges visibly gain overhead-line portals and wires.

Astra and Sol refer to Codex models. The actual rendering engine is **Three.js**, with TypeScript and Vite. The required Astra → Sol handoff is documented in [CURRENT_STATUS.md](CURRENT_STATUS.md).

## Current build

The Norway vertical slice is playable now. It has the complete build → station → consist → route → delivery → revenue loop, passenger, mail and timber traffic, town growth, objectives, save archives and safe single-track dispatch. Corrected roofs, settlement-scale opening cameras, natural terrain materials, camera-aware vegetation and Norway V3 landmark cliffs/waterfall have landed. Arizona V2 geology and original circa-1900 architecture are complete. Semantic construction terrain, retaining walls, exact bridge/tunnel transitions, the engineering profile and worker-based route alternatives are implemented. The guided first-service tutorial is the next active milestone. Deployment, supported browser/device checks and permanent released-save upgrade fixtures follow. Arizona and Great River are later content expansions and do not block a first Norway release.

An isolated Arizona terrain and scenery study is also available at `http://127.0.0.1:5173/?skip-menu=1&world=arizona`. Its current heightfield previews a 24 km basin with irregular stepped mesas, broken escarpments, talus and connected meandering canyon branches, plus desert materials and habitat-based procedural vegetation, without the Norway HUD. Ten original Blender building types replace the former boxes across three composed settlements, with gabled, hipped, adobe, false-front and railway/industrial forms. Arizona gameplay, US rolling stock and campaign selection follow later in EXP-004/005.

**2026-09-20 implementation update:** CON-01–06 deliver station-first placement, continuous horizontal/vertical alignment planning, deterministic terrain earthworks, quoted station pads, engineering review and terrain-aware corridor alternatives. The completed route planner searches a capped coarse-to-fine heading/elevation lattice in a cancellable Web Worker, rejects stale results and revalidates every candidate against live authoritative terrain. GFX-R03–07 provide natural terrain materials, camera-aware vegetation, Norway V3 cliffs/waterfall, Arizona V2 geology and 20 original Arizona architecture GLBs across 180 deterministic building plots.

Runtime checkpoint `8926412` passes 158 active Node tests, focused Norway and Arizona landform/material/architecture browser checks, semantic construction, repeated current-scene replacement and full passenger/mail/save browser journeys, TypeScript and the test build. Pre-release Norway and Arizona V1 content has been deleted. Schema 8 rebuilds persisted station pads and alignment earthworks deterministically over the immutable base terrain; moderate slopes receive a visible cut/fill quote and level built pad. Bridge modules, abutments, tunnel portals and retaining walls use those saved results and suppress duplicate transitions across curve joins. The alignment review plots terrain against rail, marks construction types, reports grade/radius and exact cost totals, and links profile hover to the 3D survey. The focused construction run keeps simulation and rendered triangles within 0.001 m.

| Norwegian fjord landscape and live HUD | Steam passenger service |
| --- | --- |
| ![A regional view over the Norwegian fjord landscape with the game HUD](docs/screenshots/norway-landscape-hud.png) | ![A steam locomotive and passenger coaches on the Northern Line](docs/screenshots/train-service.png) |
| Sundvik station and timber village | Landscape and motion settings |
| ![Sundvik station, train and Norwegian timber houses](docs/screenshots/sundvik-station.png) | ![Rail Frontier landscape and motion settings menu](docs/screenshots/settings-menu.png) |
| Engineering review and build quote | Arizona V2 settlement street |
| ![Rail Frontier alignment planner with engineering profile, construction types and quote](docs/screenshots/alignment-engineering.png) | ![Arizona V2 period settlement with varied railway, timber, brick and adobe buildings](docs/screenshots/arizona-street.png) |
| Arizona V2 canyon landscape | |
| ![Arizona V2 canyon, sandstone terrain and desert vegetation](docs/screenshots/arizona-canyon.png) | |

## Run

Node ≥22.12 and npm required. Tested on Apple M2 Pro with Node 25.8.0, npm 11.11.0 and Chrome 153.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Drag to orbit, right-drag to pan, scroll to zoom; WASD pans. F follows the train, R restores the regional camera, Space pauses/resumes, and Escape closes the active panel. Map labels and rendered trains/stations open live detail cards. The Operations panel reports cash, monthly results, infrastructure and owned-asset value, plus train and route profitability. The Overlays panel shows station catchments, industry sites and current track reservations. Background tabs pause explicitly. Save/load persists the company to IndexedDB; the company archive can export and import portable `.railfrontier.json` backups.

### First company

1. Choose **Build station**. Click suitable ground near Sundvik, rotate the platform toward Granli and build. The preview shows the platform footprint, internal track and both connection rings.
2. Build a second station near Granli and point it along the same corridor.
3. Choose **Build tracks**, select **Plan between rail connections** and choose a local, regional or main-line standard. Click the outward connection ring at the first station, add optional waypoints, then click the second station's glowing connection. The preview fits a smooth vertical profile and level platform approaches. Use **Undo point** or right click to revise, review the quote and build the complete alignment.
4. Open **Trains & lines**, buy a locomotive with one or more cars, add both stations as ordered stops, create the route and assign the train.
5. Run at 4× or 8× and watch passengers, mail, freight and company results. Save from the header or create a named archive slot in the main menu.

The commissioned preview already contains a legacy three-station railway and a passenger train. **Start new company** opens the new station-first construction flow.

The diagnostics button exposes tree visibility and a clearly identified rendering stress scene. Debug programmatic inspection is available only in development builds. The visible shell is an early playable interface and remains subject to release polish.

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

Browser tests require installed Google Chrome (Playwright channel chrome). They build and serve a static test-mode bundle on port 5173; the normal preview serves on port 4173. No deployment configured or performed. Font assets are bundled locally. The Three.js chunk produces Vite's normal size advisory and remains within the current compressed download budget.

README screenshots are captured from the running application with `npm run screenshots:readme`. Set `RAIL_FRONTIER_URL` to capture a server other than `http://127.0.0.1:5173`.

## Reproduce Blender assets

Blender is optional to run tests because the small runtime GLBs are tracked. Tested generator: Blender 4.0.2 / Python 3.10.13.

```sh
"/Applications/Blender.app/Contents/MacOS/Blender" --background --factory-startup --python tools/blender/generate_norway_pack.py
npm run validate:assets
```

Use the matching local Blender executable on other platforms. [ASSET_PIPELINE.md](ASSET_PIPELINE.md) defines units, axes, materials, naming, LOD and validation.

## Continue in Sol

Read [CURRENT_STATUS.md](CURRENT_STATUS.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DATA_MODEL.md](DATA_MODEL.md), [ECONOMIC_CONTRACT.md](ECONOMIC_CONTRACT.md), [SAVEGAME_FORMAT.md](SAVEGAME_FORMAT.md), [DECISIONS.md](DECISIONS.md) and [ASSET_PIPELINE.md](ASSET_PIPELINE.md). The active renderer is `src/rendering/fjord-renderer.ts`; the small study fixtures remain isolated under `spikes/`.

Tests: [TESTING.md](TESTING.md). Measured limits: [PERFORMANCE.md](PERFORMANCE.md). Engine evidence: [RENDERING_CAPABILITIES.md](RENDERING_CAPABILITIES.md). Dependency/art attribution: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
