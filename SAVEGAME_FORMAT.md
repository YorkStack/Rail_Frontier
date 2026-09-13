# Save game format

Current experimental envelope: `{ "schemaVersion": 1, "gameVersion": "0.1.0", "state": GameState }`.

Actual schema lives in `src/persistence/save.ts`. It uses strict objects and finite numbers, integer quantities and money, positive typed IDs, future-version rejection, graph validation, referential integrity, contiguous motion paths, arrival consistency and cash reconciliation. Decoder limits JSON to 20 million characters; byte-limited storage and tighter entity-count limits remain to be added. State is parsed and validated before returning a new object; callers must not replace the running game until successful.

State includes completed tick, next entity number, RNG state, versioned campaign/world inputs, rail graph, stations, trains, routes, towns, industries, company ledger and objective progress. Curve samples and rendering identities never appear. Slot ID, human name, created/modified timestamps and thumbnail belong to IndexedDB metadata, not authoritative simulation state. Slot storage is currently an interface only.

Migrations: an explicit map is present but empty because no predecessor has been released. Version 1 loads directly. Future schemas fail with a useful message. The current registry is a foundation, not a demonstrated old-version migration. When schema 2 is introduced, add a pure 1→2 migrator, source/target validation, strict version advancement check, retained v1 fixtures and regression tests. Never mutate the original stored payload before the migrated state passes all checks.

Planned IndexedDB layout: database `rail-frontier`, version 1, `slots` store keyed by ID. Write metadata+payload atomically. Provide named slots, list, rename, delete, continue-latest and rotating autosaves. Catch quota/private-mode failures and show recoverable user feedback. Autosave after completed ticks; manual save freezes a coherent snapshot. Exclude transient render interpolation; load with accumulator zero and reconstruct caches. Corrupt loads leave the live session untouched.

Campaign content/generator versions require compatibility lookup before loading a browser world. That check and generated-world hashes are not implemented. Do not claim old saves are stable until the missing gameplay fields described in DATA_MODEL.md are incorporated.

Verified: populated fixture with constructed graph, two stations, purchased-train-shaped state, coaches, route and passengers; advance 137 ticks; serialize/reload; deep equality; continue 350 ticks and compare. This is a core regression using a fixture, not the mandated end-to-end player construction/purchase/boarding/revenue flow. That flow remains a vertical-slice gate.
