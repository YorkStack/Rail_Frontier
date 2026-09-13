# Data model

Code authority: `src/domain/model.ts`; runtime save schema: `src/persistence/save.ts`. Both are initial foundations, not a released save API.

| Record | Identity/reference | Authority |
|---|---|---|
| WorldDefinition | seed + generatorVersion + biomeId | Reproducible terrain inputs; actual seeded generator pending |
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

Money is integer minor currency units, currently displayed conceptually as NOK-like game credits; no exchange or inflation simulation. Amount signs: income positive, spending negative. Safe integer validation and reconciliation are implemented; pricing and posting services are pending.

Motion distance measures metres in traversal direction, so reverse geometry samples `length − distance`. The edge index changes only when its distance is consumed. Arrival clamps to the final endpoint. Idle trains may have no path. Node positions and curve endpoints match within 1 mm. Train fixtures use continuous paths, but normal movement calls assume validated input.

Derived caches (arc tables, route adjacency, scene entities, spatial indices, quote previews, graphics buffers) are not persisted. Rebuild from authoritative state. RNG state is reserved as uint32; seeded random generator algorithm not yet implemented. No Math.random in authoritative simulation.

Schema additions required before first released save: built engineering spans/costs/maintenance, locomotive/wagon definitions and physical condition, destination demand queues, reservations or deterministic reconstruction, explicit service stop cursor, accounting aggregates, delivered-cargo totals and objective completion/reward flags. Implement these through documented schema evolution before declaring the contracts frozen.
