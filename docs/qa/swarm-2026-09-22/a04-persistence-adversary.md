# A04 — Persistence adversary

2026-09-22, immutable baseline fb5f666 on port 5190. English 1440×900, 100% interface, isolated Chromium context. Approximately six minutes and 50 UI activations. This separate role reused the A01 agent worker, but used an entirely new browser, storage and company. It is not counted as a distinct human participant.

## Setup and deliberate injection

Started through New game → Free play, built one rural halt using actual UI, and saved. Original company had one station, two internal edges and NOK 4,975,000 (497,500,000 minor units). Created the independent named save `A04 safe company` before provoking failures.

Inspected baseline save-store and browser-test code for selectors/injection setup. Deliberately replaced `IDBDatabase.prototype.transaction` within this private page: readwrite transactions called the original method, then queued `tx.abort()` in a microtask. Readonly transactions remained untouched. This is an injected storage failure, not an observed disk/quota failure. Restored the exact original method before recovery; no application files, servers or user storage were changed.

## Outcomes

1. **Malformed import:** uploaded `{` as `broken.json` via `setInputFiles`. Clear “Archive is not valid JSON” rejection. Exact serialized current snapshot unchanged, one original slot remained.
2. **Oversized import:** uploaded 20,100,001 bytes, just over the implemented limit. Rejected with “Archive exceeds 20 MB save limit”. Exact current snapshot unchanged, no imported slot. This tests the implemented size boundary, not a truly huge memory exhaustion payload.
3. **Unsupported archive:** valid JSON with `formatVersion: 999` rejected with “Unsupported Rail Frontier archive”. The current company was unchanged by the import.
4. **Aborted manual save:** after creating the safe named slot, injected transaction abort and attempted a new `A04 aborted write` save. No new slot appeared (two slots stayed two); exact live snapshot unchanged. Error presented. No uncaught page error.
5. **Aborted Save & leave:** while writes were still forced to abort, opened the exit confirmation and chose Save & leave. The confirmation remained open and explicitly said “Save failed. Your company is still open. Please try again or keep playing.” Exact snapshot unchanged. Inspected `abort-exit.png` confirms the actionable error and three exit choices.
6. **Recovery and rapid exit:** restored original IDB method, triple-clicked Save & leave at 15 ms spacing. Reached main menu successfully, original cash retained, no page errors.
7. **Rapid load:** quadruple-clicked Resume for `A04 safe company` at 10 ms spacing. Company resumed with one station and original cash. No crash or duplicate economic changes.
8. **Rapid saves/new company:** five clicks on Save game at 10 ms spacing, then main-menu navigation and triple-click Free play at 15 ms spacing. New company correctly contained zero stations and NOK 5,000,000. Named safe company remained in the archive. Resuming it restored one station, two edges and NOK 4,975,000.

No confirmed P0/P1/P2 defects in this bounded test. Queue recovery after aborted writes worked. The known practice/shared-quicksave issue was intentionally not retested here.

## A04-01 — P3: generic import wording is used for manual-save failure

**Reproduction:** open Saved companies, inject a readwrite transaction abort, type a new manual-save name and press Save current company.

**Actual:** “The archive could not be opened. The transaction was aborted, so the request cannot be fulfilled. Your running company has not been changed.”

**Expected:** a save-specific failure explaining that no new save was written and offering retry; the player was not opening an archive.

**Evidence:** `artifacts/swarm/evidence/a04/abort-manual.json`; reproducible once with controlled injection. Recovery was straightforward and no data was lost. Recommend documenting for the shared save-error copy pass; use action-specific prefixes for save/import/rename/delete. A regression can abort one write and assert save-specific wording while preserving current state and existing slots.

## Limits and harness observations

No real quota exhaustion, operating-system power loss, browser crash, multiple-tab write race or large campaign archive was tested. The live company only had a station; service/cargo histories were outside this role. No performance claims under concurrent browsers.

A 300 ms snapshot immediately after Resume initially still showed the prior new company because activation is asynchronous; a subsequent settled snapshot confirmed full restoration. This was corrected in `recovery.json`, not reported as data loss. During very fast menu navigation, the first New game click did not leave its choices open; a second click worked. Not isolated sufficiently to classify as a defect.

Evidence: `oversize.json`, `abort-manual.json`, `abort-exit.json`, inspected `abort-exit.png`, `rapid-new.json`, settled `recovery.json` under `artifacts/swarm/evidence/a04/`. Browser `pageerror` collection stayed empty throughout.

## Cleanup

Verified the original IDB transaction method was restored, then closed context and browser in `finally`. Runner printed `ERRORS []`, `BROWSER_CLOSED`, exited 0. `pgrep` found no `a04-persistence-adversary.mjs` runner. No server started or stopped; no persistent profile or user data touched.
