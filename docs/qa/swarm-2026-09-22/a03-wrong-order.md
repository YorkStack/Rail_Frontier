# A03 — Wrong-order adversary

Separate role, **reused P10 worker**, with a completely new browser/context and fresh storage. Baseline fb5f666 at immutable port 5190; English, 1440 × 900, 100% UI. Approximately 7 minutes; 18 recorded batches, roughly 30 successful control activations including deliberate invalid ordering. Browser paused after initial free-play entry to compare state without simulation drift.

## Confirmed finding

### A03-01 — P2: rejected disconnected route moves focus away and hides its explanation

Reproduced twice with ordinary UI actions:

1. New game → Free play. Build Rural Halt at Sundvik through its default placement. Navigate to Granli and build another Rural Halt. Do not connect external track.
2. Open Trains & lines. Add Sundvik and Granli as the ordered stops.
3. Press Create route.

Expected: reject the disconnected route, preserve draft/company, keep the relevant route controls and explanation in view so the player can connect track or adjust stops.

Actual: correctly rejects with `Route contains disconnected stops`, but focus jumps to `#purchase-station` at the top of the office. The relevant message `#operations-valid` is below the visible scroll area: measured top 1418.921875 px, bottom 1441.421875 px in a 900 px viewport. The visible panel instead shows the separate train-purchase warning. The player receives no visible explanation near the attempted action and must find the error by scrolling.

The inspected screenshot `artifacts/swarm/evidence/a03-wrong-order/disconnected-route.png` captures the post-rejection top-of-office state (it intentionally does not show the offscreen route message). Session JSON records the measured rectangle, exact message and active element. Suggested regression: submit disconnected stops, verify no cash/graph mutation, preserved stop draft, focus remains in the route step and a local error is visible inside the panel viewport. Recommended fix: distinguish successful workflow transitions from failed submissions; focus/error placement should follow the action that failed.

## Successful rejection and recovery coverage

- Before any stations/track: Buy consist, Add stop, Create route, Assign service, Electrify and Upgrade are disabled appropriately. The purchase section explains the missing connected station.
- Changed Cars to three, pressed Enter; changed service pattern to loop, pressed Enter; cleared draft. Exact read-only comparison confirmed cash 500,000,000 minor units, empty graph, trains and routes unchanged.
- Built Sundvik alone for 2,500,000 minor units. The station has its two internal track edges, but purchase remains blocked and specifically asks for connection to the railway. This correctly distinguishes platform track from external connectivity.
- Added Sundvik twice. The draft contains one stop, selector labels it already added, and Create route remains disabled.
- Built Granli for another 2,500,000 minor units. With the two disconnected stops, route submission leaves cash at 495,000,000, graph, trains and routes exactly unchanged. No phantom route or charge.
- Clear → close office → reopen recovers to zero draft items and disabled Create route.
- Repeating the disconnected submission again reliably reproduced A03-01. No browser page errors.

## Boundary checks and limits

After UI exploration, inspected baseline operation test definitions and ran `npx tsx --test tests/operations.test.ts`: 12/12 passed. This was a **current-working-source diagnostic run**, not a claim of immutable baseline-only coverage: the coordinator had already appended the paused-moving-train reassignment regression. Existing checks cover invalid stock/overdraft atomicity, unavailable-era purchases, electrical power requirements, all-edge route electrification, repeated/disconnected stops and overlong platforms. Evidence: `operations-boundaries.txt`.

No browser state was injected and no commissioned fixture was needed. The first-use UI deliberately hides future locomotives; later-era electrical/overlong purchase rejection was covered by core checks, not a claimed interactive century playthrough. Did not construct the connecting external route or complete a successful train purchase in this role. Existing player agents cover that positive journey.

Several harness lookups needed correction (exact Cars label, visible Stations caption versus its Build station accessible name, station commit is not a submit button, settlement accessible-name spacing). These locator mistakes are logged and are not reported as application defects. Once corrected, controls responded without 8× load or repeated stability timeouts.

## Cleanup

Script: `artifacts/swarm/scripts/a03-wrong-order.mjs`; session evidence in the matching evidence directory. `finally` closed context/browser and printed CLOSED, then EOF terminated the readline runner. Verified no matching runner process remains. No application files, existing tests, user profiles or servers modified.
