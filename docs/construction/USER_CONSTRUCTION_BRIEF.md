# RAIL FRONTIER – STATION & TRACK CONSTRUCTION SYSTEM

You are working on the existing **Rail Frontier** project.

Project context:

* Local project directory: `/Users/yorkvonloew/Documents/Codex/Rail Frontier`
* Git repository: `https://github.com/YorkStack/Rail_Frontier`
* Current license: MIT
* Rail Frontier is a web-based railway tycoon / railway management simulation.
* The development Mac has **Blender installed locally**. Blender may be used where appropriate for creation or processing of railway assets, bridges, tunnel portals, station elements, terrain-compatible structures or other graphical assets.
* Astra should be used for architecture, system design, UX/gameplay design and difficult conceptual decisions where it provides added value.
* Once architecture, UX and algorithms are sufficiently defined and the remaining work is primarily implementation, stop and clearly tell me:

`ARCHITECTURE/DESIGN COMPLETE – SAFE TO SWITCH TO SOL FOR IMPLEMENTATION`

Do not waste Astra tokens on routine implementation once the design problem has been solved.

---

# 1. CURRENT PROBLEM

The current game entry is not sufficiently clear.

A new player currently does not intuitively understand:

* what to do first,
* where to start building,
* how to build a station,
* how to start a railway line from that station,
* how to route track across the landscape,
* what happens when mountains, valleys, rivers or fjords are encountered,
* whether bridges and tunnels need to be built manually,
* how much the planned line will cost,
* whether the line is technically usable,
* what should happen after the first route has been completed.

This must be solved as a coherent gameplay system.

Do **not** treat this task merely as a visual track-placement tool.

Design and implement the complete player experience:

**Start Game → Choose Location → Build First Station → Plan First Railway → Resolve Engineering Challenges → Confirm Construction → Build Track → Connect Second Station → Route Ready for Train Operations**

The interaction must feel intuitive enough that a player can understand the basic process without reading a manual.

Rail Frontier should have the accessibility of a modern tycoon game while retaining enough engineering realism to make railway construction strategically interesting.

---

# 2. FIRST: AUDIT THE EXISTING PROJECT

Before changing code:

1. Inspect the entire relevant repository structure.
2. Understand:

   * rendering engine,
   * terrain implementation,
   * camera controls,
   * world coordinate system,
   * game-state architecture,
   * economy,
   * UI framework,
   * current station implementation,
   * current track implementation,
   * current save-game format,
   * existing railway / train data models,
   * pathfinding,
   * terrain height sampling,
   * existing asset pipeline.
3. Locate all existing code related to:

   * stations,
   * railways,
   * routes,
   * terrain,
   * construction,
   * economy,
   * camera,
   * player input.
4. Determine what can be reused.
5. Do not create parallel systems where a suitable abstraction already exists.
6. Do not break existing save games without an explicit migration strategy.

Document the relevant findings before making architectural changes.

---

# 3. CORE DESIGN PHILOSOPHY

Rail Frontier should **not** use a Train Simulator Classic-style track editor where the player manually lays hundreds of individual track pieces.

It should instead use a modern railway alignment planning system.

The player specifies:

* starting point,
* destination,
* optional waypoints,
* desired route characteristics.

The game calculates a realistic railway alignment between these constraints.

Internally the railway should be represented as a continuous spline-based network.

The player should feel like a railway company planning infrastructure, not like a CAD operator placing rail segments.

---

# 4. PRIMARY GAMEPLAY LOOP

The basic railway construction workflow must be:

## STEP 1 – Build or select a station

The player chooses:

`BUILD → STATION`

The game enters Station Placement Mode.

A semi-transparent station preview follows the terrain under the mouse pointer.

The UI must immediately show:

* station type,
* construction cost,
* approximate catchment area,
* terrain suitability,
* nearby city / industry / settlement,
* available orientation,
* track approach direction,
* warnings.

Valid location:

Green / positive visual feedback.

Problematic location:

Yellow / warning visual feedback.

Invalid location:

Red / construction prohibited.

The player clicks once to position the station and can rotate it before confirmation.

Only after confirmation is the station constructed and money deducted.

---

# 5. FIRST STATION ONBOARDING

For a new game, if the player owns no railway infrastructure, show a subtle contextual objective:

**Build your first station**

After successful placement:

**Connect your station to another city, industry or settlement.**

The station should visibly expose logical railway connection points.

Do not force the player to guess where track can be attached.

Possible UX:

Station

```
       TRACK CONNECTION
              ↓

===============================
|                             |
|          STATION            |
|                             |
===============================
              ↑
       TRACK CONNECTION
```

Connection handles should only appear while the relevant construction tool is active.

---

# 6. STARTING TRACK CONSTRUCTION

The player chooses:

`BUILD → RAILWAY`

or clicks a station connection handle.

If railway construction was started from the station handle, automatically use that point as the first route anchor.

The player then moves the mouse across the terrain.

A **ghost railway alignment** must be generated continuously.

Nothing has been built yet.

No money has been spent yet.

Terrain has not yet been modified.

The railway exists in:

`PLANNING STATE`

---

# 7. TRACK PLANNING MOUSE CONTROLS

Implement an intuitive interaction model.

## Left mouse button

Single click:

Place an intermediate route waypoint.

Example:

```
Station A
   ●
    \
     \
      ● Waypoint
        \
         \
          ● Waypoint
            \
             Station B
```

## Mouse move

Continuously recompute the provisional alignment between the last fixed waypoint and current pointer position.

## Left click on compatible station / track

Finish provisional route.

## Right mouse button

Remove the last waypoint.

If no waypoint remains:

Cancel track planning.

## ESC

Cancel the entire current planning operation.

## Double click

Optionally finish route at current valid location where appropriate.

## Drag existing planning waypoint

Allow route refinement before construction.

The player must be able to move a waypoint and see the entire affected route update in real time.

---

# 8. PLANNING VS CONSTRUCTION

This separation is mandatory.

Track must have at least the following conceptual states:

```text
PLANNED
APPROVED
UNDER_CONSTRUCTION
OPERATIONAL
```

Initially, the player creates only a plan.

During planning:

* no permanent terrain deformation,
* no permanent bridge,
* no tunnel construction,
* no economic transaction,
* no irreversible world modification.

The plan is rendered as a ghost / blueprint.

The player confirms with:

`BUILD ROUTE`

Only then:

* validate finances,
* deduct or commit construction cost,
* instantiate infrastructure,
* modify terrain,
* generate structures,
* connect railway graph nodes.

---

# 9. HORIZONTAL RAILWAY ALIGNMENT

Do not generate track by connecting waypoint coordinates with sharp straight-line corners.

Generate a continuous railway alignment.

The underlying model should separate:

1. horizontal geometry,
2. vertical geometry.

For horizontal geometry use an implementation appropriate for the current web rendering technology.

Preferred conceptual model:

```text
Route Anchors
      ↓
Tangent estimation
      ↓
Spline / curve generation
      ↓
Curvature constraint
      ↓
Minimum-radius validation
      ↓
Rendered track centerline
```

A practical implementation can use:

* cubic Hermite curves,
* cubic Bézier sections,
* Catmull-Rom converted into constrained curve segments,

provided curvature can be evaluated and controlled.

Do not blindly use Catmull-Rom if it causes unrealistic railway curvature.

The architecture should allow later replacement by true railway transition curves / clothoids.

---

# 10. MINIMUM CURVE RADIUS

Each track type must define engineering parameters.

Example data model:

```ts
TrackClass {
    id
    name

    maxSpeed
    maxGradient
    preferredGradient

    minimumCurveRadius
    preferredCurveRadius

    trackSpacing
    electrificationSupport

    constructionCostPerMeter
}
```

Example conceptual values:

Local / mountain railway:

* maximum speed: 80 km/h
* minimum radius: ~180–250 m

Standard railway:

* maximum speed: 120–160 km/h
* minimum radius: ~400–700 m

High-speed railway:

* maximum speed: 200+ km/h
* minimum radius: significantly larger

Exact balancing values may later be adjusted.

The important requirement is:

**Track geometry must influence railway performance and cost.**

---

# 11. VERTICAL ALIGNMENT

Vertical track geometry must not simply copy terrain height.

This is critical.

Sample terrain along the planned horizontal alignment.

For example:

```text
every 2–10 meters depending on world scale
```

Generate:

```text
distance → terrain elevation
```

Then generate a railway vertical profile respecting:

* maximum gradient,
* preferred gradient,
* vertical curve smoothness,
* structure requirements.

The railway should create a smoother profile than the natural terrain.

Example:

Terrain:

```text
           /\          /\
__________/  \________/  \_____
```

Railway:

```text
___________-------______________
```

This difference drives:

* cuttings,
* embankments,
* bridges,
* tunnels.

---

# 12. GRADIENT

For each sampled section calculate:

```text
gradient =
elevationDifference /
horizontalDistance
```

Display it in percent.

Example:

`1.4 %`

The planned route should visually identify difficult gradients.

Suggested visualization:

* normal = acceptable,
* warning = near limit,
* invalid = above track-class limit.

Never allow a constructed track to silently violate its engineering limits.

---

# 13. TERRAIN DIFFERENCE ANALYSIS

At regular intervals calculate:

```text
deltaHeight =
railwayElevation -
terrainElevation
```

Use this to classify construction.

Conceptual initial thresholds:

```text
approximately -2 m to +2 m
→ normal ground track

positive moderate difference
→ embankment

large positive difference
→ bridge candidate

negative moderate difference
→ cutting

large negative difference
→ tunnel candidate
```

Do not hard-code these numbers across the entire codebase.

Store engineering thresholds in configurable parameters.

Example:

```ts
EngineeringRules {
    groundTolerance
    maxEconomicEmbankmentHeight
    maxEconomicCuttingDepth
    bridgeTriggerHeight
    tunnelTriggerDepth
    minimumBridgeLength
    minimumTunnelLength
}
```

---

# 14. STRUCTURE CLASSIFICATION

Track segments should support at minimum:

```text
GROUND
EMBANKMENT
CUTTING
BRIDGE
TUNNEL
STATION
```

Potential future extensions:

```text
VIADUCT
CULVERT
RETAINING_WALL
CAUSEWAY
SNOW_SHED
```

The architecture should support them without rewriting the entire track system.

---

# 15. AUTOMATIC BRIDGE DETECTION

If the planned railway crosses:

* deep valley,
* river,
* fjord,
* road,
* another railway,
* terrain substantially below railway elevation,

evaluate a bridge.

Example:

```text
Railway
=============================
        |             |
        |             |
       /               \
______/                 \______
```

The preview should automatically insert a bridge structure.

The player should immediately see:

`Bridge – 486 m`

and its approximate cost.

Do not interrupt the player with a dialog for every minor bridge.

---

# 16. AUTOMATIC TUNNEL DETECTION

If the planned railway passes substantially below terrain for a sustained distance, evaluate a tunnel.

Example:

```text
Terrain

        █████████████
      █████████████████
____████████████████████____

Track

------>|=============|>------
        tunnel
```

Determine:

* tunnel entrance,
* tunnel exit,
* length,
* maximum overburden,
* cost.

Generate visible tunnel portals.

Terrain above a tunnel must remain visually intact.

Do not carve an open trench through an entire mountain and cover it visually with a tunnel texture.

Tunnel geometry and terrain representation must be technically coherent.

---

# 17. IMPORTANT: PLAYER DECISION VS AUTOMATION

Do not ask the player what to do for every terrain feature.

The system should automatically make sensible engineering choices.

However, strategically significant decisions should be editable.

When a major obstacle is encountered, allow the selected segment to offer alternatives such as:

```text
ENGINEERING OPTIONS

Recommended:
Tunnel – 2.4 km
€38.2 M
Gradient 1.2 %
Maximum speed 140 km/h

Alternative:
Mountain alignment – 5.8 km
€21.4 M
Gradient 2.4 %
Maximum speed 80 km/h

Alternative:
Deep cutting + short tunnel
€27.8 M
Gradient 1.8 %
Maximum speed 110 km/h
```

The first implementation does not necessarily require generation of all alternatives.

But architecture must allow future multi-option route evaluation.

---

# 18. ROUTE PLANNING MODES

Provide a small route-planning preference control.

At minimum:

### BALANCED

Reasonable compromise.

### LOW COST

Prefer:

* terrain following,
* shorter bridges,
* fewer tunnels,
* tolerate somewhat higher gradients,
* tolerate tighter curves.

### FAST

Prefer:

* low gradient,
* larger curve radius,
* bridges and tunnels where beneficial,
* higher construction cost.

### MANUAL / CUSTOM

Expose additional parameters later.

Do not overwhelm beginners.

Default:

`BALANCED`

---

# 19. ROUTE OPTIMIZATION

For automatic routing between two distant anchors, do not simply generate a straight spline through the terrain.

Design a corridor-routing system.

Possible architecture:

```text
Start Anchor
      ↓
Terrain / obstacle cost map
      ↓
Coarse route search
      ↓
Candidate corridor
      ↓
Spline fitting
      ↓
Horizontal validation
      ↓
Vertical profile optimization
      ↓
Bridge/tunnel analysis
      ↓
Cost calculation
      ↓
Final proposed alignment
```

A* or similar graph search may be used on a coarse terrain grid.

The search cost must not just be physical distance.

Suggested cost function:

```text
routeScore =
distanceCost
+ gradientPenalty
+ curvaturePenalty
+ earthworkCost
+ bridgeCost
+ tunnelCost
+ waterPenalty
+ protectedAreaPenalty
+ demolitionPenalty
```

The architecture should make weights configurable.

Different route modes change these weights.

Example:

LOW COST:

```text
high tunnel penalty
high bridge penalty
moderate gradient penalty
```

FAST:

```text
high gradient penalty
high curvature penalty
lower tunnel penalty
lower bridge penalty
```

---

# 20. REAL-TIME ROUTE PREVIEW

While moving a waypoint, update the route preview.

Target responsiveness should make route planning feel interactive.

Do not recompute an unnecessarily expensive full-resolution engineering model on every mouse event.

Use staged calculations.

For example:

### While pointer moves

Fast approximation.

### After pointer pauses briefly

Improved alignment calculation.

### After waypoint placement

Full engineering evaluation.

### Before Build

Final deterministic validation.

Use worker threads / Web Workers if this fits the current architecture and prevents main-thread rendering stalls.

---

# 21. TRACK PREVIEW VISUALIZATION

The provisional alignment must communicate what is happening.

Recommended visual language:

Normal track:

```text
────────────
```

Bridge:

```text
══════╦══════
      ║
```

Tunnel:

```text
----->|=====|>-----
```

Cutting / embankment:

Visually distinguish through terrain overlay, side walls or planning visualization.

During planning show:

* centerline,
* waypoints,
* start/end handles,
* bridge sections,
* tunnel sections,
* warnings,
* invalid sections.

Avoid clutter.

---

# 22. ENGINEERING OVERLAY

Provide an optional engineering overlay during track planning.

When active it should show useful information such as:

```text
ROUTE PLAN

Length                 18.7 km
Track                  Single
Design speed           120 km/h

Maximum gradient       1.8 %
Minimum curve radius   520 m

Ground track           11.2 km
Embankment              2.1 km
Cutting                 2.7 km
Bridges                 1.1 km
Tunnels                 1.6 km

Bridges                   4
Tunnels                   2

Estimated cost        €148.6 M
```

This should update when the player modifies the alignment.

---

# 23. ROUTE PROFILE VIEW

Design an optional small longitudinal profile display.

Example:

```text
Elevation

500m |                  /\ TERRAIN
400m |        /\       /  \
300m |_______/  \_____/    \_______
200m |--------RAILWAY---------------
     +------------------------------→ distance
```

This would be particularly valuable in mountainous maps such as the Norwegian fjord scenario.

It does not need to be intrusive.

Could be opened through:

`Route Details`

or

`Engineering`

---

# 24. COST MODEL

Construction cost must be derived from infrastructure rather than arbitrary route price.

Use separate cost components.

Conceptually:

```text
totalCost =
trackCost
+ earthworksCost
+ bridgeCost
+ tunnelCost
+ stationConnectionCost
+ electrificationCost
+ signallingCost
+ terrainModificationCost
```

Initial simplified model is acceptable.

Example:

```ts
trackCost =
groundTrackLength *
trackClass.costPerMeter

bridgeCost =
bridgeLength *
bridgeType.costPerMeter

tunnelCost =
tunnelLength *
tunnelType.costPerMeter

cuttingCost =
excavationVolume *
costPerCubicMeter

embankmentCost =
fillVolume *
costPerCubicMeter
```

The architecture must allow more sophisticated economics later.

---

# 25. COST MUST CREATE GAMEPLAY TRADE-OFFS

Two routes between the same locations must potentially produce very different outcomes.

Example:

## Route A – Mountain railway

```text
Length             28 km
Max gradient       2.8 %
Min radius         240 m
Max speed           80 km/h
Cost                €72 M
```

## Route B – Main line

```text
Length             22 km
Max gradient       1.2 %
Min radius         700 m
Bridges             4
Tunnels             3
Max speed          160 km/h
Cost               €184 M
```

The cheaper route should not always be the strategically best route.

Track geometry must later affect:

* train speed,
* locomotive power requirement,
* travel time,
* capacity,
* operating cost.

---

# 26. STATION CONSTRUCTION SYSTEM

Stations are not decorative buildings.

They are railway network nodes.

Create a proper station model.

Conceptually:

```ts
Station {
    id
    name

    position
    orientation

    stationType

    platforms
    tracks

    connectionPoints[]

    catchmentArea

    cargoCapabilities[]
    passengerCapabilities[]

    constructionState

    connectedTrackEdges[]
}
```

Initially support a manageable station set, for example:

```text
Small Station
Medium Station
Large Station
Freight Terminal
```

Do not implement unnecessary complexity before core gameplay works.

---

# 27. STATION CONNECTIONS

Tracks should connect to defined station rail interfaces.

A player should not need pixel-perfect track placement.

When the provisional railway approaches a compatible station entry:

* detect it,
* visually highlight it,
* snap the route to the connection,
* align orientation smoothly,
* validate curvature before the station throat.

The result must look intentionally engineered.

---

# 28. CONNECTION TO EXISTING TRACK

The same snapping logic should eventually support connecting into an existing railway.

Conceptually:

```text
existing track
======================

             new track
                /
               /
==============●=========
             junction
```

When appropriate:

Create a junction node.

Railway graph architecture should support this from the beginning even if advanced junction editing comes later.

---

# 29. RAILWAY NETWORK DATA MODEL

Do not store the railway only as rendered meshes.

Maintain a semantic railway graph.

Example:

```ts
RailNetwork
  Nodes
    StationNode
    JunctionNode
    BufferStopNode
    PortalNode

  Edges
    TrackEdge
```

TrackEdge example:

```ts
TrackEdge {
    id

    startNodeId
    endNodeId

    alignment

    horizontalGeometry
    verticalProfile

    length

    trackClass
    trackCount

    electrification

    maxSpeed

    maximumGradient
    minimumCurveRadius

    structures[]

    constructionState

    operatingState
}
```

Structures:

```ts
TrackStructure {
    type

    startDistance
    endDistance

    length

    constructionCost

    metadata
}
```

---

# 30. SPLINE AND MESH SEPARATION

Separate railway geometry from graphical representation.

Architecture:

```text
Railway Alignment Model
          ↓
Sampled Centerline
          ↓
Track Mesh Generator
          ↓
Rails / Sleepers / Ballast
```

Bridges:

```text
Bridge Structure
      ↓
Bridge Mesh Generator
```

Tunnels:

```text
Tunnel Structure
      ↓
Portal Generator
      ↓
Tunnel Mesh
```

This prevents gameplay logic from depending on rendered polygons.

---

# 31. TERRAIN MODIFICATION

Ground track may require terrain preparation.

Support conceptually:

* flattening under track,
* cut,
* fill,
* embankment.

Do not mutate the base terrain during route preview.

Create reversible terrain modifications only after construction is confirmed.

Maintain enough metadata that save/load can reproduce them deterministically.

---

# 32. WATER AND FJORDS

Rail Frontier explicitly includes dramatic landscapes such as Norwegian fjords.

Therefore water crossing logic must be treated as a first-class problem.

Track should never simply sit on top of water.

Possible valid results:

* bridge,
* causeway where appropriate,
* tunnel under terrain/water where technically allowed,
* route around water.

Crossing a fjord should potentially become one of the major economic decisions of a route.

---

# 33. NORWEGIAN MOUNTAIN MAP AS STRESS TEST

Use the Norwegian fjord environment as a primary technical test case.

Create tests for:

1. railway along relatively flat valley,
2. crossing a river,
3. crossing a deep valley,
4. route along steep mountainside,
5. route through a mountain,
6. route around mountain,
7. crossing a fjord,
8. railway descending towards coastal settlement,
9. multiple tunnels and bridges in succession.

The construction system must remain visually coherent in all cases.

---

# 34. PLAYER FEEDBACK

At the cursor or construction UI show relevant information without covering the screen.

Example:

```text
18.4 km
€142.7 M

Max gradient 1.7 %
Min radius 580 m

2 tunnels
4 bridges

VALID ROUTE
```

Problem case:

```text
INVALID ROUTE

Gradient 4.8 %
Maximum allowed 2.5 %

Add a waypoint or select
Mountain Railway track class.
```

The player must understand *why* construction is impossible.

Never just disable the Build button without explanation.

---

# 35. BUILD CONFIRMATION

When the route is valid and terminates at a meaningful network connection, enable:

`BUILD ROUTE`

Before confirmation show concise summary.

Example:

```text
Bergen South – Fjordvik

Length               24.8 km
Stations                 2
Bridges                  6
Tunnels                  3

Track                  14.6 km
Bridge                  3.1 km
Tunnel                  7.1 km

Estimated cost        €218 M

[Cancel]      [Build Route]
```

---

# 36. CONSTRUCTION ANIMATION / VISUALIZATION

Do not require a sophisticated construction simulator initially.

However infrastructure should not necessarily materialize as one instantaneous visual pop.

Design an architecture that can support:

```text
PLANNING
↓
APPROVED
↓
EARTHWORKS
↓
STRUCTURES
↓
TRACK LAYING
↓
SIGNALLING
↓
OPEN
```

For the initial implementation construction may happen faster or immediately after confirmation if required.

But data model and state machine should not block future staged construction.

---

# 37. GAME ENTRY AFTER FIRST ROUTE

Once the player has connected two meaningful locations, make the next step clear.

Suggested onboarding sequence:

```text
1. Build your first station
✓

2. Connect another location
✓

3. Build or connect the destination station
✓

4. Purchase a locomotive
→

5. Create a service
→

6. Start railway operations
```

This task should integrate sufficiently with the current game onboarding so the player always understands what to do next.

If locomotive / route-service gameplay already exists, reuse it.

Do not create duplicate systems.

---

# 38. UI ARCHITECTURE

Suggested build menu:

```text
BUILD

Railway
Station
Depot
Bridge     [advanced / optional]
Tunnel     [advanced / optional]
Infrastructure
```

For the first implementation, bridges and tunnels should normally be generated automatically from railway planning.

They do not need to be separate first-class construction tools for beginner gameplay.

---

# 39. CONSTRUCTION TOOL STATE MACHINE

Create an explicit tool-state system rather than scattered booleans.

Conceptually:

```ts
ConstructionToolState =
    Idle
    StationPlacement
    TrackSelectStart
    TrackPlanning
    TrackWaypointEditing
    TrackEngineeringReview
    TrackConfirmation
```

Events may include:

```ts
PointerMove
PointerClick
PointerRightClick
Escape
SelectStationHandle
AddWaypoint
RemoveWaypoint
MoveWaypoint
FinishRoute
ConfirmBuild
CancelBuild
```

Centralize transitions.

Avoid UI logic accidentally becoming construction business logic.

---

# 40. UNDO / CANCEL

Planning actions should be non-destructive.

At minimum:

* right click removes latest waypoint,
* ESC cancels operation,
* waypoints can be moved,
* route can be restarted.

Eventually support Undo/Redo.

Architecture should not make this unnecessarily difficult.

---

# 41. PERFORMANCE

The planning system must remain interactive.

Avoid:

* regenerating every sleeper on every mouse movement,
* rebuilding expensive terrain meshes every frame,
* synchronous high-resolution pathfinding on the UI thread.

Use simplified preview geometry during planning.

Generate final detailed track only after construction confirmation.

Potential strategy:

```text
Interactive Preview
5–20 m sampling

Final Geometry
1–5 m sampling or adaptive sampling
```

Use adaptive sampling around:

* curves,
* gradient transitions,
* portals,
* bridge endpoints,
* junctions.

---

# 42. SAVE GAME

All constructed railway infrastructure must be serializable.

Do not rely on saving generated mesh vertices.

Save semantic construction parameters.

Example:

```json
{
  "trackEdge": {
    "startNode": "...",
    "endNode": "...",
    "anchors": [],
    "horizontalAlignment": {},
    "verticalProfile": {},
    "trackClass": "...",
    "structures": []
  }
}
```

Recreate meshes deterministically when loading.

Version the save schema where necessary.

---

# 43. DEBUG TOOLS

Add developer/debug overlays.

Useful debug views:

```text
Track centerline
Track sample points
Terrain sample points
Gradient
Curvature
Vertical profile
Structure classification
Railway graph
Junction nodes
Station connectors
Route cost
```

These should be development/debug tools and not clutter normal gameplay.

---

# 44. TESTING

Create automated tests where practical.

At minimum test pure calculation modules for:

## Gradient

Known points produce expected gradient.

## Alignment length

Known curve approximations produce expected length.

## Structure classification

Terrain below railway creates bridge candidate.

Terrain significantly above railway creates tunnel candidate.

## Cost model

Known route produces deterministic cost.

## Route validity

Excessive gradient rejected.

Curve radius below minimum rejected.

## Serialization

Track alignment survives save/load without semantic changes.

---

# 45. VISUAL QUALITY

Rail Frontier aims for visually attractive railway landscapes.

Track should visually follow the calculated alignment smoothly.

Avoid:

* polygonal sharp curves,
* rails floating above terrain,
* track buried inside terrain,
* bridge deck disconnected from track,
* visible gaps at tunnel portals,
* abrupt vertical track angles,
* stations disconnected from track geometry.

Pay special attention to transitions:

```text
GROUND → BRIDGE
BRIDGE → GROUND

GROUND → TUNNEL
TUNNEL → GROUND

GROUND → STATION
STATION → GROUND
```

Transitions should look engineered rather than procedurally accidental.

---

# 46. USE OF BLENDER

Blender is available locally.

It may be used to create or improve modular assets such as:

* bridge piers,
* bridge decks,
* tunnel portals,
* retaining walls,
* station platforms,
* buffers,
* railway equipment.

However:

Do not solve dynamic railway geometry by creating thousands of static Blender track pieces.

Procedural geometry should remain procedural.

Use Blender primarily for reusable visual components.

---

# 47. IMPLEMENTATION PRIORITY

Do not attempt every advanced feature at once.

Implement in coherent vertical slices.

## PHASE 1 – GAMEPLAY FOUNDATION

Must work end-to-end:

```text
Place Station A
↓
Place Station B
↓
Start track from Station A
↓
Place route waypoints
↓
Preview track
↓
Show cost
↓
Connect Station B
↓
Confirm construction
↓
Operational railway exists
```

This is the first critical milestone.

---

# 48. PHASE 2 – ENGINEERING

Add:

* gradient constraints,
* curvature constraints,
* terrain sampling,
* cut/fill,
* automatic bridges,
* automatic tunnels,
* engineering cost calculation.

---

# 49. PHASE 3 – ROUTE INTELLIGENCE

Add:

* automatic alignment search,
* Balanced / Low Cost / Fast modes,
* corridor optimization,
* alternative route suggestions.

---

# 50. PHASE 4 – ADVANCED RAILWAY CONSTRUCTION

Later:

* double track,
* electrification,
* junction editor,
* passing loops,
* advanced stations,
* yards,
* complex station throats,
* staged construction,
* bridge selection,
* tunnel construction types,
* construction duration,
* maintenance consequences.

Do not allow Phase 4 complexity to prevent Phase 1 from becoming playable.

---

# 51. CRITICAL UX REQUIREMENT

At no point should a new player wonder:

> What do I click now?

The game must always make the next logical action discoverable.

For the first railway:

```text
No infrastructure
↓
BUILD YOUR FIRST STATION

One station
↓
CONNECT YOUR STATION

Track planning
↓
CLICK TO ADD WAYPOINTS
CLICK A DESTINATION TO FINISH

Valid route
↓
BUILD ROUTE

Route complete
↓
PURCHASE A TRAIN / CREATE SERVICE
```

Use contextual guidance rather than modal tutorial spam.

---

# 52. IMPORTANT DESIGN RULE

Do not expose the internal complexity of the engineering simulation unnecessarily.

The player should experience:

> “I draw where I want the railway to go.”

The simulation should internally determine:

> “How can a technically plausible railway actually be built there?”

This distinction is fundamental to Rail Frontier.

---

# 53. DEFINITION OF DONE FOR FIRST IMPLEMENTATION

The first construction-system milestone is complete only when all of the following work in the running game:

1. Start a new game.
2. Player understands that a station is the logical first construction.
3. Place Station A.
4. Place Station B or choose another valid destination.
5. Start railway construction from Station A.
6. Move cursor through landscape and see live planned track.
7. Add several waypoints.
8. See track smoothly curve through them.
9. See current route distance.
10. See estimated cost.
11. See gradient validity.
12. Cross normal terrain correctly.
13. Cross a valley and receive a bridge where required.
14. Pass through a significant mountain and receive a tunnel where appropriate.
15. Connect cleanly to Station B.
16. Review route.
17. Confirm construction.
18. Money is deducted exactly once.
19. Railway becomes part of the semantic rail network.
20. Save the game.
21. Reload.
22. Railway and stations remain correct.
23. Player is guided toward the next operational step.

---

# 54. REQUIRED CODE QUALITY

Keep systems modular.

Expected conceptual separation:

```text
RailConstructionController

RailPlanningSession

HorizontalAlignmentSolver
VerticalAlignmentSolver

TerrainSampler

EngineeringClassifier

BridgePlanner
TunnelPlanner

RailCostCalculator

RailGeometryGenerator

RailNetworkGraph

StationPlacementController

ConstructionUI

ConstructionStateMachine
```

Names may differ depending on the existing architecture.

Do not force these exact class names if the codebase already has good equivalents.

The important requirement is clean separation of responsibilities.

Avoid one giant `TrackBuilder` class containing input handling, geometry generation, UI, economics and save logic.

---

# 55. ASTRA DESIGN CHECKPOINT

Before implementing major changes, use Astra to critically review:

* current repository architecture,
* proposed construction architecture,
* spline strategy,
* route optimization approach,
* terrain integration,
* station/network graph model,
* UI workflow,
* save-game implications,
* performance implications.

Explicitly identify likely architectural mistakes before implementation.

Particularly challenge:

* whether current terrain representation supports required sampling,
* whether chosen spline representation can support junctions later,
* whether automatic bridge/tunnel classification is stable,
* whether route recalculation can run interactively,
* whether semantic track data is sufficiently separate from mesh generation.

Do not simply approve the first design.

Look for failure modes.

---

# 56. BEFORE WRITING LARGE AMOUNTS OF CODE

Produce a concise implementation design containing:

1. current-state findings,
2. files/modules that will be modified,
3. new modules required,
4. railway data model,
5. construction state machine,
6. spline/alignment algorithm,
7. vertical profile algorithm,
8. bridge/tunnel detection,
9. cost calculation,
10. UI interaction flow,
11. persistence changes,
12. test strategy,
13. phased implementation sequence.

Then perform the Astra architecture/design work.

Once the architecture and algorithms are settled and the remaining task is mainly implementation, STOP.

Return exactly and prominently:

**ARCHITECTURE/DESIGN COMPLETE – SAFE TO SWITCH TO SOL FOR IMPLEMENTATION**

Below that provide:

* implementation plan,
* files to be changed,
* migration implications,
* test plan,
* remaining known risks.

Do not continue consuming Astra reasoning on routine coding after this checkpoint.

---

# 57. FINAL PRODUCT EXPERIENCE

The target experience should feel approximately like this:

The player sees a city beside a fjord.

They choose:

`BUILD → STATION`

They position a station near the city.

The game then suggests:

`Connect this station`

The player clicks the station rail connector.

A ghost railway follows the cursor.

Moving across relatively flat terrain creates ordinary track.

Moving across a valley automatically previews a viaduct.

Moving toward a mountain creates either a climbing alignment or a tunnel depending on engineering constraints and route mode.

The player clicks several waypoints to influence the alignment.

While doing so the game continuously shows:

```text
24.3 km
€186 M
Max gradient 1.6 %
4 bridges
2 tunnels
```

The player reaches another settlement and clicks its station.

The system snaps to the station entrance.

The complete railway appears as a planned route.

The player can still drag waypoints.

Moving one waypoint away from a mountain may remove a tunnel and reduce cost while increasing line length.

Moving another waypoint across the valley may shorten the railway but create an expensive bridge.

The player therefore makes a genuine railway engineering/business decision.

Finally:

`BUILD ROUTE`

The infrastructure is constructed.

The two stations become part of the railway network.

The game now guides the player toward purchasing a train and creating their first service.

That should be the foundational construction experience of **Rail Frontier**.

Do not reduce this concept to a simple “click two points and draw a line” mechanic.

The strategic value comes from the interaction between:

**terrain + railway geometry + engineering structures + cost + performance + player decisions.**
