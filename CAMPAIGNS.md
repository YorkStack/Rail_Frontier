# Campaigns

The `CampaignDefinition` in `src/domain/model.ts`, Norway data, playable map, objective evaluator and campaign menu are implemented. Campaign content remains data-driven; only Norway is currently shipped.

| Campaign | Status | Gameplay |
|---|---|---|
| Norwegian Fjords | Playable passenger, timber and town-economy chapter | Passengers along shoreline, timber, expensive crossings/tunnels |
| Arizona / Southwest | Future design only | Sparse demand, long corridors, canyons and mining |
| Great River | Future design only | Ports/agriculture, large bridge decisions, river corridors |

Norway starts in 1900 with 2,500,000 whole game-currency units. World configuration: 16 km square, 25 m cells, seed 140919. A separate 4 km / 20 m-cell study uses this seed and generator version 2 to validate reusable terrain, water, cliffs, vegetation and track. It is identified as fjord-study and must not be mistaken for the full campaign. Town names and coordinates are original provisional content, not reproductions of a real map.

Initial objectives are connect two towns, deliver 200 passengers and earn 10,000 whole units of operating profit. Their evaluation and persisted completion are implemented. Timber, local lumber demand and difficult engineered terrain are already active in the Norway sandbox. Later chapters should reuse objective types and content configuration rather than campaign-specific branches.

Implemented BiomeDefinition includes terrain size/peak/sea level, palette, lighting and vegetation profile. Additional production masks, water-body records, weather, industry distribution and settlement expansion zones remain data/content tasks. The renderer must consume these common definitions. Campaign asset manifests should load core + rail + vehicle + selected-biome packs only. Arizona and River must not be downloaded to start Norway.
