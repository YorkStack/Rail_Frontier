ASTRA_PHASE_COMPLETE=false
PROJECT_PAUSED=true
RECOMMENDED_MODEL=ASTRA
ASTRA_REVIEW_REQUIRED=false
GRAPHICS_PLANNING_COMPLETE=true
GRAPHICS_IMPLEMENTATION_STARTED=true
GRAPHICS_IMPLEMENTATION_COMPLETE=false
CONSTRUCTION_DESIGN_COMPLETE=true
CONSTRUCTION_IMPLEMENTATION_STARTED=true
UX_PLANNING_COMPLETE=true
UX_IMPLEMENTATION_STARTED=true
UX_IMPLEMENTATION_COMPLETE=false
AWAITING_USER_MODEL_SWITCH=false
DRAW_PLANNING_COMPLETE=true
DRAW_IMPLEMENTATION_STARTED=true
DRAW_IMPLEMENTATION_COMPLETE=false
AWAITING_USER_PLAYTEST=true

# Current status — paused after automatic regional route recovery, 2026-09-22

The user requested a clean pause after the Tyne/Wear route-planning correction. Source, tests and documentation are committed and synchronized to `main` and `implementation/passenger-slice`. Project development servers, preview servers and test browsers are stopped. Resume from the automatic regional route-recovery checkpoint below.

## DRAW: show a buildable railway after the first narrow search fails

- Reproduced the reported Tyne/Wear plan between two automatically oriented coastal stations. The initial 60 m corridor could not fit the required station approaches, while the existing 300 m retry immediately produced three certified bridge/terrain alternatives.
- That wider search now starts automatically after an empty first pass. During it the German/English status explains that a larger detour is being checked; the player's drawing remains unchanged. A failed or unfinished draft clears any stale quoted price from the disabled build button.
- A real Chrome regression builds the first two Tyne stations, selects both rail connections, waits for the automatic fallback, frames the coloured proposal, buys it and verifies a new railway revision plus additional track edges. **245/245 core tests**, localization, TypeScript and the production build pass.

## UX: readable, actionable disconnected-route feedback

- A rejected line now lists every missing consecutive railway connection as **origin → destination**. Pendulum routes check adjacent stops; loop routes also check the return leg. The calculation uses the same live rail graph as route creation.
- The Railway Office keeps the selected stops, moves focus to the explanation and scrolls its complete lower edge into view. The status, route rows and small actions now use readable scaled type and larger targets.
- Verification: **245/245 core tests**, TypeScript, production build and the focused German Chrome journey pass. The browser case checks real station names, focus, a 16 px minimum message size, full panel visibility and unchanged company state. Screenshot: `docs/screenshots/missing-track-connections.png`.
- The player-facing development server remains available at `http://127.0.0.1:5173/` for review. Next remains regional player review and balancing; physical yards/platform expansion and living settlement agents are later systems.

## Previous status — Middle Rhine, Tyne/Wear and Arizona regional expansion, 2026-09-22

## REG-01: two playable European regions and expanded Arizona scenery — 2026-09-22

- Added selectable, playable 32 × 32 km Middle Rhine and Tyne/Wear companies over reproducibly imported real elevation grids. The regional compositions include Boppard/St. Goar/Bacharach and Newcastle/North Shields/Sunderland, terrain-aware settlement placement, roads, vegetation, ports and five industry sites.
- Local Blender generated 46 assets per European region in two LODs: regional buildings, three station eras, industries, vegetation, infrastructure, props, four locomotive eras and eight coach/wagon types. Arizona gains a windpump, ranch fence and eight desert vegetation assets. Original external PBR tiles and pack validation are included.
- Coal, ore, steel and oil inventories, wagon-specific freight capacity, region/year purchase filtering, regional currency display and schema-12 migration are integrated. New European station previews automatically select a low-relief orientation while preserving manual rotation.
- Regional water now clips each authoritative terrain triangle at the interpolated shoreline. The Rhine additionally reconstructs a narrow continuous channel along the local valley minimum where Skadi records the water surface instead of bathymetry. Tyne/Wear retains its real-height estuary and coast without square water-cell steps.
- Rhein-Charta and Tyne/Wear Industrie-Charta replace the copied Norway targets. Their freight objectives count delivered industrial cargo in the simulation; titles, labels, targets and regional currency render dynamically in German and English.
- Terrain source URLs, hashes, bounds, licence and attribution are bundled. Real height data is the geographic base; water stages, settlements, roads and industry sites are selective game compositions.
- Verification: **244/244** core tests, **4/4** focused Chrome journeys, TypeScript, production build, asset validation and diff hygiene pass. New actual-renderer README images show Boppard, Newcastle and the Arizona windpump. [Full scope, provenance and limits](docs/world/REGIONAL_EXPANSION_CHECKPOINT.md).
- Next: player review, then region-specific demand/pricing balance and authored harbour detail. Moving residents/traffic/animals and physical multi-platform yards remain separate planned work.

## LIV-01c: navigable junctions and explicit entrances — 2026-09-22

- Derived roads now have a deterministic graph of real intersections, T joins, overlapping segments, town hubs and authored entrances. Shortest-route queries connect doors to each other or their town hub; nearby disconnected lanes do not acquire invisible links. The access status verifies an actual route.
- Railway/terrain changes and load rebuild geometry and topology together. A checked detour is allowed; an unbridgeable rail cut remains blocked. No implicit level crossing or unverified bridge/tunnel clearance. Managed crossings remain a later component. Cash, demand, station eligibility and schema 11 are unchanged.
- Verification: 238 core tests, TypeScript/production build and seven focused Chrome journeys, including real rail construction in both directions, all initial Norway/Arizona accessible entrances, preview/build agreement and exact reconstruction after reload. [Implementation, crossing policy, results and limits](docs/world/SETTLEMENT_NAVIGATION_CHECKPOINT.md).
- Cleanup: browsers and isolated server stopped; generated acceptance site removed from workspace, logs retained. No graphics changes or new residents in this checkpoint.
- Next: **LIV-02a**, verified doorway/forecourt/platform walking heights and waiting locations, followed by a small period-appropriate resident set linked to actual demand. STX physical station expansion and managed crossings remain open.

## Requested art refinement: regional stations, roads and platforms — 2026-09-22

- Local Blender generated three construction-era station families for Norway and Arizona, with pitched roofs, textured walls, windows, doors, canopies and two LODs. Existing buildings retain their construction-era look; placement ghosts use the corresponding real model.
- Streets now use distinct repeating colour/normal/roughness tiles for dirt, cobbles, gravel and asphalt. Platforms retain exact rail clearance and full saved length, with period surfaces, coping, walking strips, benches and lamps. Rural/door paths stay unpaved. Era boundaries are art-direction choices rather than exact historical dates.
- Schema 11, cash, rail geometry and access rules remain unchanged. Architecture derives from original construction receipts; future ledger compaction must preserve that provenance. Both regional base generators preserve the separately generated station assets.
- Final verification: 234 core tests, TypeScript, production build, embedded/external asset budgets and 6/6 focused Chrome journeys. Initial art-fixture timeout and the subsequent successful runs are disclosed in [REGIONAL_STATION_ART.md](docs/world/REGIONAL_STATION_ART.md). New actual-renderer README images and period comparisons included. Arizona remains a scenery study.
- Cleanup: test browsers/server stopped, generated acceptance site removed from workspace; logs retained in ignored artifacts. Resume **LIV-01c**, then representative residents and STX physical station expansion. No claim of full-century balance or new cross-browser/performance acceptance.

## LIV-01b: check access before buying — 2026-09-22

- The placement preview now shows the real building footprint, street-side entrance, paved forecourt and checked town connection. A short DE/EN access status remains above the purchase button; the scrollable body explains connected, blocked, remote and unsuitable terrain. Rural construction remains possible with a missing visual connection.
- A dedicated cancellable worker runs the actual build command against a private state copy, including engineered terrain and region-specific house placement. The same function generates the built network. Rapid rotation, close, tool/company switches, failure/retry and disposal cannot reuse an older result. Purchase waits for the current result.
- The forecourt is a supported paving/landing and short apron with terrain, slope, building and rail checks. It is not new separately priced grading. No save-schema, fare/demand, cash or track contract changes; schema 11 remains current.
- Validation: 230 core tests, production build and 15 distinct Chrome journeys. Initial browser sweep passed 11/13; the two new locale assertions expected wording that differed from the correct catalogue text. Corrected assertions passed alongside cancellation/retry and the narrow 150% layout. Desktop 150% layout also passed. New final close-up capture is part of the repeated German construction/reload journey. Full accounting and images: [checkpoint](docs/world/SETTLEMENT_PATHS_CHECKPOINT.md).
- README now includes the purchase preview and a close view of the built entrance/forecourt. Test workers, browsers and local servers are stopped after verification; diagnostic logs remain in ignored `artifacts/liv-01b/`.
- Next: LIV-01c explicit navigable junctions/entrances and deliberate path/rail crossing rules. Then representative residents and the STX station-expansion work. LIV-01 overall and cross-browser/human accessibility gates remain open.


## LIV-01a: connected visual paths — 2026-09-22

- Replaced clipped decorative street pieces with a deterministic corridor planner. Actual authored door/threshold meshes and footprint markers provide entrances; rotation and scale remain consistent. All 45 residential plots in the tested new Norway world connect, as do Arizona buildings with authored doors.
- Paths avoid buildings, water, steep terrain and rails. A street-side door/canopy and checked path connect a station when feasible. DE/EN station inspection reports connected/blocked/remote status and explicitly preserves the existing catchment rule. No cash, demand or save-schema changes.
- Connected surfaces have rounded joins, world-space textures and grouped geometry. Farm lanes and house/station paths stay dirt; town-street paving follows the existing presentation eras. Railway/terrain edits rebuild paths; a station build no longer triggers duplicate road generation.
- Validation: 227 core tests, six focused geometry/path/migration tests, production build and eight distinct browser cases. Expanded run first passed 7/8 (toast test assumption); the follow-up exposed missing locale messages, which were fixed. Four affected browser cases then passed; both visual cases were repeated after the texture refinement and Norway again after preserving dirt farm lanes. Exact scope and limitations: [checkpoint](docs/world/SETTLEMENT_PATHS_CHECKPOINT.md).
- Four new verified settlement screenshots are included, with Sundvik and Arizona in README. Cleanup verified: no listeners on 5173/5180/5190, no test browser/driver processes; temporary acceptance build removed. The game preview remains stopped.
- Next: LIV-01b access preview before purchase, graded forecourts, navigable junction contracts and deliberate crossing design. Only then LIV-02 residents or road-dependent demand. STX-01 physical station expansion follows the shared access contract. LIV-01 overall is not complete.

## Expanded play, adversarial and UX review — 2026-09-22

- Completed 18 review roles: 10 player perspectives, 4 adversarial roles, 4 critical UX roles. Eleven distinct new agent workers; remaining 7 roles reused workers after a tool thread limit, with fresh contexts and explicit disclosures. This is not real demographic research. [Results and limits](docs/qa/swarm-2026-09-22/RESULTS.md).
- Fixed 13 consolidated issues, including original quick-save loss after leaving for practice, unsupported physical station upgrades, cramped150% station controls, objective/clock overlap, hidden purchase cash, freight status, existing-service management, first-route framing, invisible rejection feedback, office/train navigation and stalled-industry explanations. Ten P3 items remain documented; one 8× concurrent-browser symptom did not reproduce with a single browser and three trains.
- Validation: 224 core tests, production build,49 distinct browser cases. Broad sweep 48/49; the only failure used an incorrect test locator for an existing proper name. Corrected selector passed 1/1 with unchanged application code. Earlier focused runs and the JSON−0/0 assertion correction are recorded in the report; no automatic retries. The bundle-size advisory remains.
- Station expansion is planned in [STATION_EXPANSION_AND_YARDS.md](docs/construction/STATION_EXPANSION_AND_YARDS.md): real platforms/turnouts, sidings, freight modules, individual wagon stock and consist changes. These features are not yet implemented; current physical platform limits remain enforced.
- Cleanup complete: no listeners 5173/5180/5190, no test drivers or headless Chrome left; generated test sites removed, reports retained. Development preview intentionally stopped as requested. Restart with `npm run dev -- --host 127.0.0.1` to play.
- Next: LIV-01 connected settlement/station access, followed by STX-01 physical station expansion contracts. Human first-play, Safari/Firefox, assistive technology and century-scale balance remain separate gates.

## Continuous station track and platform — 2026-09-22

- Fixed the grass gap at stations: station-pad terrain formerly coincided with the railhead and occluded sleepers and ballast. Explicit station formation now sits 0.55 m below the unchanged rail geometry, matching the connecting track bed. Standard bed preparation remains included in the station price; site-grading quotes are unchanged.
- Derive a continuous platform from the saved station footprint instead of displaying only the 28 m authored slab. The building remains its original size; the platform edge clears the rolling-stock envelope, with a contrasting edge and foundations down to the prepared ground. The original slab is omitted from both runtime asset LODs to avoid overlapping surfaces.
- Save schema 11 migrates existing explicit station-pad heights once. Rail nodes, curves, stations, trains, routes, paid costs, cash and retained planning drafts are preserved. New saves validate the corrected height contract. Patch generator version 1 is unchanged because it already evaluates the explicit target correctly.
- Validation: 219 core tests and production build pass; seven focused Chrome journeys pass for station construction, forward/reverse connections, passenger/mail revenue, orientation persistence in DE/EN and the full station ground height before/after reload. Both final focused rerun cases pass with the added building foundation and connected-train screenshot (`docs/screenshots/station-connected-train.png`). Known build chunk advisory remains.

Next: resume LIV-01 connected settlement paths and station access. The station visual correction does not implement road access or residents.

## Station direction and living-settlement foundation — 2026-09-22

- Added explicit left/right 15° station-preview controls and a selectable settlement bearing. The initial 0° direction is not automatically optimal; the bearing helper is a starting point, not a certified or cheapest route. Existing terrain/cost validation remains authoritative, and built stations retain their saved orientation.
- Moved the existing day/year readout beside the simulation controls so construction and office panels cannot hide it. Panel clearance now follows both actual control-deck heights, including scaled and wrapped layouts. All new controls and explanations support DE/EN.
- Documented the requested connected streets, station entrances, residents, period traffic and animals in `docs/world/LIVING_SETTLEMENTS.md`. These remain planned. Existing roads are textured visual surfaces, not a guaranteed pedestrian network; station demand still uses catchment coverage. The 360-day calendar advances vehicle availability, but multi-century pacing/content remains unfinished.
- Validation: 217 core tests, TypeScript and production build pass. Seventeen distinct browser cases pass: fifteen existing journeys in the focused sweep, then both new DE/EN station/time journeys after correcting a test that read state before the asynchronous Continue action completed. The new cases verify orientation, unchanged preview cash, actual construction, save/reload and a visible date while switching tools. The production build retains the known chunk-size advisory.
- New screenshot: `docs/screenshots/station-direction-time.png`. No road, pedestrian, vehicle or animal simulation was added in this checkpoint.

Next implementation priority: LIV-01, connected settlement paths and truthful station access, reusing the existing road rendering. Then residents, era traffic and proportional animals, each with simulation consistency and visual/performance checks. First-freight guidance and human/Safari/accessibility acceptance remain open.

## Independent player and UX review — 2026-09-22

- Completed the requested two rounds: three independent novice-player agents, followed by two UX agents. Reports, severity, reproduction steps, baseline limitations and disposition are collected in `docs/qa/PLAYER_REVIEW_2026-09-22.md`.
- Corrected paused-service wording and the explicit resume/follow action; reconstruct the office's active service from saved entities instead of recommending an unnecessary new purchase. Opening or advancing setup brings the actual next action into view, including at 1280×720.
- Preserve certified route comparisons across ordinary panel closing and switching; draft/railway/terrain changes still require fresh validation.
- Native button Space activation no longer toggles the simulation. Compact camera controls have localized accessible names, and toolbar spacing follows the actual scaled/wrapped build-control height.
- Aggregate cargo lots for readable localized totals, correct car plurals and fill the reviewed DE/EN operation/destination/success/terrain-option copy gaps.
- Added `npm run test:acceptance`: an isolated build and server on port 5180, fresh contexts, one worker, no retries, retained failure traces/screenshots, HTML and JUnit reporting. It includes construction, real passenger/mail and timber/lumber delivery, save failures, language switching and the new UX regressions.

Validation: 215 core tests and production build pass. 34 distinct browser cases verified: the broad sweep passed 33/34; the remaining stale fixed-pixel layout assertion was replaced by a real control-clearance check, and both practice-service journeys passed on rerun. The final four service/localization cases passed after correcting the last CSS-generated translation labels. Detailed run accounting and preserved reports are in `docs/qa/PLAYER_REVIEW_2026-09-22.md`.

Next: human first-play/Safari/screen-reader checks, then first-freight guidance and wider campaign progression. Small secondary office typography, collapsing completed setup sections and a destination-bearing cue remain design follow-ups. No claim of mobile/touch gameplay or human usability acceptance is made.

## Feasible departures from default station orientation — 2026-09-22

- Reproduced the reported valley failure with two stations placed at the default 0° angle. Both directions failed despite the terrain allowing a railway: the fixed fitting points forced an excessively tight station departure. Two bounded fallback fits now reserve longer endpoint sections when ordinary candidates fail.
- Every fallback retains exact station position, outward tangent and level approach, checks the original ordered drawing envelope and passes the unchanged curve/terrain certificate and live construction quote. No station is rotated and no engineering limit is weakened. Approach options are named in DE/EN; widened smoothing alternatives retain their explicit 150 m disclosure.
- Failure/pending copy now acknowledges the completed drawing, rather than asking the player to finish it again. Failed plans return the step indicator to editing.
- Validation: 214 core tests, TypeScript/production build and six distinct Chrome journeys. New forward/reverse journeys place default stations through the real UI, plan, build at the quoted price, save and reload. Additional regression checks cover a slightly bent wish path, exact endpoints/grades, impossible heights and backwards departures. Screenshot: `docs/screenshots/station-approach.png`.

The independent player and UX audit rounds are recorded above. The planned first-freight continuation remains pending; no freight guidance was changed in the station-approach fix.

## Construction connection markers — 2026-09-22

- Fixed the stack of “Finish here · Rail connection” signs reported after track construction. Degree-two nodes between alignment segments are implementation details and no longer become independent construction targets. Available platform ends, open rail ends and existing junctions remain selectable; the railway itself and saves are unchanged.
- Connection names are laid out in screen space with collision suppression, preferring station names and the focused/hovered target. Compact 44px targets remain available when a name is suppressed, with accessible labels and keyboard selection. Names stay within the viewport, and nested generic connection names are translated.
- Validation: 211 core tests and eight Chrome journeys passed, covering a built highland alignment reopened for construction, real pointer drawing, clickable station signs, compact layout, undo and held-arrow editing. Screenshot: `docs/screenshots/construction-targets.png`.

## From construction practice to a working service — 2026-09-22

- A completed practice railway now offers the next real action: assemble a train, choose stops, assign the service, then resume and follow it. Buying still uses the normal catalogue, platform and cash checks; guidance never purchases or starts time implicitly.
- Progress is derived from connected practice stations, a train parked at either platform, routes serving both stops and actual assigned services. It survives save/load without a save-schema change and reuses a route created before the train. Unrelated routes or idle trains away from those platforms are excluded.
- The Railway Office opens on the appropriate step with the practice stations proposed only when the stop draft is empty. A guided purchase, route creation or assignment transfers keyboard focus to the next control. Existing custom stop drafts remain intact when opening guidance. Switching companies clears transient train/route selection so reused entity IDs cannot attach the office to another company's workflow.
- Town coverage controls the explanation: valley stations may carry available passenger demand; remote practice stops are described as a test service until town stations are connected. The secondary next-lesson button explicitly says it starts another company and saves the current railway first.
- The progress card stays clear of construction/office panels and the lower controls. All new copy is present in German and English.

Validation: 209 core tests, TypeScript/production build and eight distinct Chrome journeys. The new 1280×720 journey builds track, purchases a train, saves/reloads before creating the route, assigns it and verifies actual train distance with no duplicate purchase or railway change. A 390×844 check covers remote-stop copy and usable controls; existing practice transitions, train follow, Railway Office, language switching and exit/save journeys also pass.

Next: unassisted player review of construction-to-service guidance and fuller connected campaign progression. Physical-device/accessibility coverage, adaptive longitudinal subdivision and managed road/rail crossings remain open. This checkpoint does not turn the four separate construction companies into one campaign; DRAW acceptance remains open.



## Train follow, woodland and drawing input — 2026-09-22

- Follow train is hidden until a commissioned service has a valid route and current rail path. F and direct camera calls also refuse invalid targets without moving. The renderer computes the chosen train's actual position immediately, remembers its ID and stops following if that service disappears. Paused, boarding and waiting services remain followable. Camera height is kept above the terrain; tutorial actions target their bound train.
- The locally installed Blender 4.0.2 regenerated both spruce forms, pine, birch, alder and shrubs at two LODs. Strategic LODs now retain irregular, overlapping crowns and branch tiers instead of a single cone or ball. Smooth foliage normals and deterministic edge variation soften the old faceted appearance. The scenery generator owns both spruces, so rerunning the base pack cannot overwrite them.
- Woodland uses shared deterministic stand centres with gaps and mixed species; elevation reduces tree size and density. A bounded 12,000-instance layer of mostly shrubs plus ferns extends around woodland edges, alongside 28,000 trees. Existing water, slope, settlement and live railway clearance checks remain authoritative. Rendering culls individual instance bounds against the camera, including rotation and aspect changes, while retaining a generous edge margin.
- Held-arrow editing is one history gesture and one released planning request. Pointer input avoids duplicate terrain picks and redundant interface updates while retaining accepted samples. Escape, focus/blur, undo, save and out-of-map editing are covered. A small fixed-build experiment improved approximate following-frame delay from 75.1 to 40.0 ms p95; see `docs/performance/ROUTE_PLANNING.md` for its limits.

Validation: 206 core tests, TypeScript and production build, asset validation and 16 distinct focused Chrome journeys. These include no-train follow rejection, the actual paused train position, held-key/cancel/focus/boundary input, saved drafts, drawing/building, service purchase/assignment, DE/EN switching and exit/save behaviour. The 60-second camera sweep and 100-train scale fixture pass the existing frame/draw-call budgets; all four fixed views remain below two million submitted triangles.

Next: player review of the woodland and construction controls; broader physical-device/accessibility coverage, connected campaign progression and managed road/rail crossings. Adaptive longitudinal subdivision and unassisted DRAW acceptance remain open. The woodland is stylised geometry, not photorealistic foliage.



## Responsive cost validation — 2026-09-21

- Live-terrain revalidation now yields between candidates after roughly 8 ms of work, preserving input opportunities while the worker results are checked. All choices remain private until the complete current set is ready. A DE/EN cost-check message and busy state explain the final stage; Build remains disabled.
- Every resumed slice checks the job identity, railway/terrain revisions and track class. Cancelled, replaced and timed-out work cannot publish stale results or clear a newer job. Restarting during validation is covered through the actual browser controls, followed by successful replanning.
- Engineering profiles are reused during ranking, and the selected preview/obstacle markers reuse the same revision-bound live quote. The authoritative certificate and construction-time quote are unchanged. Synchronous and cooperative evaluations return identical geometry, prices and preference choices.
- In a fixed-build Chrome experiment with fourfold CPU throttling, the worst observed frame gap fell from 300 ms to 67 ms and no main-thread task ≥50 ms was observed after the change. Complete results took longer (valley median 472→697 ms; highland 300→375 ms), because rendering/input receive time during validation. This is six runs per revision, not general p95/device acceptance. Method and recorded samples: `docs/performance/ROUTE_PLANNING.md`.

Validation: 203 core tests, TypeScript/production build and eight Chrome journeys, including cancellation during cost validation, drawn-route input, compact keyboard controls, local comparison, undo/redo, saved plans and inlet/ridge construction.

Next: measure long freehand strokes and held-key editing, then broader device/accessibility coverage and connected campaign progression. Adaptive longitudinal subdivision, managed road/rail crossings and unassisted player acceptance remain open. DRAW is not marked complete.


## Previous checkpoint: adaptive railway elevations — 2026-09-21

- Ordered route search now looks ahead along the terrain in both directions. Lower/upper height envelopes at two grade budgets supplement the former endpoint bands and local ground samples. This allows separate climbs and descents at successive ridges; underwater ground does not become the target railway elevation. Exact station/splice endpoints stay fixed.
- A second pass adds finer height choices around three complete first-pass paths. Both passes share the same expansion counter and hard 20,000-state ceiling. At most six complete search paths go to fitting; three first-pass paths retain places when refinement succeeds. If refinement exhausts its budget, completed first-pass paths survive and the partial frontier is discarded. Flat corridors skip refinement. Original fitted proposals remain available.
- Grade cones and search scores guide proposals only. The unchanged cubic certificate, endpoint-grade check, ordered-drawing check, live terrain quote and atomic build command still decide what can be bought. Search options are named **Terrain variant / Geländevariante**, since an improvement can change elevation without making a lateral detour.
- Regression coverage includes two successive hills, an affordable land alternative, exact level endpoints, stricter track classes, shared-budget exhaustion and a finer pass that improves an actual certified quote. All four real-map exercises still construct at the quoted cost; fixed local splices retain their nonzero boundary grades.

Validation: 201 core tests, TypeScript/production build and seven Chrome journeys for drawing/reshaping, compact keyboard controls, saved/retained choices, local comparisons, undo/redo and the inlet-to-ridge transition. A local Node smoke measurement of three full-terrain searches plus quote evaluation for each practice at 60/300 m returned 2–3 choices in 157–788 ms, without exhausting the search budget. Reproduce with `npx tsx tools/benchmark-route-planning.ts`; these timings exclude world creation, rendering and worker transport and do not establish browser p95 acceptance.

Next: measure released-draft latency and drawing responsiveness in the browser, then address observed bottlenecks and remaining interaction/accessibility issues. The search still uses fixed horizontal cross-sections and approximate search costs; adaptive longitudinal subdivision and more exhaustive certified-fit retries remain open. No optimality or completeness guarantee is made. Connected campaign progression, managed road/rail crossings and unassisted player acceptance are still pending; DRAW remains open.


## Previous checkpoint: clearer engineering comparisons — 2026-09-21

- Route choices separate the full construction price from their savings or extra cost. The reference stays fixed while selecting alternatives: option 1 for a general search, the opening `engineering:current` plan for a local obstacle comparison. Prices still come from the exact complete-route quote, never a cosmetic estimate.
- Local comparison headings name bridge or tunnel options and distinguish a bounded obstacle/approach change from a whole-route comparison. The focus action frames the compared curves without changing the draft, choice or quote.
- Outside curves are muted only after their control points match the baseline prefix/suffix exactly. The compared interval accounts for replacements with a different number of curve sections; inconsistent scope falls back to displaying the whole route. The text legend complements colour and stroke weight.
- The chosen option is identified above the build button even while the alternatives list is scrolled. Unselected options keep their title, price and price difference; full engineering metrics expand on the selected option. This keeps the 1280×720 view readable while the purchase action remains visible. DE/EN catalogues cover all new copy.

Validation: 197 core tests plus TypeScript/production build; nine focused Chrome journeys cover compact comparison, fixed monetary deltas, map focus, local/global undo and redo, retained designs, saved construction, the practice transition and the passenger/mail revenue loop. The new comparison test verifies that selecting/focusing spends no money; it was repeated after adding retained keyboard focus to the selected option. Screenshot: `docs/screenshots/route-comparison.png`.

Next: player review of drawing and obstacle choices; adaptive vertical search and broader performance/accessibility coverage remain open. Connected campaign progression and managed road/rail crossings are not delivered by this interface pass. DRAW acceptance remains open.


## Previous checkpoint: sketch correction guidance — 2026-09-21

- Crossing, collinear overlap and out-of-map sketches receive a specific DE/EN explanation and a labelled marker on the landscape. Unsupported self-crossings are rejected before starting the worker, and the proposal generator independently enforces the same check. A crossing within a sketch never implicitly creates a junction.
- The correction action focuses an editable interior point; an off-screen point is brought into view. Dragging, arrow keys and Delete modify the retained draft, and Undo/Redo restore both the drawing and its recalculated guidance. Diagnosis does not rewrite the sketch, spend cash or change the railway graph.
- When search finds no buildable result, a tight-corner heuristic can suggest which point to widen. This is advisory, shown only after a failed search; it is not presented as a curve certificate or used to reject an otherwise valid proposal. Timeouts and worker errors do not invent a terrain diagnosis. The general failure message now explains the next actions in plain language.
- Repair guidance appears before ordinary instructions. While it is visible, the unavailable purchase section is hidden; sketch editing remains the next step. The correction button is visible at 1280×720. Supporting alternative text now uses a readable 13 px minimum rather than the old 9 px override.

Validation: 194 core tests, TypeScript and production build; six focused Chrome journeys cover drawn-route editing/building, retained/global/local choices, save/reload and undo/redo. The new crossing journey checks visible compact guidance, no worker dispatch or spending for an unsupported sketch, DE→EN switching, keyboard correction and recovery to a buildable proposal. Screenshot: `docs/screenshots/route-sketch-help.png`.

Next: review obstacle comparisons and the first-route experience with the player. Adaptive vertical search, wider performance/accessibility coverage, connected campaign progression and managed road/rail crossings remain open. DRAW acceptance stays open.


## Previous checkpoint: ordered route search — 2026-09-21

- The worker now supplements the original fitted proposals with a search across successive cross-sections of the drawn path. Progress is an explicit layer, so nearby return legs cannot replace the remaining journey. Heading, elevation, grade and structure regime accompany each state; lateral and vertical choices can change at successive obstacles.
- Every fitted proposal, including the explicitly labelled relaxed chord and local obstacle alternatives, must visit the sketch in order. Two-way, 15 m sampled gate checks replace the old nearest-segment-only test. This is an intent check; the existing exact curve certificate, authoritative terrain quote and atomic construction command still govern buildability.
- Search uses at most 48 retained states per layer, roughly 50 cross-sections, six terminal paths and one optional rounding pass. The request's expansion budget is shared across this search (hard ceiling 20,000); exhaustion returns no partial path. There is no endpoint-chord heuristic. Intermediate pointer heights do not pin railway elevation. Existing fitted candidates remain available when the search cannot supply a certified improvement.
- An alternating-water-obstacle fixture now produces a certified land route that changes sides and costs less than the bridge alternative. Regression cases cover ordered return bends, shortcut rejection, pointer sample density, impossible grades and exhausted budgets. All four real-map practices still build at their quoted prices.
- Scope: this is a bounded beam search, not an optimal or complete routing algorithm. Elevation samples remain a small discrete set rather than the full adaptive vertical refinement in the target design. Search curves stay within the requested 60/300 m corridor; existing offset proposals retain their original 60 m curve-fitting allowance. Narrow sharp bends may still require reshaping or the explicit wider search. Self-crossing guidance, broader performance/accessibility measurements and unassisted player acceptance remain open; DRAW is not marked complete.

Validation: 189 core tests, TypeScript and production build; six focused Chrome journeys against a fixed test build cover drawing/reshaping/cancellation, compact and keyboard controls, retained choices and undo/redo, save/reload, inlet land/bridge construction and transition to the ridge exercise.

Next: improve actionable feedback for sketches that cannot be fitted, including self-crossings; then review obstacle-choice usability with the player before connected campaign progression. Railway/road crossing gameplay remains pending.


## Previous checkpoint: retained route plans and village roads — 2026-09-21

- Route sketches retain the chosen exact railway curves and track standard when switching tools, opening menus or saving. Undo/redo includes proposal selections, standard changes and sketch edits. Up to 30 past/future draft states travel with manual saves, autosaves and portable archives.
- Save schema 10 adds a separate, bounded `planning` envelope field. The simulation state is unchanged; schema 9 migrates with no draft. Worker jobs, quotes, prices and rendering objects are never saved. Restored geometry is re-evaluated on live terrain, and the usual atomic construction command remains authoritative. Unbuildable retained designs stay editable and require revision or an explicit new search.
- A successful construction clears the draft. Failed storage writes keep the live draft; session replacement adopts a different draft only after the new company was successfully prepared. Comparisons retain exact chosen geometry, not the transient list of all rejected alternatives.
- Village streets replace the long featureless boxes with terrain-conforming curved ribbons along house rows/courts. The circa-1900 art direction uses cobbles on Norwegian town streets and earth/gravel on side lanes and Arizona streets; from 1950 town roads use asphalt while farm-court paths remain dirt. These are visual era rules, not a reconstruction of a historical paving timetable. No world fingerprint or transport simulation changes.
- The gold station preview shows two rails, sleepers, a side platform and a shelter outline. Localized copy identifies it as an unbuilt preview and explains the connection rings.

Validation: 183 core tests, TypeScript and production build; nine distinct focused Chrome journeys cover station-first construction, retained/global/local route choices, undo/redo during search, save/reload, drawing and keyboard/compact layouts, DE/EN and exit recovery, and the complete passenger/mail-revenue loop. The three construction/draft journeys were repeated after final history bounds and road-material polish. Screenshots were captured against a fixed test build, not during Vite hot reload.

Still open: full ordered-corridor search, connected campaign progression, railway/road crossing gameplay, broader performance/accessibility review and player acceptance. The new road system supplies settlement scenery rather than a simulated road transport network.

## Implementation completed after handoff

- Production RailFrontierGame and GameSession with ordered atomic command commits, detached frozen snapshots, fixed-tick RAF interpolation, visibility pause, safe load replacement and complete disposal.
- Safe-integer finance service with ledger reconciliation, category signs, overdraft/overflow rejection, exactly-once command replay behavior and saved fractional train running costs.
- Versioned 16 km Norway heightfield with deterministic fjord/valley relief, sea, forest/rock/urban masks, authoritative settlement elevations and a stable seeded fingerprint.
- Construction handler with live terrain quote/revision checks, funds, engineering span persistence, terminal tangent checks, endpoint junction splitting, inherited infrastructure cost/upkeep and disconnected interior crossings.
- Station content, rail/ground placement and deterministic closest town coverage. Six classes now progress from Rural Halt to Major Terminal; atomic upgrades charge only the cost difference, expand catchment/storage/platform capability, recalculate the served town and raise daily upkeep. Purchases and routes reject trains that exceed platform length.
- Original Norway steam locomotive and coach content, atomic train purchase, connected route validation and route assignment from the train's current station.
- Physical train simulation with consist mass/power/tractive force, signed grade, service braking, advance braking for slower downstream track, exact station arrival, dwell, shuttle reversal and revision-owned graph caching.
- Deterministic full-leg reservations prevent opposing trains from entering the same single-track corridor, retain safety for the whole consist until arrival and expose blocked service state.
- Destination-weighted daily passenger demand, capacity-bound oldest-first boarding, distance-tracked delivery, exactly-once fares, daily maintenance and monthly capital/operating reports.
- FIN-002 adds live company, month, train and route reports without changing schema 3. The Railway Office separates revenue, operating cost and capital; exposes historical track cost, owned asset value and cash-plus-assets company value; and shows profitability for assigned and unassigned rolling stock.
- Connected-town, delivered-passenger and operating-profit campaign objectives with once-only completion.
- Transactional save manager covers manual/autosave, list/latest/delete, content compatibility and failure-preserves-session behavior. The browser shell now saves manually and autosaves daily.
- The visible fjord shell now runs RailFrontierGame rather than the demonstration clock. Live cash, date, passenger delivery, route result, service phase/speed/cargo, speed controls and camera controls read immutable snapshots. Surveyed parallel alignments can be committed through the real construction command and update rendering/cash immediately.
- A responsive main menu now presents the Norway campaign, new/continue flows, settings and credits. Its company archive creates named manual slots and can resume, rename or confirm-delete any slot; unavailable browser storage produces recovery guidance without changing the running company.
- The live HUD presents all three campaign goals from authoritative objective progress and marks completed goals directly from persisted completion state.
- Station placement now begins on open ground. The player picks a location, rotates a live level platform preview, reviews relief, cost and nearby settlement, and confirms a single atomic purchase. Each new station owns two visible rail ports; its internal platform track alone does not activate catchment or train purchase.
- Players connect available station/network ports with a live cubic spline chain. Left click adds intermediate waypoints, mouse movement updates the ghost, another rail connection finishes the draft, and right click or the visible Undo action removes the latest point. All sections retain terrain, grade, radius and engineering checks and commit as one atomic expense and graph revision.
- CON-03 separates the vertical profile from horizontal alignment, makes platform approaches level, preserves continuous waypoint grades and certifies grade plus vertical curvature. Local, regional and main-line standards apply progressively tighter grade/radius rules, distinct construction premiums and authoritative operating speeds; versioned engineering rules are revalidated at commit.
- CON-04 persists versioned semantic station-pad and alignment operations in schema 8. Ground spans derive formation, cutting and embankment sections with quantities; bridge/tunnel intervals preserve the original surface. The runtime rebuilds only affected local terrain cells, publishes the new surface after state validation and renders the same refined triangles used by ray picks and simulation queries.
- Station surveys now sample the full platform footprint, choose a balanced formation elevation and show relief, cut volume, fill volume and earthwork price. The command recalculates that quote, charges one atomic total and publishes a level pad with a feathered terrain transition. Sites up to 12 m relief are supported; more extreme or off-map footprints remain blocked.
- CON-04 structure presentation derives bridge modules, exact end abutments, exact tunnel portals and paired cut/fill retaining walls from persisted infrastructure spans and terrain operations. Continuous structures across Bézier edges suppress internal transitions. Authored Norway Blender assets and a manifest-free procedural fallback share the same deterministic layout; the deleted clearance guesses can no longer invent or duplicate structures after load.
- CON-05 engineering review combines all planned curve sections into one chainage profile. The panel overlays natural terrain and rail elevation, marks ground/bridge/tunnel runs, shows maximum grade, minimum horizontal radius, elevation range and exact cost/length totals, and links pointer position back to a marker on the 3D alignment. Affordable fixed bridge and tunnel corridors commit through the real browser flow; saved classifications drive the exact modules, two abutments and two surface-aligned portals reported by the renderer.
- CON-06 evaluates deterministic terrain corridors between mandatory anchors without blocking the main view. A coarse-to-fine lattice searches horizontal cell, heading, rail elevation, grade band and ground/bridge/tunnel regime inside a capped corridor; Balanced, Low Cost and Fast weights can produce distinct terrain-driven paths. The terrain window is serialized into transferable arrays and processed by a cancellable Web Worker; planning, graph, terrain, class and draft identities reject stale responses. Each returned route is then recompiled, certified, classified and priced against the authoritative live terrain before it appears.
- GFX-R03 replaces the shared periodic sine tile with original Norway meadow/forest-floor/gravel/rock and Arizona dust/talus/compacted-soil/sandstone families. Forest, rock and urban masks drive material regions; steep rock uses triplanar sampling, macro variation is non-periodic, Arizona strata have irregular widths, and explicit sRGB/linear maps, mipmaps and anisotropy preserve stable distance detail without moving authoritative terrain.
- UX-003 turns the railway office into a guided train → stops → start flow. The live consist preview shows real locomotive/car composition, seats, mail or freight capacity, length versus platform, purchase cost, running cost and upkeep. It explains connection, cash, platform and power failures before purchase, pre-fills the first two-stop shuttle after a successful purchase, advances with the returned train/route IDs and shows the running service's next stop, passengers and follow action. Electrification, station, demand, industry and finance tools remain available under one advanced disclosure.
- Schema 9 and the first CON-07 slice add an optional seven-step first-railway introduction. Its compact card opens the relevant real tool, pauses during construction, resumes for service observation and advances from bound entity IDs plus an actual new passenger fare. Guided start, unrestricted free play, lossless dismissal, completed lesson and dismissed-lesson save/reload are browser-verified. Existing schema-8 companies migrate with no active tutorial.
- The visible renderer now uses the deterministic 16 km Norway heightfield, production biome, 28,000 instanced trees, expanded settlement dressing, scaled fog/light/camera bounds and the full three-town corridor. The former 4 km scene remains only as an isolated architecture fixture.
- Every owned train is rendered from the Blender Norway pack. The initial service visibly combines the authored Nord 2-6-0 with two passenger coaches; passenger and freight car placement samples distance behind the locomotive across graph legs, and load replacement hides absent consists.
- QA-001 now passes as a separate empty-network browser journey: Norway selection, camera navigation, free track, two stations, locomotive/coach purchase, route assignment, physical service, passenger delivery, revenue and operating cost, reconciled cash, speed/pause, save, reload, exact load and resumed ticks with a clean console.
- ECON-003 now supplies the first production chain. Granli Forest creates timber into capped storage; Sundvik Sawmill atomically consumes timber and produces lumber. Covered stations transfer both goods through capacity-bound freight wagons, towns consume delivered lumber, distance-based freight revenue posts once, and blocked partial cargo remains aboard.
- The commissioned preview begins with a small working stock so a player can buy a freight consist and operate the full Granli–Sundvik chain immediately. A new company starts with empty industries and must wait for production. The railway office shows recipe progress, storage, timber/lumber inventory and typed onboard cargo.
- The Blender 4.0.2 Norway pack supplies two LODs each for 36 asset types / 72 GLBs plus 12 shared PNG maps, totaling 2.51 MiB: the detailed current railway kit, the 1922 Nord El 1, 1960 Nord Di 3B, 1981 Nord Di 4 and 1996 Nord El 18, mixed vegetation/rocks, eight timber-house finishes and dedicated farm/industry structures. No unrelated model pack is requested.
- Three.js renders material-merged rolling stock/stations as LOD objects and batches the authored scenery, houses and bridge pieces. The final fixed Norway views measure 187–226 calls and 1.45–1.77 million triangles while preserving a 16.8 ms frame p95 in the documented local run.
- The renderer now lives at the production boundary in `src/rendering/fjord-renderer.ts`. Trains and stations carry ephemeral pick identities; town and industry map labels use the same `WorldSelection` contract. A live contextual card reports authoritative state for all four entity kinds and follows a selected moving train.
- EXP-001/002 establish the multi-campaign presentation and terrain boundaries. Registered campaign content selects and validates its renderer, biome, optional asset manifest, camera set and `WorldGenerator` before atomic scene creation. Only the current Arizona world and Norway V2/V3 remain; both V1 generators, campaigns and compatibility routes were deleted before release.
- EXP-003 registers the independent 24 km Arizona Basin terrain study. Its stable basin/range/plateau/mesa/canyon grammar provides three flat settlement sites and two feasible long corridors, including a direct 1.2 km canyon bridge. Layered desert materials, 10,500 procedural scrub/grass/cactus/dry-tree instances, 180 settlement blockouts and five content-owned cameras run without a Blender asset manifest.
- GFX-R06 established the current Arizona V2 world. Authored cross sections distinguish basin, stepped mesas, incised main and side drainage, a broken plateau rim and talus; all three settlement pads remain flat. Both long rail corridors remain feasible, and the northern crossing requires an 809 m bridge with a recorded NOK 413,434,970 total quote. Eight fixed study views expose regional geology, canyon, escarpment, wash, settlement, vegetation, industry and train compositions under the existing two-million-triangle limit.
- GFX-R07 replaces all 180 Arizona settlement boxes with ten original Blender asset types: two timber houses, adobe and brick homes, two false-front/awning shops, depot, water tower, freight shed and mine headframe. Twenty LOD GLBs and nine shared timber/masonry/roof PBR maps load through a required Arizona manifest. Deterministic main and cross streets orient doors and setbacks toward access paths; dedicated entry, street and house-close cameras expose the result.
- Station catchment, industry-site and rail-traffic overlays are available from the strategy toolbar. Overlay geometry rebuilds only when the relevant station, industry or reservation signature changes, and map labels yield pointer input while a construction tool is active.
- Schema 3 adds one economy record per town with local lumber demand and delivery, waiting mail, activity, service duration and fractional population growth. A pure 2→3 migration initializes these values while preserving all prior operations; schema 1 still migrates sequentially through schema 2.
- ECON-004 turns waiting mail into addressed train cargo. Every passenger coach has 24 mail units beside its 48 seats; mail selects the farthest other settlement on the route, accrues real rail distance, remains aboard at intermediate stops and posts one dedicated income transaction at delivery. Schema 4 adds the global mail-delivery total through a strict 3→4 migration.
- TECH-001 removes the hardcoded 1900 purchase path. Campaign start year is authoritative in schema 5, a shared 360-day calendar drives the HUD and availability checks, and the Railway Office fills its locomotive selector from eligible vehicle content. The 4→5 migration restores the historical 1900 epoch without changing older operations.
- TECH-002 persists electrification status, historical construction cost and separate daily upkeep per rail edge. The Railway Office quotes missing route sections and commits them atomically; electrical purchase, assignment and departure paths require powered track. Three.js derives visible portals, contact and messenger wires from this state. Schema 6 migrates all schema-5 edges to explicit unelectrified records.
- VEHICLE-003 adds the 1922 Nord El 1 with researched dimensions and performance, distinct purchase/running balance, and two locally generated Blender LODs. Its coupled rods, side pipework, louvres, glazing, doors, paired diamond pantographs and insulators are validated and rendered in Chrome; pantograph contact height matches the derived overhead wire.
- VEHICLE-004 adds the official 1981 Di 4 delivery boundary and specifications with a distinct angular six-axle Blender model, sloping framed windscreens, high radiator banks, roof fans, exhaust and snowploughs. Both LODs carry complete UVs and remain inside the unchanged vehicle budgets.
- VEHICLE-005 completes the researched locomotive set with the 1996 El 18: a separate swept four-axle electric Blender model with sealed glazing, doors, handholds, intakes and paired pantographs. Its exact 18.50 m rendered length and official performance values are tested against the existing power gates.
- SAVE-003 adds versioned `.railfrontier.json` export and atomic import for every company slot. Imports accept portable or raw saves, enforce UTF-8 byte plus entity/geometry/operational collection limits before graph validation, reject unsupported content before writing, and never replace the live session. The archive reports browser storage usage and actionable quota/private-mode failures; one rejected write cannot poison later saves.
- ROUTE-002 exposes arbitrary ordered station drafts plus shuttle/loop service in the Railway Office. The dispatcher now reserves every edge to the next station before departure and keeps that leg until arrival, so opposing trains wait outside a single-track corridor. A station-blocked service retries after its route or electrification becomes valid.
- Towns count as connected only when a route uses their covered station. Connection and same-day lumber supply raise economic activity; activity above the threshold produces deterministic population growth. Lumber delivery is capped by local demand, with unpaid excess retained aboard.
- Town context cards and the railway office show population, passenger queues, economic activity, lumber demand/supply, mail, connected days and latest growth. A browser run observes the first daily update from 35 to 60 activity in the commissioned corridor.
- Responsive desktop/mobile layouts were visually checked. The regional, station and train-follow views were captured against the production world at roughly 53–60 FPS on the current machine.
- 164 Node tests pass after removing the obsolete V1-only fingerprint test. Focused real-browser terrain, Norway landforms, Arizona architecture, construction, service-builder, tutorial, freight and passenger journeys pass: fixed Norway/Arizona material views with a clean shader console, repeated current-scene replacement, waypoint/undo/port/atomic-build assertions, semantic terrain publication, engineering-profile rendering, bridge/tunnel commit, truthful worker-based corridor selection and the complete station → alignment → consist → route → passenger/mail delivery → save/reload loop. CON-06 also proves that an impossible corridor stays empty after the wider retry. The construction run keeps engineered render/query error below 0.001 m and limits the new local patch to about 15,800 triangles.

## Completed work

- Original repository cloned safely; MIT license preserved. Independent TypeScript simulation/rail/terrain/persistence foundation retained.
- Three.js 0.186.0 + Vite 8.3.0 browser study with 4 km seeded fjord terrain, forest, settlements, water, animated waterfall strip, track, bridge, tunnel portals and a graph-driven Blender wagon.
- Pan/orbit/zoom/tilt, WASD, focus/follow/regional camera; pause/1×/2×/4×/8×; explicit hidden-tab pause; RAF startup timing regression corrected.
- Actual Blender 4.0.2 → GLB → Three.js pipeline proven: axes, metres, pivots, couplers, finite normals, materials and close/far LOD with hysteresis.
- Triangle-exact terrain queries/rendering, cubic root isolation for terrain/water/engineering boundaries, conservative curve grade/radius/cusp certificate and tangent continuity.
- Immutable RailNetwork adjacency/min-heap/geometry cache; isolated frozen snapshots; fixed application, economic, vehicle/station/industry and operational-state contracts.
- Schema 8 plus strict sequential 1→2→3→4→5→6→7→8 migrations and semantic validation; schema 8 adds deterministic terrain-operation state while schema 7 saves migrate with no terrain edits.
- **158 Node tests pass; the focused GFX-R03 terrain, GFX-R04 scenery, GFX-R05/R06 landforms, GFX-R07 Arizona architecture, CON-04 construction, complete CON-05 engineering/structure acceptance, complete CON-06 routing and passenger/save journeys pass in Chrome.** The named waterfall, rock-face and regional views retain authoritative terrain agreement within 0.001 m and no WebGL errors. Type check, both Blender asset-pack checks and the test build pass.
- Actual 5k-edge/100-query and 100-train movement kernel tests; local rendering scale test with 20k trees, 2k buildings, 100 train bodies and 5k strategic rail segments. Around 60 FPS on Apple M2 Pro / Chrome 153 at 1440×900. Full economy/occupancy is not part of that benchmark.
- Resource replacement returns to baseline; final disposal releases geometries and explicitly releases the WebGL context. License/font notices included in production distribution. Documentation, backlog and compact benchmark evidence updated.

## Currently working

The current user priority is regional expansion. The Middle Rhine and Tyne/Wear foundations, interpolated water silhouettes, regional charters and the Arizona windpump/vegetation pass are implemented and ready for player review. The next regional pass should tune demand/prices and add harbour detail. The earlier living-settlement roadmap remains valid after that review; the drawn-route human acceptance also remains open. Do not resume the earlier SOL-pause instruction.

Norway V3, Arizona V2, Middle Rhine V1 and Tyne/Wear V1 are current. Arizona remains a terrain study; the two European additions are playable free-company foundations. Current saves use schema 12; schema 11 companies migrate without regional assets being invented.

## Stable contracts

- src/domain/model.ts + operations.ts: SI state, typed IDs, command sequence, operational/cargo/finance/content and town-economy records.
- src/application/ports.ts + snapshot.ts: UI command/storage/render boundary and detached frozen state.
- src/world/terrain.ts + domain/curve-math.ts: triangle surface and exact crossing rules.
- src/rail/geometry.ts, constraints.ts, planner.ts, graph.ts: cubic/arc/traversal/quote/cache rules.
- src/simulation/clock.ts: 20 Hz fixed steps, preserved time debt and compressed calendar contract.
- src/persistence/save.ts: schema 12 and sequential versioned migrations; indexeddb.ts: atomic slot backend.

Do not casually change units/axes, graph identity/connectivity, tick cadence/order, typed IDs, command atomicity or saved operational semantics. A genuine redesign follows ASTRA_ESCALATIONS.md; there is no open escalation now.

## Known limits and remaining product work

Graphics and first-use UX are not yet visually/product accepted. Readable UI scaling, station-first placement, waypoint planning, semantic engineering structures, corridor alternatives and the hands-on tutorial are implemented. Freehand drawing, draggable route edits and complete-route comparisons now run in the game. Local engineering choices remain planned. Product acceptance awaits the user’s actual playtest.

The preview commissions its first railway, stations, passenger service and industry stock automatically, while “Start new company” begins with empty track and empty industry inventories. The Norway production objects use the authored Blender pack, including dedicated farm, timber-yard and sawmill structures.

Conservative curve rejection, one-chunk terrain and remaining release-only cross-tab/save-fixture work are documented in TECH_DEBT.md and SAVEGAME_FORMAT.md. The default Vite 500 KB chunk advisory remains: Three.js is 643.43 KB minified / 161.56 KB gzip; total initial payload stays below the 5 MB budget. No warning is suppressed.

## Git state and reproduction

Branch: implementation/passenger-slice. Remote: https://github.com/YorkStack/Rail_Frontier. Completed milestones are synchronized to both `implementation/passenger-slice` and `main`, as requested. No deployment has been performed.

Development: npm ci; npm run dev → http://127.0.0.1:5173.
Production preview: npm run build; npm run preview → http://127.0.0.1:4173.
Checks: npm run check; npm test; npm run validate:assets; npm run test:browser.
Benchmarks: npm run spike; npm run spike:network. Browser tests use installed Google Chrome.
Blender generator: see ASSET_PIPELINE.md; generated GLBs are tracked so running the app does not require Blender.

Next: LIV-01 settlement paths and station access; keep the construction/service acceptance suite passing. Commit and push each completed checkpoint to both branches and verify their remote hashes. Great River and advanced signaling remain later systems.
