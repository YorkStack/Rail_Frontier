# Draw the railway: player intent, engineering choices, construction

## Clearer engineering comparisons — 2026-09-21

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


Date: 2026-09-20. **First integrated drawing slice implemented for playtesting. The user requested continued Astra implementation; the earlier SOL pause is superseded.** Runtime baseline: `e70bddd`; repository checkpoint before this design: `dcd777e`. This brief takes priority over the waypoint and route-mode UX in STATION_TRACK_DESIGN.md and ONBOARDING_AND_CONTROLS_PLAN.md. Their geometry, economy, terrain and transaction contracts still apply.

The user rejects the current construction experience as abstract. A passing automated build test does not resolve that feedback. CON-02/05/06 remain technical foundations; their player-facing acceptance and UX-002 are reopened. Finish this work before further graphics or campaign expansion.

## Implementation checkpoint: first real-map slice

The runtime now supports clicking and drag drawing in one tool, draggable/keyboard-movable handles, undo/redo, gesture cancellation, retained drafts when closing the tool, explicit endpoint selection, camera isolation, visible cost/geometry choices and a whole-alignment build through the existing command gateway. **Try track drawing** opens a separate company with two stations paid through real placement commands, on the current Norway terrain. An active company is archived before replacement. The practice remains playable and saveable after construction; no fake money or mock terrain is used.

`wish-path.ts` simplifies horizontal strokes. `wish-corridor.ts` currently evaluates a bounded family of fits, grade-constrained smoothed terrain-height candidates and lateral offsets, plus an explicitly labelled endpoint-chord smoothing candidate only when the wish path stays within 150 m of it. Intermediate pointer Y does not constrain rail height. Candidate certification/quotation is shared with the existing worker/main/command pipeline. Up to three distinct proposals are displayed with real grade, length and bridge/tunnel lengths. Selection changes the real preview; ghost bridge supports/tunnel portals and screen-space line patterns distinguish structures. Direct drawing replaces the old click/mousemove handlers.

**Scope differences from the full target below:** this slice uses bounded candidate fitting (at most 112 attempts across simplification, offsets, height-follow and smoothing choices), not the proposed ordered-lattice/vertical dynamic search. Global alternatives replace the whole route; obstacle markers now also offer fixed local splices. Wider offsets are 300 m; the worker is stopped after eight seconds if unresolved. UI text and first-route guidance are partly localized, while detailed engineering errors/profile labels retain existing English copy. No claim of optimal routing, complete keyboard/no-drag parity, exhaustive boundary handling or measured 2-second/performance acceptance is made. Drafts remain session-only. These items and human acceptance remain work, rather than being marked complete by the first passing journey.

Immediate review task: draw Sundvik → Granli, move a bend, compare a terrain-following/smoothed route with a more structural option, build and run a train. Continue with Astra after the player's feedback; reconsider SOL once this interaction works well for them. The original contracts below are the remaining implementation target, not a list of completed features.

## 1. The intended experience

**Choose a station → draw where the railway should go → shape the line → compare solutions at obstacles → buy the reviewed railway.**

The pleasure comes from tracing the shore, finding a pass and seeing a railway settle into the landscape. A drawing is an intention, not an obligation to copy every mouse wobble or the height of the ground. The game respects that intention and makes the expensive decisions visible. It must never silently reroute a shoreline railway across the other side of a mountain.

Keep real station ports, real money and the real simulation. This is a replacement for the existing player-facing planner, not a second construction system. No new renderer, Blender asset pass, save-world version or game-save schema is needed for the editor itself.

The [interactive concept](../prototypes/drawn-route.html) demonstrates input and presentation only. Its illustrated map and comparison amounts are fictional; no game solver, feasibility or live finances are represented. Hand-drawn paths deliberately receive no fabricated engineering price. Use it as an interaction reference, not as an implementation shortcut or evidence that the new planner works in game.

## 2. Audit of the current implementation

| Observed implementation | Why it obstructs this experience | Decision |
| --- | --- | --- |
| `src/main.ts`: `freePoints: Vec3[]`, click/mousemove/contextmenu handlers; each click adds a mandatory point | Many clicks, no continuous drawing or handle dragging; clicked terrain height constrains the line | Capture an ordered X/Z wish path; keep rail elevation separate |
| `updatePlanner` and `corridor-alternatives.ts` pass anchor elevations to `solveVerticalProfile` | Drawing over a ridge tends to require climbing it before a tunnel can be considered | Only real endpoints and explicit engineering boundaries constrain elevation |
| `corridor-lattice.ts` bounds lateral deviation from the straight endpoint axis; calls split at mandatory anchors | A curved wish path cannot be represented faithfully as a soft continuous corridor | Search around the ordered wish path, not just the start/end chord |
| `#alignment` includes fixed study corridors and `#route-alternative` offers Balanced / Low Cost / Fast | The player operates an engineering demonstration instead of a route-building tool | Remove study presets from ordinary gameplay; retain reproducible engineering fixtures in tests |
| `FjordRenderer.controls` uses OrbitControls; main independently listens for map clicks | Left-drag drawing would also rotate the camera; release may produce an accidental click | One explicit pointer-gesture owner, with cancellation and restoration |
| Worker identity has request/graph/terrain/class/draft fields | Good stale-result foundation, but session and proposal selection need explicit ownership | Extend the existing protocol, never add another worker pipeline |
| Existing construction gateway prices and validates whole cubic chains; 127-section cap | Strong reusable authority; UI alternatives cannot be cosmetic swaps | Every candidate must compile, certify, classify and quote through this path |

The existing vertical solver is a shape-preserving interpolator over supplied elevations, not a terrain-aware optimizer that automatically discovers tunnel/climb tradeoffs. The existing lattice uses approximate structure costs and coarse terrain snapshots. Keep both as reusable parts, but do not describe the requested new decisions as already supported.

## 3. First-use scene and layout

Physical scene: a player at a laptop or desktop, viewing a bright fjord landscape at normal browser zoom, wants to explore and make one railway decision at a time. Use opaque, dark, warm-green tool surfaces with light text for stable contrast against sky, rock and water. Retain the game's restrained brass accent. Terrain remains the dominant view; geometry types use a small secondary semantic palette, text and line patterns.

- Enter from a station's **Gleise anschließen / Connect track** action or **Gleise bauen / Build tracks**. With no stations, offer the real station tool immediately. No empty endpoint dropdown.
- Once a start port is chosen, frame the station, a useful stretch of terrain and nearby destinations. Do not zoom to the entire 16 km map. Camera framing is based on world bounds and screen occupancy, not a Norway-only coordinate preset.
- One compact bottom tool strip: **Zeichnen · Punkte setzen · Rückgängig · Wiederholen · Verwerfen**. A concise instruction sits above it. Standard track class defaults to the available local railway; advanced standards live under **Details**.
- A modest bottom/right summary shows destination, approximate/final cost state, length and **Strecke prüfen**. Reviewing shows the actual payable total and remaining cash beside **Für … bauen**. Engineering profile, radius and itemized costs start collapsed.
- Obstacles get numbered markers at their real locations. Selecting one opens one comparison panel, with at most three meaningful solutions. Hover/focus previews an alternate ghost; selecting retains it. An explicit **Übernehmen** changes the draft. No automatic camera flight just from hovering.
- Main text 16 CSS px; explanatory text at least 14 px; primary controls and target hit areas at least 44×44 CSS px. Respect existing UI scale, browser 200% zoom and focus rings. At 1280×720 keep map, active instruction and confirmation usable without panel overflow. At narrower widths use one bottom sheet; do not shrink text. Full first-route copy must exist in DE and EN.

### Visual grammar

Wish path: fine brass dashed ribbon projected over terrain. Calculated rail: solid double line with restrained sleepers when close. Ground: continuous rail; bridge: elevated deck and support silhouettes; tunnel: portal pair with dashed underground connection visible only in planning. Ground/climb, bridge and tunnel also have text labels and distinct patterns; color alone never communicates feasibility. Invalid spans use a short crossed section and a reason at that location. Pending work remains visibly a sketch, never a green buildable line.

Preview uses the same accepted section/span data as construction, with lightweight pooled meshes. No earthworks or authoritative state changes before purchase. Terrain rendering and the fitted rail stay spatially consistent at near and regional views.

## 4. Precise input contract

**One tool for clicks and strokes.** Click a named station sign to arm the start, or start dragging directly from it. Click open land to append a coarse shape point, or drag to trace a stroke. Release anywhere without losing the draft; continue at any next location without returning to the tip. Show the provisional next segment at the pointer. Release near a compatible destination or click its sign to finish. A free-land click never finishes or buys a railway. Clicks and strokes share the same wish path and solver; no mode selector is needed. This replaces the original separate Draw/Points modes following player feedback.

After a stroke or completed route, show a few large shape handles. Drag a handle to reshape the wish path; grab any segment of the wish line to insert and drag a handle. Select a handle and Delete removes it; endpoints require explicit reconnection. Entire gestures, not each pointer sample, are undoable. Undo/redo restores intent and selected engineering preferences, invalidates previous quotes and recomputes safely. Clicking terrain after completion must not erase the whole draft as it does today.

| Gesture | Drawing/editing tool behavior |
| --- | --- |
| Left drag | Start from a station, extend the sketch anywhere, or reshape its line/handles; never orbit simultaneously |
| Space + left drag; middle drag; right drag | Pan camera; suspend drawing first. Right-click without drag is not Undo |
| Alt + left drag | Orbit while not in a captured drawing gesture; visible camera help explains it |
| Wheel / trackpad scroll | Zoom while no stroke is captured; preserve world-space intent |
| Esc while dragging | Cancel this gesture and restore its before-state |
| Esc otherwise | Suspend tool, retaining draft in this session; explicit Verwerfen clears it |
| Ctrl/Cmd+Z; Ctrl/Cmd+Shift+Z | Undo/redo when focus is in the planner; never hijack text inputs |
| Tab, Enter/Space | Navigate start/destination lists, decision options, handles and build actions |
| Selected handle + arrows, Shift+arrows | Move in world X/Z by 5 m / 25 m, announced; no camera movement |

Choose gesture ownership at pointerdown after a 4 CSS px drag threshold. Exclude overlay/control events. Set pointer capture and disable competing OrbitControls behavior **before** it receives a drawing drag. Suppress synthetic click on release. One controller owns the sequence; do not layer independent mouse/click handlers over OrbitControls. Restore controls on up, cancel, blur, disposal and session replacement. Stop inertial orbit before drawing; lock camera transforms for that stroke so ray samples share a stable camera. Pause a stroke at a missing terrain ray hit (sky/off-map); never interpolate a hidden gap. Second-finger touch/pointer cancellation restores the in-progress stroke; touch drawing is optional after the desktop path works.

A 44 px port affordance snaps in screen space, with a bounded world-distance check; show its station/direction before capture. Never snap across unrelated terrain just because the overview overlaps two ports. Preserve the exact node position and outgoing/arrival tangent. Destinations can be compatible station ports or safe existing endpoints. Mid-edge junctions, automatic new stations and disconnected track purchases remain outside this pass; explain those restrictions and offer **Bahnhof am Ziel bauen** using the existing tool, retaining the sketch and revalidating it afterward.

## 5. Intent and result data

Introduce a transient typed draft, owned by a small UI/controller module rather than more state in `main.ts`:

```ts
type WishPoint = { x: number; z: number }; // metres; never a terrain Y constraint
type DraftPhase = 'start' | 'drawing' | 'editing' | 'solving' | 'review' | 'committing';
// Design contracts, not already-exported production types:
interface RouteIntent {
  id: string; revision: number; startNodeId: string; endNodeId?: string;
  wishPath: WishPoint[]; corridorWidthM: number; trackClassId: string;
  decisions: EngineeringPreference[];
}
// Each preference references a stable wish-path interval and a geometry policy,
// not the currently displayed curve's chainage or a fabricated cost multiplier.
// A Proposal carries: identity, exact curves, certified spans, quote, issues,
// wish-path deviation, route metrics, and comparison provenance.
```

Reuse branded domain IDs/track-class types in implementation. Bounded history holds 30 gesture snapshots; route samples max 2,048 before simplification, shape handles max 64, final chain max 127 sections. Reject limits with an actionable message, never silently truncate the destination. Drafts stay in memory while switching camera/tools and are cleared on successful construction or confirmed discard. New/load/session replacement warns if a draft will be lost and cancels workers. Game saves contain built infrastructure as today; editor persistence is deferred, with visible **Ungebaute Entwürfe werden nicht gespeichert** copy.

Sample at most once per animation frame after ≥4 CSS px movement. Convert to world X/Z and resample by arc length. Use bounded Douglas–Peucker simplification (initial tolerance `clamp(2 * metresPerPixel, 2, 12)` metres), preserving endpoints and deliberate edits. Validate simplification against the original wish path and water/ridge transitions before discarding shape. Self-crossings/doubled-back scribbles show a local edit hint; do not reinterpret them as junctions. Store raw stroke input only for the current gesture; render a lightweight ribbon immediately, not a full solver at every move.

## 6. Respect the line, then solve the engineering

Use the existing worker and exact geometry/quote pipeline. Extend its request with intent, preference intervals and a session token. Sketch revision, graph revision, terrain revision, track class and rules/solver version form a complete identity. Cancel old jobs on every edit. Restarting a worker cannot make an earlier session result valid.

1. **Immediate sketch:** update ribbon/handles in one frame. Any coarse amount is clearly marked as an estimate and only shown if calculated; otherwise say **Kosten werden geprüft**. Build stays unavailable.
2. **Intent corridor:** create an ordered polyline corridor, initially ±60 m, optionally **mehr Spielraum** to ±150 m. These are tunable game settings, not accuracy claims. Sample cell/primitive membership along its swept length, not only endpoints. Preserve order using a progress bin in lattice state so a hairpin cannot shortcut across nearby later segments. Reject unsupported self-crossing intent for this release.
3. **Candidate search:** replace the straight-axis envelope in `corridor-lattice.ts`. Retain heading, height, grade band and structure regime; add wish-path progress. Use positive normalized length/capital/grade/turn costs plus squared normalized deviation integrated over distance. Use a zero heuristic until an admissible lower bound for the new objective is proven. Branches outside the corridor are separate explicit detour proposals, never the default answer.
4. **Rail elevations:** endpoints come from actual ports, with compatible direction/grade. Intermediate heights are search variables bounded by endpoint grade cones and terrain/structure rules. A ridge sample cannot pin rail to the summit. Refine each horizontal candidate with a bounded distance/elevation/grade dynamic search; grade and vertical-curvature constraints remain hard. Fit shared-grade spans using the existing vertical solver, subdivide where needed and certify the emitted cubic chain. If fit fails, retry another candidate within budget or report no result. Do not quietly relax constraints.
5. **Exact review:** compile whole candidate, certify geometry/joins/endpoint tangents, quote on live authoritative terrain, prepare/check terrain and construction prerequisites without mutation. Sampled worker terrain can propose a route, but cannot authorize it. Reuse/extract pure preparation from `application/construction.ts` where needed, rather than copy cost logic into UI. Return structured issue codes, positions and corrective actions.
6. **Meaningful difference:** deduplicate geometrically equivalent proposals. A bridge label requires an actual bridge span; a tunnel label requires actual tunnel geometry, cover and portals. Report length, capital cost, max grade, structure lengths and current-class speed limit. Do not promise exact journey time or locomotive hauling capability without running the corresponding train model.

Bound initial search at 20,000 total expanded states per evaluation job (shared across all stages/candidates), at most six candidate chains and three displayed alternatives; terrain snapshots retain the existing 40,000-cell cap. Selected local challenge jobs may use the same budget, never multiply it invisibly by each waypoint. Cap vertical states and check cancellation at least every 256 expansions. Search outside the captured window must recapture/revise identity, never use clamped edge heights. Instrument targets on the development Mac: immediate drawing p95 <33 ms; released-draft result target <1 s, explicit still-calculating feedback after 250 ms and a bounded unresolved outcome by 2 s. These are acceptance targets, not measured results. If budgets cannot produce representative buildable routes, improve search/refinement, not false feasibility or unbounded work.

### Local engineering decisions

Detect contiguous obstacle intervals from actual candidate structure spans, terrain conflicts and grade/radius issues, mapped back to stable wish-path progress. Merge nearby issues whose vertical/curve approaches interact. Start with the highest-cost or blocking issue; other choices stay optional. On a normal flat section no decision panel appears.

| Situation | Candidate policies to actually evaluate | Useful player explanation |
| --- | --- | --- |
| Ridge | Tunnel through ridge; climb/pass with adequate approach; contour detour | Tunnel buys a gentler profile; climb may constrain heavier trains; detour consumes distance |
| River, inlet, valley | Bridge; upstream/downstream land detour; valley descent/crossing only if a legal crossing remains | Compare the whole route, including approaches and residual small bridges |
| Sharp desired bend | Widen bend within allowed corridor; explicit wider outside detour | Show how much the rail leaves the wish path and why |
| Excessive capital | Cheapest feasible candidate found; revise selected expensive span | Show shortfall and resulting full-route amount; never claim global cheapest |

Policies constrain geometry: a tunnel candidate requires legal sustained cover in the selected ridge interval; a climb forbids tunnelling there and searches viable heights/approaches; a ridge detour routes outside that obstacle and within a clearly drawn enlarged envelope. A water detour avoids the selected crossing, but any water crossed elsewhere still needs a valid structure. Unsupported underwater tunnels and impossible grades are not available solutions.

For local alternatives, select splice boundaries outside the obstacle and its necessary approaches; preserve position, tangent and grade at both ends and retain unaffected cubic sections exactly. If no solution fits, expand the displayed affected interval once with a visible explanation. If still impossible, offer an explicitly **whole-route** alternative; never pretend only a short section changed. Show both affected segment and whole-route totals. Deltas are always relative to the same current, valid baseline; without one show absolute proposal costs only. Other accepted preferences become constraints in subsequent jobs. Conflicting decisions are surfaced together, never silently overwritten. Accepting an option increments the draft revision and revalidates the complete line.

## 7. Review and atomic build

Every finish/edit first yields a review, never a purchase. The review remains on the map with real bridges and portal positions visible. Button copy includes the exact amount and currency; display remaining cash and any warnings. Any geometry, preference, class, graph or terrain change immediately invalidates the previous quote. Insufficient cash is a distinct state from bad geometry. Worker failure leaves the sketch editable and retryable.

Use existing `buildAlignment` through the ordered command gateway. Commit the reviewed curve chain unchanged; never rerun a heuristic and buy a different line. Main's preview and command quote must derive from the same prepared candidate. Recheck revisions, endpoints, whole-chain constraints, cost, terrain preparation and funds atomically. Disable duplicate submission while pending; preserve existing command sequence replay semantics. If terrain/rules/session changed but graph did not, still reject the stale proposal before dispatch, with authoritative validation retained in the handler. Failure retains draft and camera; no cash, IDs, graph or terrain partial effects. On success clear history, select the built line and offer **Zug zusammenstellen**. A brief construction reveal is cosmetic, respects reduced motion and never delays simulation validity.

## 8. Teaching through play

Adapt the existing first-railway tutorial, do not add a separate wizard. First guidance: **Ziehe deine Strecke am Ufer entlang zum zweiten Bahnhof.** Show the two endpoint handles and a faint optional suggested corridor. It is a hint, never automatically built. User may draw a different route.

First route should be short, affordable and normally need no engineering question. A second optional practice challenge introduces one inlet with a real bridge/detour choice, then a ridge with tunnel/climb/contour choices. Check those examples against current Norway terrain; use separate deterministic fixtures for tests. Do not reshape or flatten campaign terrain to make a screenshot pass. Do not lock essential route solutions behind first-fare progression. Advanced manual elevation, bridge styles, yards and live mid-edge junctions remain later work.

Tutorial completion uses actual accepted/built graph state and existing learning evidence. Hovering a proposal is not planning completion; a sketch alone is not buildability. Existing services, first-fare progression, named practice saves and schema-9 learning continue to work.

## 9. SOL implementation slices

| ID / order | Concrete work | Completion gate |
| --- | --- | --- |
| DRAW-01 | Extract `src/ui/route-planner-controller.ts` and intent/history model; unified drawing/click input, line editing, handles, keyboard; add explicit input ownership to `fjord-renderer.ts`; replace current map handlers | Real 3D stroke follows pointer without camera jump; edit/undo/redo/cancel work; world/cash unchanged |
| DRAW-02 | Extend existing worker identity/protocol, ordered wish corridor, free vertical search, exact preparation/quote; shared draft-to-proposal API | Bent shore route respected; drawing across ridge does not force summit height; no stale/uncertified build |
| DRAW-03 | Derive issues and generate geometry-constrained local alternatives; splice boundaries and conflict handling | Real bridge vs detour and tunnel vs climb/contour when feasible; changed geometry, truthful totals and full-chain certification |
| DRAW-04 | Lightweight world preview from actual spans; comparison panel, readable DE/EN summary, review/build; replace player study dropdowns | Changes visible on map; ordinary land free of engineering clutter; exact preview purchased atomically |
| DRAW-05 | Adapt first-use tutorial, port/destination lists, no-drag path, keyboard editing, zoom/layout and save/tool transitions | First railway from empty company with normal-size controls and no console commands |
| DRAW-06 | Integrated functional, performance and human playability review; replace old selector-based browser journeys; record screenshot/video evidence and README | Complete station → drawn railway → train/service → first fare → save/reload; player acceptance separately recorded |

Reuse `alignment-solver.ts`, `vertical-profile.ts`, `corridor-lattice.ts`, `corridor-alternatives.ts`, `corridor-worker-protocol.ts`, `terrain-window.ts`, the existing worker, `planner.ts`, `constraints.ts`, `application/construction.ts`, `engineering-profile.ts`, `tutorial.ts` and `interface-language.ts`. New small modules should isolate input, intent normalization or structured issues, not duplicate geometry/economy. Keep engine meshes, world generators and built save data as they are. Remove replaced obsolete UI/handlers as each slice lands; no retained V1 planner or user-facing legacy toggle.

### Required evidence

- Input: true pointer drag and mixed click/drag journeys, camera pan/orbit, release outside canvas, blur/cancel, port snapping at two zooms, completed-draft click safety, keyboard undo/redo and no accidental build.
- Geometry: jitter normalization; U-shaped wish path does not take its chord; stable results across input sample rates; ridge picked heights are not rail constraints; endpoint tangency; local splice C1/grade continuity; impossible/exhausted candidates explicitly unavailable.
- Choices: a genuine tunnel/climb or contour pair and bridge/detour pair, distinct exact curves and quotes; no forced three choices; preserving earlier decisions; wider edits clearly flagged; quote totals match ledger and saved spans.
- Safety: edit/class/session/terrain change during job; stale response after new company; cancel/undo during solve; cash changes before purchase; double-click build; forced validation failure leaves complete state unchanged.
- Product: 1280×720 and 1440×900, 100%/200% browser zoom and supported UI scaling, DE/EN, one panel at a time, focus and color-independent feedback. Review real gameplay screenshots, not just counts.
- Measure on the named Mac/Chrome: drawing frame timings, bounded solve latency/expansions, worker cancellations and preview resources after repeated edits. Existing app tests plus revised construction/tutorial journeys must pass; old presets may remain only as test fixtures.
- Human task: without outside instructions, draw two different routes, reshape one bend, explain one bridge/tunnel tradeoff and build a first connection. Target first valid route within three minutes after stations exist. Measure observed time/help, not automation speed. Report enjoyment/control feedback separately; do not mark this gate passed on the user's behalf.

## 10. Handoff and resume instruction

**Historical planning handoff, superseded by the user’s request to continue implementation with Astra.**

At the original planning checkpoint no DRAW runtime work had been completed. That instruction is now historical; see the implementation checkpoint above. The original proposed order was **DRAW-01**, then DRAW-02; deliver a usable real-map draw/edit/build slice before polishing comparison panels. Do not stop with another static mock or only change labels. DRAW-03–06 complete the requested experience. Run relevant checks for each completed slice, record evidence and sync the tested checkpoint to both `implementation/passenger-slice` and `main` on `YorkStack/Rail_Frontier`. Do not force-push.

Suggested user continuation: **„Weiter mit SOL ab IMPLEMENTATION_PLAN.md, DRAW-01. Setze den gezeichneten Streckenplaner gemäß docs/construction/DRAWN_ROUTE_PLANNING.md um.“**

### Planning-turn verification

The standalone HTML concept was exercised in installed Chrome with Playwright: freehand start-to-destination stroke, point-mode completion, handle drag, undo/redo, keyboard history, Escape rollback, ridge variant geometry change and both bridge/detour states. No page errors were observed. Screenshots at desktop and 1280×720 were visually inspected; a 720 px layout check found no horizontal overflow. Evidence is local under `artifacts/evidence/drawn-route/` (ignored artifacts, not gameplay screenshots). Relative links in the changed plans and `git diff --check` were checked. No game runtime, save data or assets changed, so the game's regression suite was not rerun. These checks accept the concept's interaction only; DRAW implementation and human gameplay acceptance are still pending.

### First runtime verification

- Core suite: 168 Node tests, including new hill/tunnel versus land-detour, bridge versus land-detour, wish-height independence, bend preservation and impossible-grade coverage.
- TypeScript and production build pass. The existing Three.js chunk-size advisory remains.
- Thirteen relevant browser scenarios were exercised in batches: construction, freehand/history/variant/build/reload, two engineering structures, two runtime/scale checks, full passenger/mail first-fare/save flow, menu/archive, session replacement and four tutorial/practice scenarios. Updated selectors distinguish the wish ribbon from classified preview paths and allow the new explicit connection buttons. The final midpoint-editability change was followed by the construction and drawn-route browser tests again.
- The German direct practice link was exercised, screenshots inspected at 1440×900 and 1280×720, and the compact purchase button checked inside the viewport. New real-game screenshots are in docs/screenshots/drawn-route-*.png. This is focused desktop evidence, not the full cross-device/performance acceptance from DRAW-06.
- The player subsequently tried the first checkpoint and found it better but still unintuitive. The feedback pass below supersedes its mode-switching interaction; usability/enjoyment acceptance remains open.


### Interaction feedback pass, 2026-09-20

The player rejected the remaining friction in the first drawing slice. Replaced the separate draw/point modes with one interaction: choose a named station sign, click or drag a wish path, release anywhere, continue elsewhere, then choose the destination sign. The next segment follows the pointer before committing a click. Station targets have 44 px controls and full clickable labels, with a 42 px snap radius and highlighted destination feedback. A station presents its available port facing the start/other station; interior network connections remain available. Selecting a station no longer changes the camera.

Completed wish-line segments can be grabbed between handles to insert and move a control point. Undo and Escape restore the exact prior draft. Existing handles support arrows and Delete. Start/end names remain visible during review. The dashed wish and coloured certified railway remain distinct, with explicit instructions about which is built. No solver, construction transaction, finance or save-schema changes are made by this pass.

The panel follows Start → Draw path → Build; irrelevant purchase controls are absent while sketching, track standards are collapsed, history stays accessible, and the compact review exposes the first proposal and purchase button. The two drawing modes and the 40 px last-tip continuation gate were removed, with no legacy input path retained.

Verification: unified click/drag continuation away from the tip, large-label station selection without camera movement, cursor preview, whole-segment reshaping/undo, keyboard endpoint selection/handle editing, 1280×720 first-action and review visibility, and the existing atomic build/save/reload scenario. Human acceptance remains pending. This historical interaction pass preceded the local obstacle slice recorded below. Ordered corridor search remains open.


Recorded checks for this feedback pass: 168 core tests; TypeScript and production build; seven focused browser scenarios (station-first construction, three drawing/keyboard/layout journeys, two persisted engineering-structure journeys, and the complete passenger-revenue/tutorial/save journey). A development-server reload interrupted an overlapping build/test run; the affected drawing scenario passed when repeated against the unchanged server. New screenshots were inspected at 1440×900 and 1280×720. These results do not replace the pending human playtest or the complete DRAW-06 performance/accessibility matrix.


## Budget and terrain decisions checkpoint — 2026-09-20

The player accepted the simplified drawing and explicitly asked Astra to continue. Three practice companies now progress from the valley to a west-bank inlet and a mountain ridge, using actual Norway terrain and actual paid stations. NOK 10m opening capital creates room to experiment; ordinary new V3 companies use NOK 5m. Existing companies retain their balances. Practice completion is recomputed from connected founding stations, including after save/load. Switching first archives the current company; the advanced exercises sit under an optional menu disclosure. This is not a campaign-unlock implementation.

`engineering-challenges.ts` derives up to four ≥50 m structures from the exact engineering profile. Each requested comparison replaces whole cubic sections spanning that structure plus approximately 200 m approaches. Positions, tangent directions and grades at the splice are fixed; prefix and suffix are unchanged. Bounds come from the reviewed live proposal, not a potentially coarser worker terrain classification. The whole result is certified and quoted on live terrain before purchase. When both route ends lie in scope, the UI identifies the comparison as full-route. If no alternative survives, the current plan remains available with an explicit explanation.

The initial comparison prefers a certified near-sketch proposal, then different engineering families before minor variations. Denser interior samples and multiple height smoothing levels make real ground-following alternatives possible. Inlet land and bridge solutions both commit at their exact price. Ridge options may retain tunnels or add bridges; no nonexistent climb/contour solution is presented. Wider searches and local proposals are still bounded to 300 m and eight seconds. No optimal-route guarantee is made.

The V3 seabed now bypasses the land-only minimum elevation clamp. Formerly the fjord could render/price as elevated dry ground. The submerged-water regression and updated seeded fingerprint record this deliberate pre-release correction. Save schema 9 is unchanged; exhaustive compatibility of previously built tracks across the formerly dry sea is not claimed.

173 core tests include all three actual-world practice factories, cost/ledger/connectivity/save checks, unique candidate IDs, and a local splice regression with nonzero grades and unchanged outer geometry. Eight focused browser scenarios cover construction, three drawing/keyboard/compact-view flows, the new inlet→ridge/archive flow, saved bridge/tunnel rendering and full passenger revenue/save. The final selection changes and worker boundary guard were rechecked in their affected flows. Screenshots: `docs/screenshots/construction-*.png`; capture command: `npx tsx tools/capture-construction-lessons.ts`.

Remaining before DRAW acceptance: retain/undo engineering choices across tool transitions; ordered corridor search; stronger obstacle-choice usability and layout/performance/accessibility evidence; an unassisted player review. Closing and reopening currently recomputes proposals from the retained sketch. A redraw or global wider search replaces the local comparison. No background model switch, deployment or completed campaign progression is implied.
