# Data model

Code authority: `src/domain/model.ts`; runtime save schema: `src/persistence/save.ts`. Operations and content contracts also live in src/domain/operations.ts. Schema 2 is implemented; contracts are stable for the implementation handoff, not a claim of a released gameplay save API.

| Record | Identity/reference | Authority |
|---|---|---|
| WorldDefinition | seed + generatorVersion + biomeId | Reproducible terrain inputs; 4 km study and 16 km Norway generators implemented |
| RailNode | node:N, position | Graph connectivity |
| RailEdge | edge:N, from/to, ownerId | Cubic curve and speed limit |
| Station | station:N, nodeId, optional townId | Coverage connection and cargo storage |
| Route | route:N, ordered station IDs | Shuttle or loop service |
| Train | train:N, routeId | Consist content IDs, phase, speed, cargo and motion |
| MotionState | ordered edge traversal IDs | Current leg, distance along traversal, arrival |
| CargoLot | origin/destination station IDs | Integer quantity and carried distance |
| Town | town:N | Position, name, population |
| Industry | industry:N, definitionId | Typed inventory |
| Company | company:N | Opening/current cash and ledger |
| Transaction | transaction:N | Tick, signed integer amount, category, audit association |
| CampaignDefinition | string ID + content version | World, settlements, initial finances, objectives |

IDs use a global monotonically increasing safe-integer counter with a kind prefix; never reuse deleted IDs. The initial company is company:1; initial Norway towns are town:2–4. Campaign initialization advances beyond the highest town number. Content IDs are stable strings and distinct from allocated entity IDs. Reject duplicate or stale IDs on load. Historical transaction association is a descriptive string and may refer to a demolished entity.

Money is integer minor currency units, currently displayed conceptually as NOK-like game credits; no exchange or inflation simulation. Amount signs: income positive, spending negative. Safe integer validation, reconciliation, atomic posting, overdraft protection and fractional running-cost carry are implemented.

Motion distance measures metres in traversal direction, so reverse geometry samples `length − distance`. The edge index changes only when its distance is consumed. Arrival clamps to the final endpoint. Idle trains may have no path. Node positions and curve endpoints match within 1 mm. Train fixtures use continuous paths, but normal movement calls assume validated input.

Derived caches (arc tables, route adjacency, scene entities, spatial indices, quote previews, graphics buffers) are not persisted. Rebuild from authoritative state. RNG state is uint32; src/world/random.ts implements Mulberry32 with tested continuation. Rendering has an independent seeded stream. No Math.random in authoritative simulation.

Schema 2 now includes these records in operations: demand queues; per-train nextStopIndex/direction/age/condition/distance/revenue/operatingCosts/costRemainder; exclusive reservations; built engineering spans/construction cost/daily upkeep; industry cycle tick progress; delivered totals; completed/rewarded objectives; monthly accounts; lastCommandSequence. VehicleDefinition, StationDefinition and IndustryRecipe fix reusable content fields. Implementing the economic/traction/construction systems is pending. See ECONOMIC_CONTRACT.md and SAVEGAME_FORMAT.md. Any breaking state change needs an explicit migration.
