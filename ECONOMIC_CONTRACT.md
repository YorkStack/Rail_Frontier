# Economic and command implementation contract

These are the implemented initial economic rules. Values are data-driven balance defaults and may be tuned without redesigning state or transaction semantics.

## Calendar and demand

1 economic day = 1,200 ticks. 30-day month / 360-day year. Generate destination-specific passenger queues once at each day boundary. A town produces floor(population×0.025) passengers per day. Destination weights: sqrt(destinationPopulation)/(1+straightLineDistanceKm/10), excluding origin. Allocate integer totals by largest remainder, ties by town ID. Cap each OD queue at seven days of its current generation; no stochastic hidden arrivals required. Town attractiveness/service multipliers can later modify weights using the same queues.

Coverage assigns a town to the closest eligible station within StationDefinition.coverageRadiusM, ties by station ID. A town's demand belongs to one station at a time; coverage changes never duplicate queues. Passengers board only when their destination station lies on the planned service and free coach capacity exists. Board oldest queues first with stable destination ordering. Unserved passengers remain queued up to the cap.

## Transfers and revenue

CargoLot quantities are integers. Every transfer debits the source and credits the destination atomically; capacity and destination are validated first. Track actual loaded travel distance, so reverse/extra edges do not teleport cargo or use screen distances. Passenger fare at destination = quantity × max(1,500, round(distanceKm×35)) minor units. A delivered lot is removed in the same commit that posts its fare and delivery total. No payment on boarding or intermediate stop. Midnight/autosave/dwell reload must not pay twice.

Freight starts only after the passenger gate. Forest produces timber into capped storage, sawmill atomically consumes timber and creates lumber, town consumes delivered lumber. IndustryRecipe governs quantities/cycle ticks and storage limits. Pause freezes cycle progress. Production does not invent missing inputs or discard overflow silently. Freight tariff can initially use 25 minor units/unit/km, then balance through content data.

## Finance

Money is a safe integer in minor units. cash = openingCash + sum(ledger.amount) at all times. Construction and purchase expenses are capital categories; fuel/running cost and daily track/station/train upkeep are operating costs. Reports must not treat construction as operating loss. Record immutable built infrastructure cost so content rebalance cannot rewrite past purchases.

Live company reports derive from authoritative state rather than adding saved summary fields. Monthly and all-time operating profit equal revenue minus maintenance/running costs; capital expenditure remains separate. Infrastructure value is the immutable historical construction cost stored on owned edges. Station and vehicle values use the current content purchase values until depreciation, sales and asset-specific historical values are introduced. Company value is cash plus owned infrastructure, station and vehicle value. Train services own lifetime revenue, operating cost and distance; route reports aggregate only trains currently assigned to that route.

For distance-based running costs, accumulate per-train fractional minor units in costRemainder; post floor(total) and carry the remainder. Daily maintenance posts once at the fixed day boundary. MonthlyAccounts aggregates ledger categories, keyed by game month. Transaction timestamp is completed simulation tick; entityId can retain a demolished entity's historical ID.

## Atomic commands

GameApplication receives CommandEnvelope, sequence exactly lastCommandSequence+1. Validate prerequisites, IDs, availability, capacity, graph revision and cash on a working copy; commit state and sequence only on success. Failed commands leave the live state byte-equivalent. Retry of an already successful sequence cannot charge again. Success returns allocated IDs for follow-up UI selection. Handler allocates ownership/entity IDs; UI rail anchors express existing nodes or new positions, not arbitrary entity ownership.

Recompute construction geometry/quote against current terrain and compare quotedCost + revision before committing. Validate tangent compatibility and full engineering spans. A rejected stale preview must prompt recalculation. Increment railway revision only when graph structure changes. Rebuild RailNetwork cache once per revision; routes store IDs, not meshes.

## Acceptance tests

Insufficient funds leaves state identical. Replayed success does not debit twice. Total passengers conserve across queues/trains/deliveries/explicit expiry. Intermediate unload produces no fare. Capacity cannot go negative. Saved fractional operating costs and demand preserve deterministic continuation. Production shortages/full storage obey recipes. Monthly totals reconcile to ledger, rewards post once, and save/load during dwell preserves exactly-once transfers.
