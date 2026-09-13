# Save game format

Current experimental format: `{ "schemaVersion": 2, "gameVersion": "0.2.0", "state": GameState }`. See src/persistence/save.ts for exact runtime validation and src/domain/model.ts + operations.ts for records. Game is pre-release; future released-save compatibility must preserve explicit migrations.

Authoritative state includes tick/ID counter/RNG, campaign/content/generator versions, rail graph, stations, trains/cargo/route state, towns, industries, finance ledger, objectives and **operations**. Operations holds OD demand, service direction/stop cursor/condition/cost remainder, exclusive reservations, built engineering spans/costs/upkeep, industry cycles, delivered totals, completed objectives, monthly accounts and command sequence.

Strict schema rejects unknown fields, nonfinite values, invalid IDs/quantities, future versions and malformed JSON. Semantic validation rejects dangling IDs, duplicate/stale IDs, disconnected train paths, invalid arrival distance, future cargo/demand/transaction timestamps, self-demand, duplicate reservations/objective completions, invalid service stops, noncontiguous/incomplete engineering spans and cash-ledger mismatch.

Schema 1 (0.1.0 foundation) → 2: validate the old strict shape and initialize empty operational state. Existing physical/financial state is preserved; no previous operational economy existed to migrate. A registry supplies sequential pure migrations; each must advance exactly one version. A regression tests both preserved old input and rejection of nonadvancing migration. Future schemas fail clearly. Test source retains the exact prior shape; no broad unchecked cast is used.

The IndexedDB backend uses database rail-frontier, version 1, slots keyed by id. Each record has id/name/modifiedAt/json. Metadata and payload write atomically in one transaction. Backend implements list/read/write/remove and connection closing. Study UI saves/loads one named slot; database can hold multiple slots. Production rename/multiple-slot UI, rotating autosave and continue-latest remain SAVE-002 tasks.

On load: parse/migrate/validate before replacing the live state; check campaign and generator compatibility; reset render-clock accumulator; rebuild derived caches. The study verifies its fixed campaign/generator. Production loader needs content registry and must rebuild scene/cache for the loaded network. No wall time/offline earnings. Slot timestamps are metadata; they do not influence deterministic game time.

Verification: core fixture and actual browser study save at a paused tick, advance, reload the browser, load from IndexedDB and compare entire state; resume thereafter. Core regression crosses dwell and turnaround. This validates persistence architecture, **not** player construction/purchase/passenger payment, which remain QA-001.

Hardening backlog: byte/entity/array count limits (current guard is 20 million JSON characters), application invariants against content definitions, quota/private-mode recovery UI, corrupted slot isolation, tab conflict/version upgrade handling and released v2 fixture archive. Errors are surfaced rather than ignored; a failed UI load leaves the study state unchanged.
