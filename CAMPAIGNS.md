# Campaigns

The `CampaignDefinition` in `src/domain/model.ts` and Norway data in `src/content/norway.ts` are implemented. A content loader, playable map, objective evaluator and campaign menu are pending.

| Campaign | Status | Gameplay |
|---|---|---|
| Norwegian Fjords | Initial metadata + three town records | Passengers along shoreline, timber, expensive crossings/tunnels |
| Arizona / Southwest | Future design only | Sparse demand, long corridors, canyons and mining |
| Great River | Future design only | Ports/agriculture, large bridge decisions, river corridors |

Norway starts in 1900 with 2,500,000 whole game-currency units. World configuration: 16 km square, 25 m cells, seed 140919. This seed is stored but not yet used by an implemented world generator. Town names and coordinates are original provisional content, not reproductions of a real map.

Initial objectives are connect two towns, deliver 200 passengers and earn 10,000 whole units of operating profit. Definitions exist; evaluation/rewards do not. Later chapters introduce timber, crossing difficult terrain, a tunnel and regional expansion. Implement objective types once and consume configuration rather than campaign-specific branches.

Planned environmental definitions: terrain profile, biome masks, vegetation profile, water bodies/rivers/falls, weather/lighting, industry distribution and settlement expansion zones. The renderer must consume these common definitions. Campaign asset manifests should load core + rail + vehicle + selected-biome packs only. Arizona and River must not be downloaded to start Norway.
