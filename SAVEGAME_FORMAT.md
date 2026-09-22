# Save game format

**Construction extension, 2026-09-15:** CON-01 implements the first [station-first construction migration](docs/construction/STATION_TRACK_DESIGN.md). Later alignment schemas remain staged behind their implementation slices.

Current experimental format: `{ "schemaVersion": 11, "gameVersion": "0.11.0", "state": GameState, "planning": PlanningDraft | null }`. Schema 7 records station layout, orientation, platform pad, stable connection ports, station-owned internal edges and historical station construction cost. See src/persistence/save.ts for exact runtime validation and src/domain/model.ts + operations.ts for records.

Authoritative state includes tick/start year/ID counter/RNG, campaign/content/generator versions, rail graph, stations, trains/cargo/route state, towns, industries, finance ledger, objectives and **operations**. Operations holds OD demand, service direction/stop cursor/condition/cost remainder, exclusive reservations, built engineering spans/base costs/upkeep, edge electrification status/historical cost/upkeep, industry cycles, per-town economy state, delivered totals, completed objectives, monthly accounts and command sequence.

Strict schema rejects unknown fields, nonfinite values, invalid IDs/quantities, future versions and malformed JSON. Semantic validation rejects dangling IDs, duplicate/stale IDs, disconnected train paths, invalid arrival distance, future cargo/demand/transaction timestamps, self-demand, unknown Norway station/vehicle content, Norway vehicles used before their catalogue year, station storage beyond its class capacity, duplicate reservations/objective completions, invalid service stops, noncontiguous/incomplete engineering spans and cash-ledger mismatch.

Schema 1 (0.1.0 foundation) → 2 validates the old strict shape and initializes the original operational state. Schema 2 → 3 adds deterministic town economy, 3 → 4 adds mail, 4 → 5 adds the 1900 campaign epoch and 5 → 6 adds explicit unelectrified edge records. Schema 6 → 7 marks every old station as `legacy-node` and records its class value without changing node IDs, curves, motion, reservations, routes, costs or eligibility. A registry supplies sequential pure migrations; each advances exactly one version. Regression tests cover all old formats, preserve their input values and reject a nonadvancing migration.

The IndexedDB backend uses database rail-frontier, version 1, slots keyed by id. Each record has id/name/modifiedAt/json. Metadata and payload write atomically in one transaction. The browser exposes named manual saves, daily autosave, continue-latest, rename, confirmed deletion, per-slot export and file import. Reads wait for queued writes, and a rejected write is surfaced without poisoning later save attempts.

Portable exports use `{ "format": "rail-frontier-save", "formatVersion": 1, "name": string, "exportedAt": ISO-date, "save": SaveEnvelope }` and the `.railfrontier.json` suffix. Import also accepts a raw SaveEnvelope for recovery from earlier builds. It canonicalizes the migrated document to schema 11 and creates a new slot; it never activates the imported company automatically. The registered campaign/world definition is checked before that slot is written.

Public parsing is capped at 20,000,000 UTF-8 bytes. A structural preflight runs before Zod and graph compilation: at most 25,000 rail nodes/edges, 5,000 stations/routes/towns/industries, 2,000 trains and bounded ledger, demand, reservation, account, vehicle, path, cargo, stop and engineering-span collections. These limits exceed the documented 5,000-edge scale profile while bounding validation cost.

On load: parse/migrate/validate before replacing the live state; check campaign and generator compatibility; reset render-clock accumulator; rebuild derived caches. The study verifies its fixed campaign/generator. Production loader needs content registry and must rebuild scene/cache for the loaded network. No wall time/offline earnings. Slot timestamps are metadata; they do not influence deterministic game time.

Verification saves at a paused tick, advances, reloads the browser, loads from IndexedDB, compares the entire state and resumes. Core regressions cross dwell, turnaround, passenger payment, freight payment and all historical migrations.

Remaining release work: cross-tab conflict policy/version upgrades and a permanent released-fixture archive. Browser storage estimates are advisory because the browser reports an origin-wide quota. Quota/private-mode errors are translated into recovery guidance. Malformed, incompatible and over-limit imports create no slot; failed UI loads/imports leave the running company unchanged.

## Planning metadata (schema 10)

Schema 7→8 adds semantic terrain operations; 8→9 adds optional tutorial learning. Schema 9→10 preserves the entire game state and initializes `planning: null`. `deserializeDocument` returns both game state and planning; the existing `deserialize` API returns game state for simulation callers. `GameSaveManager` captures the draft with the same snapshot and slot write as the game state, preserves it through rename/export/import, and restores it only after successful activation.

A version-1 PlanningDraft contains `current`, `past` and `future` route drafts. Each has at most 64 finite world-space wish points, a completion flag, a registered track standard and nullable exact selected cubic curves (at most 128). Each history stack has at most 30 entries. Preflight caps counts before full validation. Complete drafts need endpoints; selected designs must join continuously and match those endpoints. Prices, worker/cache state, meshes, engineering quotes and already-purchased infrastructure do not belong in this metadata.

History and selected geometry are retained across tools and saves. Restore runs the usual live terrain/certification/quotation path before purchase; command validation still controls funds, graph revision, port compatibility and atomic construction. A later rule/terrain change may make the retained design unbuildable: retain the sketch for editing and report the problem, rather than silently substitute an unrelated railway. Rejected alternatives are transient and may be recomputed. Successful building clears the draft. Language and camera preferences remain separate presentation data.


### Schema 10 → 11: station formation below the rails

The former station-pad target equalled the railhead, burying ballast and sleepers in terrain. Migration 10→11 lowers each explicit station-pad `targetElevationM` by 0.55 m after checking its old height contract. Rail nodes, curves, station orientation/length, trains, routes, cash, historical construction costs and retained planning drafts stay unchanged. The explicit target is persisted, so reload does not apply the offset again. Older formats continue through the same sequential chain; stations without pad operations are unchanged. Patch generator version 1 still evaluates explicit targets with the same algorithm.

New station pads use the corrected target. The standard bed preparation is included in the station purchase price; the existing balanced site-grading quote remains unchanged. Runtime platforms derive their length from the saved footprint, not a subsequent class upgrade, and clear the rolling-stock envelope.
