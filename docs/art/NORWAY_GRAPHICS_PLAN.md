# Norway graphics enhancement — implementation handoff

Date: 2026-09-14. Status: **planning complete; implementation has not started**.
User instruction: improve Norway using real maps and landscape photography, original Blender rocks, forests, vegetation and buildings; do this before further gameplay work; pause after planning so the user can switch to Sol.

## Checkpoint and continuation

- Gameplay checkpoint: `fb0abf4` — `Add company and route reporting`, branch `implementation/passenger-slice`.
- FIN-002 is complete. Previous checkpoint validation: 77 Node tests, 9 browser tests, asset checks and build. These are prior results, not new graphics validation.
- Save schema 3, Norway campaign version 1, world generator version 1, Three.js 0.186.0, app 0.3.0.
- Resume order: **GFX-001 → GFX-002 → GFX-003 → GFX-004 → GFX-005 → GFX-006 → GFX-006B → GFX-007 → GFX-008 → mail transport**.
- Mail waiting/demand exists in town state, but mail cargo, transport, delivery and income are still unfinished. Do not start that work during this graphics pass.
- This document resolves the graphics architecture; implementation still needs actual Blender exports, engine integration, old-save tests, visual comparison and performance measurements. Planning approval is not a claim that those gates pass.

Texture/detail extension: [NORWAY_TEXTURES_AND_ROLLING_STOCK.md](NORWAY_TEXTURES_AND_ROLLING_STOCK.md) adds inspected Norwegian house/locomotive photographs, red/yellow/charcoal/white timber palettes with contrasting trim, current rolling-stock detail and future locomotive briefs by era. Its GFX-006B is mandatory before composition/performance. Both documents are planning only.

## Art direction

Build a more natural, geographically coherent **inner Sogn fjord landscape in summer**, inspired by Aurlandsfjord, Nærøyfjord/Bakka and Undredal. Keep Sundvik, Granli and Fjellhavn as fictional campaign towns. The map is a playable interpretation; it is not a surveyed replica of these real places or of the historical Flåm Railway.

The regional view must read as water confined between distinct mountain masses. Middle distances show woodland masses, exposed cliff bands, gullies and meadows. Near the railway, individual branches, rock faces, foundations, roof edges and track ballast establish scale. Use dark blue-green water, grey rock with cool shadow and warmer weathering, varied green foliage, timber houses in warm white, ochre yellow, iron-oxide red and charcoal with selected contrasting white trim, plus restrained farm buildings. Snow is sparse and confined to plausible upper sheltered pockets; a summer scene must not whiten every slope above 620 m.

Map and photographic observations inform shape and placement. Numeric species weights, slope thresholds, asset budgets and camera distances below are **implementation starting values**, not measured ecological or topographic data.

## Reference register — consulted 2026-09-14

| ID | Source | Application |
|---|---|---|
| R1 | [Kartverket Norgeskart: Undredal and surrounding fjords](https://www.norgeskart.no/?lon=72870.4989381904&lat=6783024.399992494&rotation=0&zoom=11&backgroundLayer=topo) | Actual topographic map inspected at regional and village scales. Read bends, both shores, closely spaced slope contours, tributaries, valley-floor fields and village footprints. URL coordinates are the service's projected values, not longitude/latitude degrees. |
| R2 | [Kartverket maps and geospatial data](https://www.kartverket.no/en/api-and-data) | Verified N50 and elevation-data availability. Data catalogue reference; no DEM has been downloaded, imported or quantitatively sampled in this planning pass. |
| R3 | [UNESCO West Norwegian Fjords](https://whc.unesco.org/en/list/1195/) and [official maps](https://whc.unesco.org/en/list/1195/maps/) | Corroborates steep rock walls, mixed deciduous/conifer woods and glacial landforms. The large 2023 map PDF exceeded the web reader limit; local cartographic observations come from R1. |
| R4 | [Flam Travel Guide: fjord villages](https://flamtravelguide.com/flam-fjord-travel-guide/) | Visually inspected the Undredal waterfront photograph: varied pitched-roof houses, stone retaining edges, open pasture and clustered round-canopy trees. Aurland photograph: both fjord walls, high bare rock, forest belts and atmospheric separation. Modern cars, roads and large glazing are excluded from the 1900 asset brief. |
| R5 | [Linas Reisen: Rimstigen / Nærøyfjord](https://linasreisen.com/rimstigen-naeroyfjord/) | Visually inspected the photograph `img_20180628_101401.jpg`: coherent cliff face, vegetated ledges, triangular talus fans, lighter meadow at shore, leafy foreground and dark water. |
| R6 | [Kringom: Bygda Undredal](https://kringom.no/nb/indre-sogn/aurland/bygda-undredal) | Historical check: clustered farm settlement, a preserved 1736 house, relocation after the 1902 land reorganisation, and a photograph captioned circa 1920. Use clustered farm courts as a 1900 design reference; do not reconstruct modern road access as historical fact. |
| R7 | [Visit Sognefjord: Old Lærdalsøyri](https://en.sognefjord.no/attractions/old-town-of-laerdalsoyri/) | Supporting reference for a regional timber-building vocabulary and a compact old settlement. |

Local, ignored research captures: `artifacts/graphics-planning/norgeskart-region.png`, `norgeskart-undredal.png`, `undredal-photo.png`, `aurland-photo.png`, `bakka-photo.png`. These last five were visually inspected. Other trial captures in that directory include consent/security screens and are not evidence of landscape review. Locationscout was useful for discovery but its automated browser views were blocked; the reviewed photography is R4/R5.

Reference photographs are research material, not game textures or assets. Keep links and attribution in this document; do not ship or commit the third-party image captures. Create original Blender geometry and original procedural/baked textures. A direct geodata import is outside this bounded pass; if later introduced, record exact dataset/version, projection, resampling, attribution and terms separately.

## Current implementation audit

| Finding | Evidence | Required correction |
|---|---|---|
| Repeated smooth mountain waves and a one-sided fjord strip | `src/world/generator.ts`: analytic shoreline and sinusoidal relief | V2 uses authored fjord/valley/ridge shapes and directed erosion details. |
| Pale broad slopes and directional stripes | `src/rendering/terrain-mesh.ts`: height-only rock/snow blend, X-only slope estimate and sinusoidal colour multiplier | Use complete surface normals, surface masks, multi-scale material detail and summer snow placement. |
| Scattered conical trees do not form a forest | `authoredForest()` always instantiates spruce LOD1, does not use forest/urban masks or local slope | Mixed species, clustered placement, proper near/mid/far representation and exclusion masks. |
| Repeated houses scattered across slopes | `authoredBuildings()`: 360 identical houses around random circles, no footprint or slope rejection | Small coherent settlements, varied original models, terrain fit and actual path/rail clearances. |
| New track can intersect decorative scenery | Hardcoded corridor/stream exclusions instead of live railway geometry | Spatial exclusions from current graph/stations; invalidate affected scenery tiles after construction/load. |
| Rock is only a colour; close ground lacks structure | No dedicated exposed-rock, boulder or scree pack | Blender rock kit, terrain material and constrained surface dressing. |
| One huge shadow volume loses near detail | 2048 shadow map spread over scaled regional bounds; fixed large normal bias | Camera-local shadow region, near-only vegetation casters, tuned bias and contact detail. |
| Apparent missing/weak rail contact in close evidence | `artifacts/evidence/train-close.png` | Verify depth ordering, ballast/rails against terrain, material contrast and camera scale; do not hide the problem with fog. |
| Loading a different terrain is not currently supported | `RailFrontierGame.terrain` is readonly; `replaceState()` changes state only; save manager expects one content version; renderer constructed once | Introduce explicit session replacement before enabling V2. A version bump alone is insufficient. |

Blender verification in this planning pass: the local executable `/Applications/Blender.app/Contents/MacOS/Blender --version` returned **4.0.2**. Existing generator `tools/blender/generate_norway_pack.py` was inspected. No new model or texture was generated in this phase.

## Decisions fixed for Sol

### Terrain and old saves

1. Preserve V1 generator code, parameters and fingerprint unchanged, including `5e0a5b63073156cc412b17986651d1e777270198ab10f9e902e78e3cce5e7f1e` for the existing test definition. Freeze the V1 terrain constants separately before modifying the shared art palette; do not let a visual-profile edit alter old heights or masks.
2. Add V2 for new companies and the new commissioned preview. Keep the 16 km square, 25 m authoritative heightfield, SI units, NW–SE triangle diagonal, sea level and current three town IDs/XZ anchors. Sample V2 to obtain new town Y values. New campaign content uses version 2, generator version 2; schema 3 can represent these already.
3. Keep the old campaign descriptor for V1 saves. Never relabel an old save as V2, move existing tracks onto V2 heights, or erase old slots. Old worlds receive improved materials and decorative assets on their original terrain.
4. Resolve a saved world through a content registry keyed by campaign ID/version and generator version. Validate the descriptor and all world dimensions/seed rules before constructing terrain. Explicitly reject unknown combinations. Include the complete world definition in session/cache identity.
5. Session replacement is a staged operation: read/validate candidate → resolve content → generate matching terrain → prepare required assets → build candidate game/scene → publish it and wire controls → dispose previous ownership. On failure keep the previous session and slots intact. Use a session-host wrapper with closures referring to the active session; do not keep UI/autosave handlers bound to the discarded `const game`, renderer or save manager.
6. Share the existing canvas/WebGL renderer through an extracted host and replace scene roots/controls atomically, so switching does not require two WebGL renderers on one canvas. Resource ownership must distinguish shared pack resources from per-scene meshes/buffers. Reset clocks/interpolation and pause after load; remove old listeners and prevent new autosaves and drain already-started writes before switching session ownership. Preserve manual/auto/archive behavior.
7. No general save schema migration is required solely for terrain V2. Add a migration only if implementation discovers a genuinely new persisted field; document that change before writing it.

### Terrain V2 shape

Use authored, versioned spline/polygon data in local metres, inspired by R1, rather than continuing to stack global sine waves. A fjord centreline with varying half-width gives **two banks**; asymmetrical ridge splines define massifs; tributary valley splines carve U-shaped sections. Smooth, domain-warped seeded detail adds rock-scale variation without a repeated wave rhythm.

Starting composition: keep the fjord west of Sundvik, extending from the north/south map boundaries with a bend near its harbour. Begin with centreline control points `(1500,0)`, `(1200,3200)`, `(1750,6500)`, `(2600,11000)`, `(3000,16000)` in `(x,z)` metres; widths vary approximately 700–1400 m. These are fictional blockout coordinates to tune against screenshots, not copied Norwegian coordinates. Retain a western bank inside the map and a narrow coastal terrace beside Sundvik. The main inland valley passes through Granli to Fjellhavn; use the current settlement corridor as the playable valley floor, with irregular shoulders and branching gullies outside it. Protect the first two-station construction path and station footprints from impossible grades.

Use asymmetric sidewalls, rock shoulders and local plateau crests around 900–1400 m as an art starting range. Add a few directed gullies and a tributary outlet; water routes flow downhill. Do not distribute cliffs/streams randomly or cut every slope into equally sharp teeth. Introduce a terrain-version-aware landform descriptor for waterfall/shore locations; remove renderer dependencies on the V1 shoreline function and hardcoded production seed.

Authoritative positions must still be the heightfield positions. Do not displace the surface only in a shader or replace it with a disconnected Blender landscape. Terrain normals/textures may add optical detail. Large silhouette-changing rock forms belong in V2 elevations; decorative boulders/face fragments must sit on and largely intersect the ground, outside the rail/station/buildable corridor. They are scenery, not unmodelled construction obstacles; hide/regenerate them when the player builds there.

### Materials, lighting and water

- Keep Three.js/WebGL and ordinary PBR materials. Extend the installed `MeshStandardMaterial` path for world-space terrain blending; preserve lighting, fog, shadows, output colour and tone-mapping chunks. Verify local r186 shader hooks during implementation, give custom programs stable cache keys, and add a real engine material test.
- Blend grass/soil, exposed rock and scree using full X/Z gradient or triangle normal plus forest/rock/settlement masks. Use broad colour variation separately from metre-scale albedo/normal detail. Remove the periodic colour stripe.
- Blender procedural materials must be baked into glTF-compatible base colour, roughness and normal maps. Node graphs are not assumed to survive GLB export. Keep colour maps sRGB; normal/roughness maps linear. Use mipmaps and controlled normal intensity.
- Summer snow mask depends on upper elevation, sheltered aspect/concavity and low variation coverage. No fixed 620 m blanket. Keep low fjord slopes and most visible wooded hills snow-free.
- Establish neutral daylight, readable cool shadows and atmospheric distance. Reduce green haze/overexposure after material calibration. Focus the shadow camera around the current near view, with approximately 300–500 m coverage and shadow casters culled independently. Do not introduce SSAO or volumetric clouds before the basic lighting passes.
- Water: restrained animated normals, Fresnel reflection from a lightweight sky/environment, deep blue-green colour, darker shoreline contact and local shallow variation. Planar reflections are optional only after performance proof. Waterfall follows an authored downhill channel with a rock lip and local mist; no global bright ribbon.

### Placement and rendering ownership

Create a pure, seeded `scenery-placement` module. Inputs: matching terrain/landform descriptor, world seed, settlement/industry descriptors and live railway/station footprints. Outputs: stable instance ID, asset ID, tile, position, yaw, uniform scale, tint and footprint. Never consume simulation RNG. Renderer instantiates these records; no meshes enter saves.

- Combine coherent forest patches, existing forest/urban masks and slope/aspect. Starting mix: broadleaf/birch canopy dominates sheltered lower slopes, pine occupies drier broken ground, spruce appears in limited groups. Avoid treating this as a measured species inventory.
- For initial tuning, taper tree probability between 30° and 45° slope and to zero at 50°; replace abrupt treeline with patchy diminishing height/density. Reject flooded samples and exposed cliff/scree polygons. Use actual ground elevation, not nominal profile height.
- Separate stable candidate generation from visibility. New track removes intersecting candidates using bounds/grid queries against sampled actual centreline and consist/platform clearance; do not reroll the entire forest. Test building a line away from the initial corridor.
- Begin with 500–1000 m scenery tiles and per-species/material batches. Detailed trees within ~150 m; simplified branch/canopy models to ~900 m; coarse opaque canopy clusters beyond. Distances are tunable with 15% hysteresis. Far canopy bounds must cover real patches without drawing trees over fields or cliffs.
- Merge source meshes by compatible material before instancing. Retain shared textures/geometry until the asset-library owner disposes them. Tile removal disposes only tile-owned buffers. Avoid cloning a shadow-casting Object3D for every twig, house or stone.
- Near ground cover is confined to ~80 m around the camera and excluded from ballast, paths, water and footprints. Modest frond/leaf alpha testing is allowed after testing shadow/depth behavior; avoid layered alpha blending across the whole forest.

### Buildings and Blender deliverables

Use a separate `generate_norway_scenery.py` and shared Blender helpers, keeping the working rolling-stock generator reproducible. Blender source metres/+Z up and the existing GLB axis/pivot contract remain unchanged. Author named footprint/foundation anchors for scenery; export two LOD files per asset to remain compatible with the current two-level loader. Distant forest clusters are a renderer representation, not a silent third GLB entry.

| Kit | Minimum distinct geometry | Close / simplified triangle targets per model | Required characteristics |
|---|---|---|---|
| Rock | 3 boulders, 2 fractured outcrops, 1 scree cluster | 500–2000 / 100–400 | Directional fractures, irregular silhouette, weathering; no smooth spheres or mountains assembled from floating rocks. |
| Trees | 2 birch/broadleaf forms, 2 pine forms, 1 spruce | 1500–3500 / 200–600 | Visible branches, asymmetric crown and leaf/needle clumps; coherent silhouette between LODs. |
| Understorey | Fern, grass/low shrub, stump | 100–600 / 30–150 | Natural-scale edge detail, used sparingly near the camera. |
| Housing | 3 homes: small cottage, two-storey timber house, farmhouse | 1500–4000 / 200–700 | Pitched roofs, eaves, chimney, window recess/trim, timber siding, stone plinth; red/yellow/charcoal/white variants, eight curated trim/door combinations and original wood/roof textures per the texture extension. |
| Rural/shore | Barn, stabbur/storehouse, boathouse | 1000–3000 / 150–500 | Distinct massing, red/weathered timber, appropriate doors; waterside placement only for boathouse. |
| Industry | Sawmill shed, timber yard elements | 1500–4500 / 250–700 | Recognisable production sites at authoritative industry positions; stored log visuals reflect inventory or are clearly fixed fixtures. |
| Station | Improve current Norwegian station shell | ≤5000 / ≤1000 | Pitched canopy/roof and foundations, same railway/platform anchors; no content-class or price changes. |

Use shared original texture atlases, initially 1024² for rock, foliage/bark and architecture, with up to 2048² only where close inspection warrants it. Bake base colour/normal/packed roughness assets once; reference shared external textures in the pack rather than embedding duplicate copies in every GLB. Extend manifest/validator explicitly for shared textures and asset footprint metadata; do not confuse manifest format version with campaign content version. Generate a Blender contact sheet for rocks, foliage and buildings, then verify those same exported assets under game lighting.

Settle houses by small path-aligned plots or farm courts within each town envelope, on gentle land. Sample footprint corners and reject excessive slope/height range (start at ≤8° and ≤1.2 m corner variation). Use individually fitted foundation bases within that tolerance; do not tilt entire houses to slope normals or flatten authoritative terrain just for decoration. Reject overlapping footprints and rail/platform/water intersections. If a site cannot fit, create fewer houses rather than accepting the last invalid attempt. Population is simulation data, not a requirement to place a house per fixed number of inhabitants in this pass.

## Implementation work packages

Each task updates this document and CURRENT_STATUS.md, includes screenshot evidence when visible, and gets a focused checkpoint. Do not mark a task complete from type checking alone.

| Task | Concrete work / files | Exit gate |
|---|---|---|
| GFX-001: baseline and V1 isolation — **complete** ([evidence](GFX001_BASELINE.md)) | Capture regional, shore, station, train, forest edge, rock face and village at fixed cameras; preserve a schema-3/V1 fixture. Separate immutable generator constants from art settings in `src/world/*`. Add camera presets and reference notes to `docs/art/`. | V1 fingerprint and saved state unchanged; screenshot conditions and metrics recorded. |
| GFX-002: world/session compatibility — **complete** ([evidence](GFX002_SESSION_COMPATIBILITY.md)) | Content registry in `src/content/`; staged active-session host in `src/application/` and `src/main.ts`; separate renderer host/scene lifetime; adapt saves and new/continue flows. Initially exercise it with the unchanged V1 world. | Exact V1 load, failure-preserves-live-session, listener/context/asset lifetime tests. New terrain is not enabled yet. |
| GFX-003: V2 landforms | `src/world/norway-landforms.ts`, `norway-v2.ts`, version dispatch, V2 campaign/preview/industry placement; update fixed shoreline/waterfall calls in renderer. | Distinct fjord banks and asymmetric ridges in a neutral shaded blockout, all towns grounded, valid first connection and commissioned line, independent V1/V2 fingerprints. V1↔V2 load tested. |
| GFX-004: surface materials and daylight | `src/rendering/terrain-material.ts`, terrain mesh material integration, shared original PBR atlas baking/loading and colour-space/UV checks per the texture extension, water/light/shadow settings. | No striped green/white slopes; matching terrain raycasts; visible rock/soil/summer vegetation distinction; texture normal orientation and engine shader tests. |
| GFX-005: Blender rocks and vegetation | New scenery generator/helper, assets/pack metadata/validator, pure scenery placement, tiled instancing and LOD; live construction exclusions. | Reviewed Blender contact sheet and game forest/rock closeups; five distinct tree forms, no widespread cone silhouettes, visible forest patches and clear rock/field exclusions; stable deterministic placement. |
| GFX-006: village and industry kit | Original houses/farm/outbuilding/sawmill/station assets, footprints/foundations, paths/meadows, settlement placement and scenery update signatures. | Three distinguishable settlement compositions; no floating/overlapping buildings or railway obstructions; 1900-oriented detail confirmed against R6/R7; stable load appearance; eight timber finishes, four requested colour families, visible contrasting roof/window trim and grain. |
| GFX-006B: rolling-stock detail | Extend `tools/blender/generate_norway_pack.py` with original Nord steam pipe/cab/metal detail, coach windows/doors and freight wood/steel maps; shared material/baking helpers and manifest references. Follow the texture extension; retain future-era locomotive briefs without enabling new traction. | Real front/side/roof views of exported stock pass; visible 3D steam pipes, readable windows/doors, unchanged vehicle data/axes/couplers, correct maps at both LODs. |
| GFX-007: composition and performance | Camera presets/framing, distant canopy, shadow bounds, waterfall/shore contacts and texture budgets. | Regional and train-follow views remain legible with the real UI; continuous camera sweep without severe popping; normal/stress measurements within the budgets below. |
| GFX-008: complete regression and handback | Unit/asset/build checks, original passenger/freight/finance/city/archive flows, V1/V2 saves, mobile/desktop screenshots, repeated scene replacement/disposal, documentation. | All functional and visual gates below pass. Record actual counts and metrics. Only then resume the mail-transport backlog. |

## Validation and budgets

Use the existing M2 Pro / installed Chrome profile at 1440×900 and a 390×844 layout check; document actual browser version and DPR. Historical 146 draw calls/~60 FPS are reference measurements, not promises for the new asset set.

- Existing commands: `npm run check`, `npm test`, `npm run validate:assets`, `npm run build`, `npm run test:browser`. Add meaningful tests for new placement/version/session behavior and extend real GLB/material browser checks rather than asserting the old exact count of 16 files.
- Target: preferred 60 FPS, at least 30 FPS on the explicitly tested desktop profile. Measure median and p95 frame/render/simulation time during a repeatable 60-second regional→shore→forest→train path at 1× and 8×. Investigate sustained p95 above 33.3 ms; disclose weak-device limitations.
- Start with a ~300 draw-call budget in a normal composed camera and ~450 in the scale fixture, including shadow cost in the measurement report. Near visible geometry target ≤2 million triangles. These are tuning gates, not permission to claim good FPS from counts alone.
- Preserve the existing initial app/core budget <5 MB compressed. Norway is loaded separately; target ≤15 MB downloaded for the enhanced pack, hard ceiling 25 MB. Track unique decoded texture allocation separately (target ≤128 MiB including mipmaps); duplicate textures in GLBs count against it.
- Five V1↔V2 scene replacements must return resource counters to a stable warmed baseline, retain a single listener set/RAF driver, and leave no active old autosave. Final dispose must release the context and all asset-library textures. Do not report JS memory as measured GPU memory.
- Old state and cash/ledger must survive load byte-equivalently; old heights/track grades/quotes remain unchanged. Candidate-load failures (unknown content, corrupt payload, missing asset) preserve the running company. Saves must not adopt the active world's geometry accidentally.
- Pure placement tests: same seed/input yields identical records without changing simulation RNG; reject water, steep cliff, footprint overlap and live rail clearances; a new off-corridor track removes only intersecting scenery; rebuilding after load produces the same accepted placements.
- Terrain tests compare rendered surface/raycast positions to matching authoritative triangles including tile seams, both shores, cliffs and station sites. Normal-map detail cannot change this agreement.
- Asset tests cover exact metres, root/footprint anchors, finite normals/UVs/tangents as applicable, material/texture references, LOD bounds, merged primitive counts, shader compile, texture failure recovery and disposal.
- Screenshot gate: a real scene must visibly show (1) both fjord walls, (2) broken rock faces and talus, (3) clustered varied forest, (4) open meadow distinct from forest, (5) detailed grounded timber buildings, (6) readable railway and train scale, and (7) subdued summer snow, (8) red/yellow/charcoal/white timber and contrasting trim, and (9) detailed locomotive pipework/cab and coach windows/doors. Review side by side with R1/R4/R5 at regional, medium and close scales. Passing numerical tests with the previous visual appearance is not sufficient.
- Keep existing UI style. Change only framing/occlusion needed to see scenery and controls; this is not a separate menu redesign. No new gameplay mechanics, engine swap, live GIS dependency, season simulator, purchased asset packs or public deployment in this round.

## Handoff

Planning and reference inspection are complete. Stop here until the user switches to Sol and asks to continue. Start implementation at GFX-001, follow the sequence above, and keep mail transport deferred until GFX-008 passes. Any newly discovered architectural blocker should be recorded under ASTRA_ESCALATIONS.md with evidence; routine modelling, shader tuning, placement and test fixes can proceed in Sol.
