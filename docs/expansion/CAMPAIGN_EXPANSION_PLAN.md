# Campaign expansion plan

**2026-09-15 priority update:** EXP-001–003 remain technical foundations. Arizona EXP-003 is terrain-only and its visual quality is not accepted. Further campaign/economy work pauses for the [graphics rework](../art/GRAPHICS_REWORK_PLAN.md) and [controls/tutorial plan](../ux/ONBOARDING_AND_CONTROLS_PLAN.md). GFX-R07 now covers the Arizona architecture portion of EXP-004; reuse it when expansion resumes. Current handoff is planning-only, awaiting the user’s SOL switch.

The Norway vertical slice remains the reference implementation. Arizona / Southwest USA and Great River reuse its simulation, rail geometry, construction, stations, trains, routes, dispatch, economy, objectives and save system. A campaign supplies versioned world generation, starting content and a presentation profile; it does not fork the game loop.

## Reference direction

Arizona starts with a fictional corridor informed by the real transition between the Colorado Plateau and Basin and Range. The landform grammar needs broad basins, long horizons and north/south-trending ranges, plus sedimentary plateaus cut into flat-topped mesas and narrow drainage canyons. Rock materials should show stepped strata because resistant sandstone and limestone form cliffs while softer shale forms slopes. Official visual and terrain references:

- [USGS Arizona physiographic, elevation, precipitation and ecoregion maps](https://pubs.usgs.gov/sir/2014/5211/downloads/sir2014-5211.pdf)
- [National Park Service: The Colorado Plateau](https://www.nps.gov/articles/the-colorado-plateau.htm)
- [National Park Service: Glen Canyon geology](https://www.nps.gov/glca/learn/nature/geology.htm)
- [USGS: Colorado Plateau and Basin and Range boundary map](https://www.usgs.gov/publications/geologic-map-and-cross-section-across-boundary-between-colorado-plateau-and-basin-and)

Great River starts with a fictional upper/middle Mississippi-inspired corridor. Its world grammar needs a broad low-relief floodplain, main channel, tributaries, islands, sandbars, oxbows/backwaters, riparian forest, wetlands, levees, agriculture and higher settlement terraces. Crossings must remain scarce, visible capital decisions; the renderer must not fake water where the authoritative terrain mask says land. Official references:

- [National Park Service: Mississippi River flood plains](https://www.nps.gov/efmo/learn/nature/floodplains.htm)
- [National Park Service: Ohio and Mississippi confluence](https://www.nps.gov/articles/000/confluence-of-the-ohio-and-mississippi-rivers.htm)
- [National Park Service: how river floodplain wetlands form](https://www.nps.gov/subjects/wetlands/how.htm)
- [USGS Mississippi Alluvial Plain ecoregion map and profile](https://store.usgs.gov/assets/MOD/StoreFiles/Ecoregion/116343_ms_back.pdf)

References define large-scale form, vegetation zones, material families and lighting. All shipped meshes, textures, names and maps remain original fictional content unless a source is explicitly licensed and attributed.

## Implementation order

### EXP-001 — Campaign presentation boundary

Status: complete. `CampaignContent` now pairs its versioned simulation/world definition with a `CampaignPresentation`. The presentation owns renderer selection, biome lighting/material parameters and asset-manifest URL. `ActiveSessionHost` resolves and validates this content before asking the renderer host to create a scene; the host rejects unsupported renderers. Norway no longer chooses its biome or pack URL by inspecting save fields inside the renderer.

Acceptance: presentation biome must match the versioned world; renderer selection receives resolved campaign content; failed replacement still preserves the live session; Norway screenshots and tests remain unchanged.

### EXP-002 — Reusable terrain feature contract

Status: complete. `WorldGenerator` is a content-owned contract for version/biome validation, elevation and complete heightfield generation. Its landform record exposes named anchors, the principal rail corridor, cross-sectional water banks and an optional waterfall. Norway V1 and V2 implement that contract separately; the central generator-number switch and compatibility exports are gone. Terrain height plus water, forest, rock and urban/construction-cost masks retain their exact generated values. The renderer and bridge survey consume the resolved campaign generator instead of importing Norway shoreline, valley or fjord helpers.

Acceptance: adding a synthetic test biome requires no edit to a central `if (generatorVersion)` switch; Norway generation fingerprints and construction quotes are byte-for-byte stable; renderer terrain composition contains no Norway landform-helper import. Covered by synthetic registry composition, landform-contract and existing V1/V2 fingerprint tests.

### EXP-003 — Arizona terrain study

Status: complete. The independently registered `arizona-basin-v1` generator produces a deterministic 24 × 24 km fictional world at 40 m terrain resolution. A broad low basin sits between a rough western range and elevated eastern plateau rim; two irregular flat-topped mesas, a tributary canyon and a protected low-grade north/south railway shelf define the construction grammar. Three settlement pads are flattened only within their authored urban masks. The first 7 km alignment remains on ground at 0.22% maximum grade; the second 10 km alignment retains the same grade while its direct route crosses the canyon on a roughly 1.2 km bridge.

The Southwest presentation adds warm layered rock/soil vertex materials and seeded instanced scrub, dry grass, branched cactus and dry-tree blockouts. It deliberately has no asset manifest: original Blender buildings, railway structures and rolling stock begin in EXP-004. Fixed `regional`, `canyon`, `settlement`, `industry` and `train` cameras are content data rather than renderer constants. The isolated browser route is `/?skip-menu=1&world=arizona`; it hides the Norway campaign HUD because campaign selection and Arizona copy belong to EXP-005.

Create a separately versioned 24 km test world with a broad basin, plateau rim, two mesas, one tributary canyon, a long low-grade railway shelf and at least three viable settlement sites. Author layered rock/soil materials and procedural scrub, grass, cactus and dry-tree placement. Establish fixed regional, canyon, settlement, industry and train cameras before Blender asset work.

Acceptance: stable seeded fingerprint; landform cross-sections match the stated plateau/basin grammar; every settlement is on buildable land; two long corridors are feasible while at least one canyon forces a bridge or detour; close and regional screenshots pass the existing composition budgets.

Evidence: SHA-256 terrain/mask fingerprint `e6c668d8fc0545e0bb29cdc6f881275d0b213dc3c66f7a73d49f19786bff30a5`; five fixed-camera Chrome captures; no browser warnings; 10,500 procedural plants and 180 settlement blockouts; fewer than 50 draw calls and fewer than 2 million triangles. Covered by `tests/arizona-world.test.ts` and `tests/browser/arizona-terrain.spec.ts`.

### EXP-004 — Arizona campaign content and art

Add an original Southwest pack with two LODs per asset: depot, water tower, mining structures, timber/stone town buildings, ranch/agricultural props, saguaro and prickly-pear variants, scrub, dry grasses, sedimentary rocks and bridge/tunnel modules. Start with copper/mining, cattle and stone chains; extend the catalogue only where era/gameplay requires distinct US rolling stock.

Acceptance: a complete build-to-profit campaign journey uses the shared commands and reports; pack validation enforces markers, scale, normals, triangle/byte budgets and material maps; asset provenance is documented.

### EXP-005 — Campaign selection and compatibility

Turn the single campaign page into a content-driven selector. Starting a campaign selects its world, presentation, year, objectives and commissioned/empty setup. Save cards show campaign identity and reject missing content before replacing the active scene.

Acceptance: switching Norway ↔ Arizona disposes the old scene, loads the right pack, restores the correct UI text and never mutates a failed candidate; portable archives round-trip both campaigns.

### EXP-006 — Great River terrain and crossing study

Implement deterministic channel splines, tributaries, islands, backwaters, oxbows and floodplain/terrace masks. Bridge spans and approaches must use the authoritative water and terrain queries. Wetland and seasonal-looking material variation stays visual in the first version; actual flooding is a later simulation feature.

Acceptance: stable seeded fingerprint; continuous navigable-looking main channel; no dry seams between water and terrain; at least three economically meaningful crossing sites with different bridge/approach costs; rail corridors along both banks remain feasible.

### EXP-007 — Great River campaign content and art

Add river towns, farms, forests, wetlands, ports, factories, large bridge modules and a first agriculture-to-port/manufacturing chain. Reuse the same dispatch, station, freight and reporting systems.

Acceptance: a UI-only browser journey builds one river crossing, operates bank-side and cross-river services, completes freight and passenger goals, saves, reloads and resumes with a clean console.

## Checkpoint rule

Each task ends with targeted tests, full TypeScript and Node checks, asset validation when relevant, a production build, browser coverage for visible work, document updates, a Git commit and a push to `implementation/passenger-slice` and `main`.
