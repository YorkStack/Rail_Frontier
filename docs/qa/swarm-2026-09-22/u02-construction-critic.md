# U02 — construction and game-control critique

Simulated critical reviewer, not a real publication/person or enjoyment study. Worker reuse disclosure: this worker previously ran P09, A02 and U01 because of the thread limit. Prior menu/control familiarity carries over. This was a new fresh headless Chrome browser/context with no reused saves, German, 1440×900, default scale/DPR 1, frozen baseline `fb5f666` at `http://127.0.0.1:5190`. PROTOCOL/MATRIX instructions carried forward from the immediately preceding review. About five minutes, approximately 25 UI actions plus observations.

## Outcome and critical assessment

Hand-drew an inlet shore route, edited it into a costly bridge/tunnel alignment, used an obstacle marker to compare alternatives, inspected the terrain/profile cost breakdown, recovered the original route with undo, exercised camera pan/zoom/reframe, built the recovered route and saved/reloaded it. No P0/P1/P2 control defect observed in this journey. One P3 layout finding below.

Construction presents a useful separation between the dashed sketch and the colored buildable proposal. That distinction is stated beside the choices, and the visual response to dragging a point into water was obvious. Prices changed dramatically and meaningfully: the shore route was 432,212 NOK, moving one point into the water produced a 4,038,595 NOK mixed bridge/tunnel proposal, and the obstacle comparison offered a 3,362,044 NOK bridge alternative. Undo restored the original shore quote and build succeeded. This provides observable cause/effect and recovery; it is not evidence of a measured “fun” score.

The obstacle comparison correctly labels **whole-route total prices**, so a player should not mistake 3.36m NOK as just the bridge charge. The profile then separates ground and bridge spending. A subtle but valuable tradeoff was visible: the bridge-only alternative lengthened bridge from 1,508m to 1,718m yet reduced total cost by eliminating 577m of tunnels. Thus “shorter bridge” is not automatically “cheaper route.” The price comparison gave enough information to explain that choice.

Two editorial preferences, not classified as defects: “Bahnhofsbogen” is a technical-looking variant name with no inline explanation; and choosing a comparison alternative creates an undo step, so returning to the pre-edit shore route required two undo clicks. Both remained understandable through the updated geometry/price, and neither blocked the task. I did not duplicate U01's first route-framing finding.

## Actual sequence

1. From menu: Bauschule → 2 · Um die Bucht → Von: Südufer.
2. Drew along visible west shore using actual mouse down at (548,269), moving through (483,345), (418,440), (360,540), then mouseup. Clicked visible Ziel hier · Nordufer sign.
3. Quote: “1 · Bahnhofsbogen · Mit Brücke,” 432,212 NOK, 2.43km, 2.6% grade, 2m bridge, no tunnel. Colored smoothed route differed from the dashed sketch as described by the UI.
4. Dragged second visible handle from (483,345) to (630,360), into water. Quote became 4,038,595 NOK, 2.91km, 0.3% grade, 1,508m bridge, 577m tunnel. Two tunnel markers and one bridge marker appeared.
5. Clicked “Brücke · 1508 m · Lösungen prüfen.” Comparison offered keep-current plus three alternatives. Chose “2 · Mit Brücke,” 3,362,044 NOK, 676,550 NOK cheaper, 2.97km/1,718m bridge/0m tunnel. Clicked Verglichenen Abschnitt zeigen and opened Gelände & Bauwerke.
6. Profile displayed ground 1,253m/259,826 NOK and bridge 1,718m/3,102,219 NOK. Individual rounded rows sum 1 NOK above the separately rounded total; this is ordinary display rounding, not reported as an economic bug.
7. Click Rückgängig: returned to the 4,038,595 NOK current sketch before alternative selection. Click Rückgängig again: original shore route restored at 432,212 NOK, 2m bridge. Profile showed 429,917 NOK ground plus 2,295 NOK bridge, matching the total.
8. Right-drag camera from (750,450) to (900,510), wheel zoom −450, then Alles zeigen. Both stations and original draft were framed again; quote unchanged. The provided controls recovered camera orientation without game-state helpers.
9. Built for 432,212 NOK. “2 · Um die Bucht · Verbunden!” appeared with 8,899,637 NOK and the truthful note that these practice stops do not serve settlements. Save, browser reload, Weiterspielen restored the same completion card, paused day 1 and 8,899,637 NOK.

## U02-01 — P3: German expanded profile labels overflow at normal desktop size

**Classification:** confirmed layout polish issue, not blocked construction. German 1440×900/default scale, observed once after opening profile and recovering shore route.

**Reproduction:** follow inlet route planning, open Gelände & Bauwerke, scroll profile into view. The three metric columns show MAXIMALE STEIGUNG, MINIMALER RADIUS, HÖHENBEREICH.

**Expected:** labels fit or wrap within profile width without clipping the rightmost heading.

**Actual:** MAXIMALE STEIGUNG and MINIMALER RADIUS wrap, but HÖHENBEREICH runs out of the panel and clips at the right edge in the inspected screenshot. Its numeric range remains readable. All build controls remained usable.

**Evidence:** `artifacts/swarm/evidence/u02/recovered-profile.png`, opened and inspected. The clipping is visual; no source diagnosis or probe used.

**Recommendation/regression:** allow long localized metric labels to wrap or reduce label sizing/use a stacked metric layout. Include an expanded German route-profile screenshot assertion at 1440×900, checking no horizontal overflow and all labels readable.

## State, limits and cleanup

No source/test files read, no probe invoked, no state injection, no artificial event cancellation or camera helpers. UI balances only: after build and after reload both 8,899,637 NOK. Prebuild company balance was hidden by planner and not independently measured, so no claim of exact ledger-delta verification. All construction/selection prices were visible UI evidence. One actual route commit. No trains, service assignment, ridge/highland lesson or campaign progression tested in U02; prior P09 coverage must remain separate.

Inspected screenshots: `drawing-start.png`, `drawn-shore.png`, `obstacle-compare.png`, `recovered-profile.png`, `restored.png`, all under `artifacts/swarm/evidence/u02/`. Page-error listener returned `[]`; console/network errors not comprehensively instrumented.

Driver `artifacts/swarm/scripts/u02-driver.mjs` closed its context/browser via finally; output `CLOSED []`, process exited 0. No app/test/server edits, no delegation, no remaining U02 browser process. Coordinator-owned server untouched.
