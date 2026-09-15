# Readable controls and a playable first railway

Date: 2026-09-15. Status: **planning complete, implementation not started**. User requested planning with Astra and a pause before implementation with SOL. This plan and [the graphics rework](../art/GRAPHICS_REWORK_PLAN.md) supersede the previous assumption that only minor release polish remained. Runtime checkpoint: `031261f5942a8d234ab9e073e32027a8c87db803`. No code or gameplay behavior changed during this planning pass.

## Evidence and objective

The user cannot readily identify how to start, place a station or build track, and must zoom the browser to read menus. [Their station-placement screenshot](../art/graphics-review-baseline/station-placement-ui.png) shows a tiny side panel, an empty-looking location selector, a disabled purchase button and a click on a pale village path. The existing three-step text has not solved the problem.

Source audit:

- `src/ui/study.css` has text sizes from 6–10 px, fixed narrow panels and small controls. Larger display headings occupy space needed for the active task.
- `src/main.ts` exposes track, station, train purchase, route creation and assignment in separate forms. The Railway Office simultaneously presents purchases, consists, routes, electrification, upgrades, industries and finances.
- The station handler requires an existing ground-level rail node. Selecting a town or the middle of an unsplit edge does not satisfy this requirement. The current free-node selector is a useful fallback but does not explain the world interaction through visible targets.
- `src/rendering/fjord-renderer.ts` draws a tan village path separately from the rail graph. It looks enough like a track to invite the wrong click. The screenshot alone did not prove this; the renderer distinguishes the two.
- Route assignment can immediately put a train into its running phase. A tutorial must manage visible pause/resume and observe committed state, not assume a click is a completed task.
- Existing build/purchase/assignment handlers already enforce money, terrain, connectivity, platform length and traction. These rules remain authoritative.

Success: a new player can create a working two-town passenger service, see delivery and fares, save it and continue, using visible controls without external instructions. Target first success in roughly 8–12 minutes, to be measured in an unassisted user run; this is a design target, not a result or deadline. Rail Frontier remains a company-management game.

## Research and adaptation

Reviewed official manuals/support pages, not installed playthroughs. These sources inform interaction principles; no proprietary assets, layouts or copy will be reproduced.

| Reference | Documented pattern | Adaptation for Rail Frontier |
| --- | --- | --- |
| [Railroad Tycoon 3 manual](https://cdn.akamai.steamstatic.com/steam/apps/7610/manuals/manual_en.pdf), printed pp. 10–15, 37–39, 44–45 | Tutorial follows the construction/service sequence; placement feedback and station catchment; route stops selected in the map or list | One visible first-railway journey, location previews with reasons, direct map actions plus accessible named lists |
| [Train Sim World Training Center](https://support.dovetailgames.com/hc/en-us/articles/29343118933778-What-is-the-Training-Center) | Dedicated training and help accessible from the main/pause menu | Replayable short lessons; resume help without replacing the company or losing progress |
| [Train Simulator Classic official guide](https://store.steampowered.com/manual/24010), pp. 5–6 and 9–11 | Objective-based Academy chapters, onscreen prompts, map task focus and operational information | One task at a time, “Show location”, relevant next action and a route diagram |
| [Open Rails tutorials](https://www.openrails.org/learn/tutorials/) and [getting started](https://www.openrails.org/discover/get-started/) | Scenario-based practical instruction and a separate getting-started entry | Optional lessons for later machinery/operations; deeper reference help stays out of the first purchase flow |

Open Rails is used as the accessible source for that simulator family; an original Microsoft Train Simulator manual was not reviewed. Cab switches, firing controls and signal memorization are outside this management tutorial. Progressive disclosure and the specific unlock rules below are our design decisions, not claims about all reference games.

## UX-001 — Readable HUD and consistent controls

Scene: a player uses an ordinary desktop or laptop in daylight and repeatedly looks between a detailed landscape and nearby controls. Use sufficiently opaque evergreen-tinted panels with warm readable text, maintaining the existing identity while testing contrast against both bright Arizona and dark Norway. Gold identifies the active task and primary action; status also has an icon and words. The landscape supplies visual richness.

- Base body and action text 16 CSS px / 1 rem, supporting text at least 14 px, 12 px only for nonessential metadata. No essential instructions, totals, validation or control labels below 14 px. Headings approximately 20/24 px; decorative campaign title yields to the active task.
- Primary button/select hit targets at least 44×44 CSS px; use padded hit regions for smaller glyphs. Native form typography inherits the UI font. Standard sans-serif for controls and figures; serif limited to campaign titles.
- Persist UI size 100%, 125%, 150% in settings, accessible before starting. Scale rem typography/spacing with reflow, not a CSS transform of the entire app. Browser zoom remains independent; physical monitor DPI must not be guessed from viewport width.
- Task panel approximately 360–420 px on desktop at 100%, responsive to available width. At narrow widths use an accessible collapsible task sheet and a compact labelled toolbar. Keep primary action reachable by scrolling the panel; never shrink text to fit. At 200% browser zoom, use the compact layout.
- Show cash, date, pause/speed and the active task. Collapse the permanent marketing introduction during play. A single context panel replaces the existing panel rather than layering several windows.
- Main labels: **Gleise bauen**, **Bahnhof bauen**, **Züge**, **Linien**, **Unternehmen**, **Hilfe**. Camera functions occupy a distinct area with **Ort zeigen**, **Übersicht**, **Zug folgen**. Build controls remain named on compact layouts.
- Add German and English UI strings for the complete first-service path and its errors; start from browser language with a persistent choice in settings. Domain IDs remain language-independent. Do not leave a German tutorial pointing to differently named English buttons.
- Keyboard focus visible; all map tasks have named-list alternatives. Escape cancels the current draft/tool before opening pause. Clicking/dragging UI must not build or pan the map. Camera motion respects reduced motion and manual movement cancels automatic travel.

Acceptance: first-service and settings screens readable at native 1440×900 and approximately 2560×1360, at 100% and 150% UI scale, plus 200% browser zoom and 390×844 responsive layout. No hidden primary action, overlapping panel, focus loss or truncated cost. Text contrast target 4.5:1 and non-text controls 3:1, measured against the actual panel background. No claim of complete mobile gameplay support solely from a responsive screenshot.

## UX-002 — Build a connection from understandable map targets

The beginner action is **Städte verbinden**. Selecting Sundvik in the world, its label or the town list opens **Verbindung planen**. The helper asks for a destination and presents valid station-site candidates near the two towns, with name, coverage and terrain preview. A player chooses each site; these remain drafts until construction succeeds.

The first implementation uses a content-authored, certified first corridor with a small set of feasible alternatives, passed through the real planner at the current world version. It is not an unimplemented arbitrary terrain-routing solver. Show the proposed track, endpoints, distance and total estimated track plus station cost. Each commitment has its own explicit cost and confirmation: **Gleise bauen · NOK …**, then each **Bahnhof bauen · NOK …**. Reserve no money invisibly and never create fake graph nodes on town selection.

Keep **Frei planen** available: click start, click finish, review the line and cost, commit. A sticky one-line prompt says what the next click does. Backspace removes the last draft point; Escape cancels without expenditure. A future curved waypoint editor must reuse curvature/grade certificates and is a later extension, not a dependency for first success.

Map feedback:

- Built railway has rails/sleepers or its clear strategic line; draft railway is dashed with endpoint markers; village paths are textured ground features. A path never gets rail node affordances.
- In station mode show valid free endpoints with a station glyph and town name, minimum 44 px screen-space hit regions, world-anchored but zoom-independent. Overlapping targets become a chooser; do not silently choose the wrong endpoint.
- Snap a nearby click to a displayed target using screen distance, then revalidate its world position. Show a ghost station, track alignment, catchment and the exact served town from the same logic used by the command.
- Clicking a town with no usable railway opens **Hier fehlt noch ein Gleis. Verbindung planen**. With a valid nearby node, show the station preview directly. With an occupied station, open its context instead of offering a duplicate.
- Clicking the middle of an unsplit track highlights the nearest eligible endpoints and offers **Baupunkt zeigen**. If none fits the town, offer extending/planning track. Arbitrary mid-edge station insertion is explicitly later work: safe splitting must remap routes, motion, reservations, electrification and historical costs atomically. Do not bypass these contracts for a convenient click.
- The location list has named candidates with distance and service area, not raw node IDs. When no candidate exists, replace the empty selector and irrelevant station-class fields with the actionable explanation and **Gleise bauen**.
- Report errors at the preview with the next useful action: **Zu weit von Sundvik entfernt → Standort zeigen**, **Zu steil → flachere Variante zeigen**, **Nicht genug Geld → Kosten ansehen**. Terrain invalidity must remain visible without relying on red alone.

Acceptance: reproduce the user's town/path clicks from an empty company and always reach a useful next action. Place both stations with map clicks and, separately, list/keyboard controls. Wrong paths cannot become purchased stations. Current-world funds, coverage and ground rules are rechecked at commit. Drafts survive panel resizing but cannot leak across company replacement.

## UX-003 — Locomotive, wagons and service in one understandable flow

**Zug zusammenstellen** opens from a station or the empty train list. Display a horizontal consist: locomotive silhouette/thumbnail, coach, **+ Wagen**. Clicking a component opens its relevant choices; keyboard Add/Remove/Move controls make drag-and-drop optional. Beginner recommendation: the available 1900 steam locomotive plus two compatible passenger coaches, subject to both platforms and current budget. Use actual data; fewer coaches if required, with a clear reason.

Before purchase show seats, included mail capacity, train length versus the shortest selected platform, purchase cost and an honestly labelled operating-cost estimate. Costs depending on distance/time must not be presented as guaranteed daily totals. Explain cargo support in ordinary terms. No locomotive-selector list of unavailable later eras on first use.

Then choose the ordered stops on the map or named station list. Show **Sundvik → Granli → Sundvik**, described as **Pendelt automatisch hin und zurück**. The underlying shuttle route stores each stop once. Lines and physical track receive different names throughout the UI: **Gleise** are infrastructure; **Linie** is the service's stopping order.

Offer **Zug kaufen**, then **Linie anlegen**, then **Fahrt starten** inside the same contextual sequence, keeping the current result visible. Reuse `purchaseTrain`, `createRoute`, `assignRoute`; record returned IDs and prevent repeat submission. If assignment fails, retain the already purchased train/created line and offer repair. Never silently purchase another train or promise rollback of earlier committed commands. A combined all-or-nothing service command would require a separate domain change; it is not assumed here.

After launch, show **Fährt nach Granli**, next stop, passengers aboard and **Zug folgen**. Explain waiting for demand, dwell and track reservations with specific states. The financial display distinguishes first fares from operating profit and construction spending. Reordering a new draft is supported; recoupling an already purchased consist at runtime is a later feature, clearly labelled as unavailable until implemented.

Acceptance: buy/configure the first train without opening finance, electrification or industry panels. Overlong consist, disconnected stops, insufficient funds and electric-unpowered track each explain the reason before and after stale-state rejection. No double purchase on double-click, retry or tutorial resume.

## UX-004 — “Deine erste Bahn” hands-on tutorial

Launch menu: **Weiterspielen** when a company exists; **Neue Gesellschaft** with recommended **Mit Einführung**; separate **Freies Spiel**. **Einführung wiederholen** starts a clearly named separate practice company, preserving the current company. No automatic overwrite or loss of an existing slot. Learning in a new company leaves a real, playable company after graduation; it is not a disposable fake simulation.

Use Norway's actual first corridor and production commands. Add a version-keyed tutorial descriptor for settlement IDs, candidate sites and valid route geometry. Certify price, capacity, distinct town coverage, departure, delivery and travel time before enabling the lesson for a world version. Revalidate it for Norway V3 in the graphics work. Do not replace 16 km world distances with a visual scale trick.

| Step | What the player does | Completion evidence |
| --- | --- | --- |
| 1. Sundvik kennenlernen | Focus the town and choose “Städte verbinden” | Correct town selection and an active connection draft |
| 2. Strecke planen | Choose Granli and the marked sites, inspect the quote, build track | Successful construction command and a connected path between the chosen nodes |
| 3. Bahnhöfe bauen | Preview catchment, build Sundvik, then Granli | Two distinct authoritative stations covering the intended distinct towns |
| 4. Zug zusammenstellen | Select the locomotive and add passenger coaches, inspect length/cost, buy | The recorded successful purchase contains the selected compatible consist |
| 5. Linie festlegen | Choose the two stations in order, create the shuttle, assign the train | The selected train references the intended valid route |
| 6. Erste Fahrt | Resume, follow the train; optionally choose 4×/8× | Actual departure, passenger delivery and fare ledger entry after lesson baseline |
| 7. Weiterbauen | Save, examine first operating income/cost, choose next goal | Save success reported separately; guidance graduates after service success |

One compact coaching panel shows the current action, e.g. **Schritt 3 von 7 · Baue den Bahnhof in Sundvik**, plus one short instruction, **Ort zeigen**, **Hinweis**, **Einführung beenden**. The player performs the real action; “Weiter” cannot substitute for construction/purchase/delivery. Completion acknowledgement may advance narrative only after the evidence is true. Short text, no tutorial wall or obligatory introductory video.

Pause during first construction/purchase learning and say so visibly. **Fahrt starten** explains/resumes time; optional faster simulation is explicit and reversible. Never silently change the player's normal speed after finishing. If no passengers are ready, display the next demand update and **Zeit schneller laufen lassen**. Tune the lesson for a short wait using normal demand rules and feasible corridor choice; do not inject secret revenue or bypass motion. If the budget cannot fund the recommended full service plus reasonable operating reserve, revise the explicit new-company starting balance or the corridor, with a content-version decision. No hidden bailout, altered price or endless free refunds.

Technical design:

- New `src/ui/tutorial.ts` implements a versioned reducer over immutable snapshots and successful command results; view state is separate from simulation authority. Extract controller modules from `src/main.ts` so tutorial, build and service UI share actions instead of duplicating handlers.
- Persist a small optional `learning` record in a versioned save: lesson ID/version, completed stages, bound created entity IDs and initial delivery/ledger baseline. Use the next unused save schema (6 is current; therefore 7 if unchanged at implementation). Migration defaults to no active lesson for older saves. Strictly validate fields and cap collections; never replay saved command payloads.
- Presentation settings (language, UI scale, “hide guidance”) live in the user settings store. They cannot rewrite ownership, year, unlocks or finances. Failed settings writes keep controls usable.
- On resume validate bound IDs and current prerequisites. Existing builds can satisfy eligible steps; historical unrelated deliveries cannot complete a fresh lesson. Do not assume raw ID equality between different companies. Imports, continue, new company and renderer replacement clear old transient highlights/subscriptions.
- Save before lesson suspension through existing archive behavior; browser-storage failure shows a retry/export path. A failed save cannot falsely tick “saved”. Avoid rewards entirely in the first tutorial to remove double-payout risk.
- Skipping preserves every built asset and expense and returns to normal play immediately. Help can resume from the first unsatisfied prerequisite. No forced restart because a player selected a different valid route or voluntarily exited guidance.

## UX-005 — Growing complexity, distinct from historical technology

Beginner mode reveals the tools needed now. **Alle Werkzeuge anzeigen** is always available; mastery hints never remove capabilities from an existing company. Progress depends on achieved gameplay, not merely elapsed time, repeated clicks or reading a tooltip.

| Stage | Newly emphasized capability | Trigger / rule |
| --- | --- | --- |
| First railway | One suggested station class, available steam engine, coaches, two-stop shuttle | New empty Norway company |
| First passengers delivered | Station upgrades, capacity comparison, a second service and simple operating report | Real first passenger delivery |
| Passenger service established | Guided timber → sawmill delivery and freight consist | Passenger delivery completed; optional lesson invitation |
| Network grows | Multi-stop/loop editing, traffic overlay and reservation explanation | Player adds a third station or second train, or explicitly opens advanced tools |
| Later eras | Diesel/electric catalogue and electrification instruction | Authoritative year/content availability and actual infrastructure rules |

Station classes, capacity, affordability and historical engines remain genuine gameplay constraints. Guidance unlocks do not grant money, change the campaign year, bypass wires, or disable previously owned systems. A 1996 imported company must retain its eligible electric trains even if this browser never completed the tutorial. Freight, finance and advanced route management remain directly reachable by an experienced player.

Optional follow-on lessons: first timber service; improve a crowded station; understand a waiting train; electrify a route when an appropriate engine becomes available. Each has its own actual outcome and can be dismissed. Full signalling/manual train driving and new research trees are outside this pass.

## Delivery order and validation

| Checkpoint | Work | Exit gate |
| --- | --- | --- |
| UX-001 | Readable HUD, sizes, settings, vocabulary and DE/EN first-service copy | Native-size and zoom screenshots, keyboard/focus/contrast checks |
| UX-002 | Contextual town-to-track flow and real station targets | Empty-network path/town-click reproduction and successful purchases |
| UX-003 | Consist and service sequence | First service plus failure/retry paths with exactly-once purchases |
| UX-004 | Stateful hands-on lesson and save migration | Whole lesson, interrupt/reload/import/skip/storage failure journeys |
| UX-005 | Progressive disclosure and follow-on hooks | Beginner and advanced/old-save access with unchanged technology rules |
| UX-006 | Integrated acceptance | Independent cold-start walkthrough and full application regression |

Integration sequence with art: **GFX-R01 roofs → GFX-R02 entry cameras → UX-001–003 → GFX-R03–07 → UX-004–005 → GFX-R08–09 + UX-006**. This makes the existing game readable early, then certifies the final tutorial against the new authoritative terrain before art/UX acceptance. Further campaign economy expansion waits for this pass. The existing runtime has none of these new UX checkpoints completed.

Tests: focused reducer/command evidence and migration tests; browser journey from menu through track, both stations, consist, line, departure, delivered passengers/fares, save/reload/resume. Cover tutorial skip, replay in a separate company, accidental double click, rejected stale quote, no free rail point, wrong village path, platform mismatch, no demand yet, 1996 save and full-tools opt-out. Assert meaningful outcomes rather than hardcoded tooltip sequences. Retain all existing economy, dispatch and old-save regressions.

Manual acceptance must be separate from automation: a person unfamiliar with this UI attempts the first railway without external coaching. Record time to first track/station/departure/revenue, hesitations and recovery. Target no required browser zoom and no unexplained dead end. If no independent tester is available, report that gate as pending; an automated guided run is not evidence of intuitiveness. Continue useful engineering without marking this product gate passed.

Capture actual final UI at the specified viewports, include before/after for the user's station screenshot, and update README with accurate implemented instructions. Commit and push completed checkpoints to both `implementation/passenger-slice` and `main`, verify hashes, and update `CURRENT_STATUS.md`. Pause now for the user's SOL switch; no implementation is authorized during this planning turn.
