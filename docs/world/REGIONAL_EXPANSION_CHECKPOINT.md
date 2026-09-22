# Regional expansion checkpoint — 2026-09-22

## Delivered regions

The campaign picker now offers two additional playable free-company regions:

- **Middle Rhine, Germany**: a 32 × 32 km heightfield around Boppard, St. Goar and Bacharach, with the river corridor, wooded slopes, local roads, passenger settlements, port traffic and ore/steel industry.
- **Tyne & Wear, England**: a 32 × 32 km heightfield around Newcastle, North Shields and Sunderland, with the Tyne estuary, North Sea coast, collieries, port traffic and steel industry.

Arizona remains a scenery study. Its catalogue now includes an original ranch windpump, stock fence, saguaro, prickly pear, yucca, creosote, sage, mesquite, juniper and desert grass. The new **Windpump** camera exposes the ranch group directly.

## Terrain provenance

The two European grids are reproducibly resampled from Mapzen Terrain Tiles' Skadi HGT distribution. The importer records the exact source URLs, SHA-256 digests, geographic bounds, sample resolution and attribution in the bundled JSON. HGT values are big-endian signed 16-bit elevations on WGS84 coordinates; the files use EGM96 vertical reference.

- [Mapzen Terrain Tiles on the Registry of Open Data on AWS](https://registry.opendata.aws/terrain-tiles/)
- [Tilezen/Joerd format specification](https://github.com/tilezen/joerd/blob/master/docs/formats.md)
- [Tilezen/Joerd source attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)
- Bundled licence and provenance: [`licenses/terrain-data.txt`](../../licenses/terrain-data.txt)

The playable geometry is a selective interpretation at 80 m sample spacing. River/coast water stages, settlement composition, roads and industry placement are art-directed for the game; they are not a cadastral or historical reconstruction.

## Original Blender catalogues

`tools/blender/generate_regional_catalogues.py` builds the regional catalogues locally and exports close/far GLBs plus original 256 px colour, normal and roughness tiles. Each European region contains 46 assets and 92 GLBs:

- seven residential/commercial building forms;
- three period station forms;
- four industries;
- eight vegetation species;
- five infrastructure objects;
- seven road, harbour and vehicle props;
- four locomotives and eight passenger, mail and freight vehicles.

The rolling-stock silhouettes cover representative steam, diesel and electric eras. Examples include Prussian P8/G3 and V100-inspired German forms and A3, Class 37 and Class 91-inspired British forms. They are original, simplified game models rather than licensed replicas. The in-game year filters purchases; save validation rejects stock from another region or a future year.

Architecture and surface colour derive from broad regional references: stucco/slate Rhine houses, British brick terraces and industrial buildings, hedges, vineyards, woodland, collieries and ports. The station, road and platform systems reuse the existing era-aware materials and access rules.

## Simulation integration

- Coal, ore, steel and oil join the existing passenger, mail and timber cargo model.
- Mines, terminals, steelworks, oil terminals and freight ports use explicit input/output inventories.
- Freight capacity comes from the selected wagon rather than a generic train value.
- The main menu filters locomotives and wagons by region and date.
- German companies use Mark/DEM/EUR display periods; British companies use pounds.
- New companies start with automatically terrain-aligned station orientation, while the player can still rotate the preview.
- Save schema 12 migrates existing schema-11 companies without inventing regional content.

## Validation

- **242/242** Node tests pass, including real DEM anchors, catalogue integrity, mixed coal/ore-to-steel transfer, regional vehicle filtering, save migration and station orientation.
- **4/4** focused Chrome journeys pass: campaign selection, station placement, regional stock, Middle Rhine rendering, Tyne/Wear rendering and Arizona windpump/vegetation.
- TypeScript, production build, external texture checks, marker checks and close/far asset budgets pass.
- Actual-renderer evidence is stored in `docs/screenshots/middle-rhine-settlement.png`, `docs/screenshots/tyne-wear-settlement.png` and `docs/screenshots/arizona-windpump.png`.

## Known limits

These are playable regional foundations, not finished historical campaigns. They reuse the current objectives and economy balance. The strategic water mask is intentionally low resolution at the far camera; harbours and river/coast silhouettes need later art passes. Road traffic, moving residents/animals, physical freight yards, multiple platforms, turnouts and train reformation remain separate planned systems.
