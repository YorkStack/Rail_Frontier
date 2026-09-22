# Coordinator check: station upgrades

Baseline fb5f666, direct domain reproduction, separate from the agent player journeys. Script and output: `artifacts/swarm/scripts/coordinator-capacity.ts`, `artifacts/swarm/coordinator-capacity.txt`.

## C01 — P2: offered station upgrade ends in generic internal-layout error

A new 90 m rural halt was built, a second halt connected, then upgraded to major-terminal using the real application command. Result: `{ok:false,reason:'Invalid station layout'}`. The office currently offers higher classes based on catalogue prices/capacities, without checking the actual footprint. The semantic validator correctly rejects the resulting inconsistency, so the station remains 90 m and cash is preserved. A subsequent overlength train purchase is correctly rejected.

This is not proven capacity inflation or data corruption: the final state validator prevents that. It is an actionable UX/preview inconsistency. The player is offered a purchase that cannot succeed, with an English/internal error instead of an explanation that physical reconstruction is needed.

Recommended immediate fix: shared station-upgrade eligibility checks used before quote/command and in the office; show the reconstruction requirement in DE/EN and disable unavailable expansion. Keep legacy upgrade semantics where physical pad data is absent. Durable test: new-layout upgrade fails atomically with a useful explanation; button cannot promise an unavailable extension; old-layout supported upgrade still succeeds. Real expansion belongs to STX-01 rather than a cosmetic capacity change.
