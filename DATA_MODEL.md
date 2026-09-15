# Data model

**Construction extension, 2026-09-15:** CON-01 implements the station layout portion of the [station-first station and alignment model](docs/construction/STATION_TRACK_DESIGN.md). Alignment project records follow in later construction slices.

Code authority: `src/domain/model.ts`; runtime save schema: `src/persistence/save.ts`. Operations and content contracts also live in src/domain/operations.ts. Schema 7 is implemented; contracts remain pre-release rather than a released save API.

| Record | Identity/reference | Authority |
|---|---|---|
| WorldDefinition | seed + generatorVersion + biomeId | Reproducible terrain inputs; 4 km study and 16 km Norway generators implemented |
| RailNode | node:N, position | Graph connectivity |
| RailEdge | edge:N, from/to, ownerId | Cubic curve and speed limit |
| Station | station:N, stop node, optional townId, layout, construction cost | Legacy-node or oriented single-platform layout with stable rail ports, class-driven coverage and cargo storage |
| Route | route:N, ordered station IDs | Shuttle or loop service |
| Train | train:N, routeId | Consist content IDs, phase, speed, cargo and motion |
| MotionState | ordered edge traversal IDs | Current leg, distance along traversal, arrival |
| CargoLot | origin/destination station IDs | Integer passenger, mail, timber or lumber quantity and carried distance |
| Town | town:N | Position, name, population |
| TownEconomyState | keyed by town:N | Lumber demand/supply, mail, activity, service days and growth carry |
| Industry | industry:N, definitionId | Typed inventory |
| Company | company:N | Opening/current cash and ledger |
| Transaction | transaction:N | Tick, signed integer amount, category, audit association |
| CampaignDefinition | string ID + content version | World, settlements, initial finances, objectives |
| GameState calendar | startingYear + tick | Deterministic 360-day vehicle era and HUD date |

IDs use a global monotonically increasing safe-integer counter with a kind prefix; never reuse deleted IDs. The initial company is company:1; initial Norway towns are town:2–4. Campaign initialization advances beyond the highest town number. Content IDs are stable strings and distinct from allocated entity IDs. Reject duplicate or stale IDs on load. Historical transaction association is a descriptive string and may refer to a demolished entity.

Money is integer minor currency units, currently displayed conceptually as NOK-like game credits; no exchange or inflation simulation. Amount signs: income positive, spending negative. Safe integer validation, reconciliation, atomic posting, overdraft protection and fractional running-cost carry are implemented.

Motion distance measures metres in traversal direction, so reverse geometry samples `length − distance`. The edge index changes only when its distance is consumed. Arrival clamps to the final endpoint. Idle trains may have no path. Node positions and curve endpoints match within 1 mm. Train fixtures use continuous paths, but normal movement calls assume validated input.

Derived caches (arc tables, route adjacency, scene entities, spatial indices, quote previews, graphics buffers) are not persisted. Rebuild from authoritative state. RNG state is uint32; src/world/random.ts implements Mulberry32 with tested continuation. Rendering has an independent seeded stream. No Math.random in authoritative simulation.

StationDefinition provides purchase cost, daily maintenance, catchment radius, storage capacity and platform length for six station classes. `upgradeStation` changes the saved class ID without another schema field; it permits only capability-increasing classes and posts the purchase-cost difference as capital spending.

Schema 7 includes the campaign starting year, demand queues, per-train service and financial state, exclusive reservations, built engineering spans, base upkeep, edge electrification cost/status/upkeep, industry cycles, per-town economy state, passenger/mail/timber/lumber delivery totals, completed objectives, monthly accounts, command sequence and station layouts. Schema 3 introduced town economies; schema 4 added mail; schema 5 made the campaign epoch authoritative; schema 6 added explicit electrification records; schema 7 adds station-owned platform rails and ports. The 6→7 migration preserves the old graph and numerical operation state. Any breaking state change needs an explicit migration.
