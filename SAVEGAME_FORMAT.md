# Save game format

Current experimental format: `{ "schemaVersion": 4, "gameVersion": "0.4.0", "state": GameState }`. See src/persistence/save.ts for exact runtime validation and src/domain/model.ts + operations.ts for records. Game is pre-release; future released-save compatibility must preserve explicit migrations.

Authoritative state includes tick/ID counter/RNG, campaign/content/generator versions, rail graph, stations, trains/cargo/route state, towns, industries, finance ledger, objectives and **operations**. Operations holds OD demand, service direction/stop cursor/condition/cost remainder, exclusive reservations, built engineering spans/costs/upkeep, industry cycles, per-town economy state, delivered totals, completed objectives, monthly accounts and command sequence.

Strict schema rejects unknown fields, nonfinite values, invalid IDs/quantities, future versions and malformed JSON. Semantic validation rejects dangling IDs, duplicate/stale IDs, disconnected train paths, invalid arrival distance, future cargo/demand/transaction timestamps, self-demand, unknown station classes, station storage beyond its class capacity, duplicate reservations/objective completions, invalid service stops, noncontiguous/incomplete engineering spans and cash-ledger mismatch.

Schema 1 (0.1.0 foundation) → 2 validates the old strict shape and initializes the original operational state. Schema 2 (0.2.0 Norway operations) → 3 adds deterministic economy records for every saved town while preserving prior operations. Schema 3 (0.3.0 town economy) → 4 adds `delivered.mail = 0`; old cargo and ledger values are validated against their historical enums before migration. A registry supplies sequential pure migrations; each advances exactly one version. Regression tests cover all old formats, preserve their input values and reject a nonadvancing migration. Future schemas fail clearly.

The IndexedDB backend uses database rail-frontier, version 1, slots keyed by id. Each record has id/name/modifiedAt/json. Metadata and payload write atomically in one transaction. The browser exposes named manual saves, daily autosave, continue-latest, rename and confirmed deletion.

On load: parse/migrate/validate before replacing the live state; check campaign and generator compatibility; reset render-clock accumulator; rebuild derived caches. The study verifies its fixed campaign/generator. Production loader needs content registry and must rebuild scene/cache for the loaded network. No wall time/offline earnings. Slot timestamps are metadata; they do not influence deterministic game time.

Verification saves at a paused tick, advances, reloads the browser, loads from IndexedDB, compares the entire state and resumes. Core regressions cross dwell, turnaround, passenger payment, freight payment and both historical migrations.

Hardening backlog: byte/entity/array count limits (current guard is 20 million JSON characters), application invariants against content definitions, quota/private-mode recovery UI, corrupted slot isolation, tab conflict/version upgrade handling and released v2 fixture archive. Errors are surfaced rather than ignored; a failed UI load leaves the study state unchanged.
