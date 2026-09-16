# Graphics rework — Norway and Arizona

Date: 2026-09-16. **Planning complete; SOL implementation active. GFX-R01–03 are complete; GFX-R04 is next.**

This is the active graphics handoff. It supersedes the visual acceptance claims of GFX-001–008 and EXP-003, while preserving those checkpoints as engineering history. The user rejected the current appearance: plain terrain, toy trees, missing visible cliffs/waterfalls, box buildings in Arizona, inverted Norwegian roofs and a board-like opening view. Passing tests and counting assets did not establish acceptable art quality.

## Checkpoint and resume order

- Runtime checkpoint: `82e65d89069fc34f3bec7f8ac8f00b8052ccdbfe`; synchronization to both `main` and `implementation/passenger-slice` follows the documentation checkpoint.
- Existing gameplay: Norway construction, stations, passenger/mail/freight, routes, electrification, locomotive eras, saves and reports are implemented. Preserve this work.
- EXP-003 is a technical Arizona terrain prototype, **not a finished or playable Arizona campaign**. Its hidden HUD, empty railway and primitive buildings must be described accordingly.
- Pause EXP-004 economy/cargo work, EXP-005 full campaign selector and Great River until the graphics rework passes. The Arizona art portion of EXP-004 is incorporated below; avoid duplicate asset work later.
- Combined order after the user switches model and asks to continue: **GFX-R01 → GFX-R02 → UX-001 → CON-01–03 → GFX-R03–07 → CON-04–06 → UX-003 + UX-004–005 / CON-07 → GFX-R08–09 + UX-006**. The [station-first construction design](../construction/STATION_TRACK_DESIGN.md) supersedes the initial UX-002 proposal; see also [ONBOARDING_AND_CONTROLS_PLAN.md](../ux/ONBOARDING_AND_CONTROLS_PLAN.md). SOL is an LLM selection; Three.js remains the renderer.
- This planning turn changes documentation and preserves the user's screenshots only. It does not regenerate assets, change runtime code or claim new implementation test passes.

## Evidence and diagnosed causes

The five original graphics images are preserved in [graphics-review-baseline](graphics-review-baseline/). Their original ordering is Arizona buildings, Arizona overview, Norway overview, Norway trees, Norway roofs. The roof defect is visible in the fifth attached image even though the user referred to screenshot 4.

| Evidence | Diagnosis from current source / exported assets | Required correction |
|---|---|---|
| [Norway roofs](graphics-review-baseline/norway-roofs.png) | `generate_norway_architecture.py:house()` rotates the left roof +46° and right roof −46° around Blender Y. A read-only import of the actual `norway-house-red-white_lod0.glb` into installed Blender 4.0.2 confirms outer roof vertices around Z=9.64–9.93 m and inner vertices around Z=6.07–6.36 m. Roof halves also fail to meet. Barn has the same sign pattern. | Rebuild roofs from ridge/eave coordinates, including gable infill, trim and closed joins. Validate exported geometry, not just source rotations. |
| [Norway trees](graphics-review-baseline/norway-trees.png) | `scenery-placement.ts` chooses tree LOD0 for only 1.8% of placements using RNG, with 98.2% permanently simplified. `authoredScenery()` uses that fixed choice. A separate global camera-to-target threshold (550/350 m) hides detail for the entire world. Simplified assets are cones or single icosphere crowns. Both authored near/far batches explicitly disable shadow casting. | Camera-dependent spatial LOD, credible silhouettes at every level, nearby canopy shadows and texture-bearing foliage. |
| [Arizona buildings](graphics-review-baseline/arizona-buildings.png) | Presentation has `assetManifestUrl:null`; `createSouthwestBuildings()` deliberately draws a wall cube and flat roof cube, with no openings, facade maps or plot layout. | Original 1900-era Blender architecture pack and its own placement rules. |
| [Arizona overview](graphics-review-baseline/arizona-regional.png) | Smooth radial mesa ramps, broad flat basin, repeated sinusoidal ridges and terrain-wide elevation color bands give rounded tabletop forms. Only sparse point vegetation breaks the surface. | Directed erosion, broken escarpments, talus and material regions, with coherent landform silhouettes. |
| [Norway overview](graphics-review-baseline/norway-regional.png) | Smooth fjord-wall formula, oversized overview camera and weak surface differentiation. Rocks are few, small and excluded on the steepest slopes. One waterfall is a narrow terrain-following strip. Existing waterfall geometry alone does not make a visible landmark. | Versioned landform improvements, landmark-sized cliffs and a watercourse with a real drop, plus better framing. |
| Both surfaces | `terrain-material.ts` uses a 128² sum of repeating sine waves, with `terrain-mesh.ts` UVs repeating every 720 m. `DataTexture` defaults to `generateMipmaps=false` in installed Three.js; code selects a mip filter without explicitly generating mips. The tiled wavy/checkered surface is visible. | Multi-scale original material maps; explicit filtering/mips; coherent rock mapping on cliffs. Do not just enlarge the existing tile. |
| Lighting | Sun-to-target offset length is about 12.75 km in Norway and 19.13 km in Arizona, but shadow camera far is fixed at 15 km. Arizona's target is outside this shadow range. Large hemisphere fill, tinted haze and the green UI vignette further flatten contrast. | Fit the shadow frustum to actual near receivers/casters; calibrate neutral lighting, sky and material values independently. |
| First impression | Both constructors and successful session replacement invoke `regional()`. Norway's offset is `(7800,6320,8900)` m; Arizona's is `(13600,7600,12800)` m. The finite map outline is exposed and buildings become dots. | Separate opening, operational and overview cameras. Default to a settlement-scale view with a distant horizon. |

The later [station-placement screenshot](graphics-review-baseline/station-placement-ui.png) and its interaction diagnosis belong to the linked UX plan. The integrated review must demonstrate readable controls and understandable map targets as well as attractive scenery.

## Reference direction and limits

Create a grounded, naturalistic railway landscape with readable details at the actual operating zoom. Foreground houses, trees and railway provide scale; mid-distance water/cliffs provide identity; distant ridges provide depth. Bigger feeling comes first from composition and landform continuity, not from inflating simulation kilometres or multiplying every object size.

References inspected during this review:

| ID | Source / inspection | Use and date limits |
|---|---|---|
| REF-N1 | [Ørnesvingen, Norwegian Scenic Routes](https://www.nasjonaleturistveger.no/en/routes/geiranger--trollstigen/ornesvingen/), main photograph by Jarle Wæhler / Statens vegvesen visually inspected | Near-vertical broken faces, contrasting woodland patches, dark blue water and successive ridges. Use the landscape; the contemporary viewing deck is excluded from 1900 architecture. |
| REF-N2 | [Undredalsstova, De Heibergske Samlinger](https://misf.no/de-heibergske-samlinger/husa-og-bygningane-vaare/undredalsstova), exterior photographs and text inspected | Central pitched ridge, heavy timber, small divided glazing, roof thickness, stone/ground contact and vegetation around the building. Museum records relocation in 1903. This is a preserved older smokehouse, not a template for every 1900 home. |
| REF-N3 | [Undredal settlement history, Kringom](https://kringom.no/en/small-town-undredal), text inspected | Clustered farm settlement and changes following the 1902 division. Combine with the earlier Norwegian paint/trim references in [NORWAY_TEXTURES_AND_ROLLING_STOCK.md](NORWAY_TEXTURES_AND_ROLLING_STOCK.md); do not treat modern paint as certified 1900 livery. |
| REF-A1 | [Walnut Canyon nature, NPS](https://www.nps.gov/waca/learn/nature/index.htm), page photograph and geology text inspected; [NPS geodiversity record](https://www.nps.gov/articles/nps-geodiversity-atlas-walnut-canyon-national-monument-arizona.htm) text inspected | Sandstone faces, limestone ledges, crevices, slope vegetation and a narrow drainage channel. Ancient cliff dwellings are not 1900 mining-town housing. |
| REF-A2 | [Allen A. Dutton collection, Arizona Historical Information and Records](https://www.ahfweb.org/collections/allen-a-dutton-photograph/), historical/contemporary pairs visually inspected | Page labels Prescott 1900, Bisbee 1907, Tempe 1910 and later comparison images. Historical views show street-facing facades, roof profiles, awnings/arcades and compact street frontage. Prescott 1900 anchors the starting era; 1907/1910 are adjacent-era comparisons, not proof every shown structure existed in 1900. Monochrome photographs do not establish paint. |
| REF-A3 | [Arizona Memory Project: Views of Prescott](https://azmemory.azlibrary.gov/nodes/view/82410), catalogue date/rights inspected | Additional 1900s–1910s research lead for each asset's detailed front/side study. Do not ship archive images as textures. |
| REF-A4 | [Tuzigoot trees/shrubs, NPS](https://home.nps.gov/tuzi/learn/nature/trees-and-shrubs.htm) and [Tonto saguaros, NPS](https://www.nps.gov/tont/learn/nature/saguaro.htm), text inspected | Use separate dry woodland, scrub and warmer low-basin cactus zones. Saguaro occurrence is climate/elevation-limited; no uniform cactus scatter over high plateaus. |

Local reference screenshots are ignored research artifacts in `artifacts/graphics-replan/`. The LOC United Verde Smelter record was discovered but its photograph hit a browser challenge; it is not a visually reviewed reference. All shipped textures/meshes remain original. Author asset-specific reference records with location, approximate period, source URL and uncertainty. Existing source maps in the expansion plan remain the regional guide; this rework is not a geodata import.

## GFX-R01 — Correct Norwegian architecture and establish the visual test

**First implementation checkpoint.** Use local `/Applications/Blender.app/Contents/MacOS/Blender` (4.0.2 verified in this review).

Replace the two rotated-box roof recipe with a shared parametric gable-roof helper. Inputs: wall width/depth, wall top, overhang, rise and thickness. Build explicit ridge points at X=0 and eave points at ±(half-width + overhang), ridge strictly above both eaves, with gable end triangles, fascia following slopes and a small ridge cap. A starting 32–45° pitch is an art choice, not a universal historic specification. Ensure wall top meets roof underside; no daylight slit, hovering boards or roof cutting down through windows. Use the same helper for house and barn, and audit stabbur/boathouse/depot/sawmill roofs for plausible types. A flat roof is allowed only as an intentional documented building form.

Keep all eight Norwegian red/yellow/charcoal/white finishes. Add divided windows, doors, sills, foundations and roof courses to every facade visible at operating zoom, not just one front. Correct UV direction and white verge/roof trim. Do not change building footprints or rail collision semantics merely to fix roofing.

Files: `tools/blender/generate_norway_architecture.py`, shared Blender helpers, regenerated Norway GLBs/manifest, `tools/validate-assets.ts`, architecture evidence/tests. Acceptance: both exported LODs of every pitched roof have central ridge above both eaves and connected surfaces; front/side/three-quarter/top contact sheet; actual game Granli view reproduces the user's complaint and then shows corrected roofs. Numeric roof assertions must fail on the current inverted asset. Texture presence alone is insufficient.

## GFX-R02 — Settlement opening camera, scale and lighting

Add presentation-owned `entryCameraId`, with `entry`, `settlement`, `landmark`, `regional` and `train` meanings kept distinct. Keep old camera IDs as compatibility aliases for existing diagnostics. Entry is used at first load and new company; resuming a save chooses a sensible settlement or restores a separately managed camera preference, not an automatic map-wide zoom. Regional remains an explicit overview command. A new empty company must not imply that a station or train has already been purchased.

Initial tuning candidates (not final screenshots): Norway target around Sundvik `(2200,3200)` at ground +10 m, offset approximately `(140,95,220)` m, looking through houses toward the fjord; Arizona target around Red Mesa `(11976,10500)` at ground +8 m, offset approximately `(300,160,380)` m, looking past the street toward the western mesa. Begin with 42–48° vertical FOV. Tune target, azimuth and offset together after terrain and plots exist. Keep buildings tens of pixels tall; allow a readable skyline above them. No simulation-unit or vehicle-scale changes.

Add a distant, non-playable terrain surround derived from matching boundary heights; join it without cracks and fade into layered atmospheric silhouettes. Decorative surround must be excluded from picking, construction and save world bounds. Orbit/pan bounds keep usable camera targets inside the world. Default and standard settlement/landmark cameras show no rectangular terrain edge; an intentional strategic overview can reveal the playable extent through its UI.

Replace the green/brown blanket haze with region-specific sky and distance fog; preserve near contrast and cool shaded faces. Fit shadows around near town/forest casters and receivers with their actual light-space depth. Remove the Arizona 19.13 km versus 15 km mismatch. Test shadow acne, detached contact and softness at door/tree scale. Review with UI off and on; reduce the vignette if it hides the left third of the landscape. Fix overlapping cash/objective panels and conflicting labels in the provided desktop aspect ratios as part of this framing pass. Arizona study gets a small honest landscape-preview caption, camera controls and return-to-Norway link instead of an unexplained empty canvas; full campaign selector remains EXP-005.

Files: presentation/registry, camera presets, renderer camera/light handling, `main.ts`, scoped UI CSS. Acceptance: cold launch, new game and resume on 1440×900, approximately 2560×1360 and 390×844; no overlapping essential HUD or masked focal building; visual reference cards for entry and regional cameras.

## GFX-R03 — Natural terrain materials

**Status: complete at runtime checkpoint `82e65d8`.** Original deterministic 512² color/normal/roughness atlases supply four families per biome. Heightfield forest, rock and urban masks plus slope drive regions; steep rock is triplanar, macro variation is non-periodic, Arizona strata use irregular widths and all color-space/mipmap/anisotropy settings are explicit. Six fixed Norway/Arizona Chrome views passed shader-console, terrain-agreement and geometry/call budgets after visual review; world fingerprints and authoritative elevations remain unchanged.

Replace the periodic sine texture with original rock, gravel/soil, meadow and forest-floor families for Norway; sandstone/limestone, talus, dusty soil and compacted street material for Arizona. Separate macro variation (roughly 100–800 m), patches (8–60 m) and micro detail (0.2–3 m). These are art starting scales. Avoid regular checker grids, equal-width color contours and grain large enough to look like fields.

Use world-space blending by slope, landform/material region and visual moisture. Use triplanar rock sampling on steep faces so cliff textures do not stretch vertically. Preserve Three.js normal, shadow, fog and tone mapping behavior when extending the installed material; inspect local shader hooks and use stable program cache keys. Terrain geometry remains authoritative, with no displacement hidden from the planner. Add explicit mip generation, minification/anisotropy settings within device limits, and moving-camera checks for shimmer. DataTexture mipmap defaults must be handled intentionally.

Define original material atlases at 512²/1024² to start, normal/roughness maps in linear space and base color in sRGB. Grain is subordinate to silhouette. Calibrate through a neutral gray/wood/rock swatch scene before landscape tinting. Acceptance: close soil/rock and distant slope show readable material regions without repetitive waves or crawling; both dev and production builds load the intended maps. Preserve old-world numeric fingerprints.

## GFX-R04 — Camera-dependent vegetation with credible crowns

Remove RNG-assigned visual LOD from scenery identity. Generate deterministic species, transform and habitat first; choose detail each frame or on camera cell changes using projected size/distance. Start with 256–512 m spatial chunks, cull invisible chunks, and select near/mid/far bands with hysteresis. Do not render 28,000 detailed trees at once, or switch the entire forest when camera-to-target distance crosses 550 m. Far crowns must retain coherent canopy coverage instead of dropping two thirds of visible trees to thin sticks.

Author locally in Blender: two asymmetric pine crowns, two spruce forms, birch and alder with forks, irregular branch tiers and leaf/needle clusters. Use alpha-tested foliage cards with original foliage atlases where helpful, tested from above and below; opaque detailed clumps are an alternative if alpha coverage/overdraw fails. Avoid translucent sorting as the default. Bark normals, trunk taper, wind limited to modest visual sway, varied age/height and gaps between branch masses. Far LODs may be simple but must preserve species/canopy silhouette, never a long pole under one tiny polyhedron.

Starting asset budgets: tree LOD0 ~1,500–3,500 triangles, LOD1 ~200–600; final visible totals govern. Render near shadow casters only, retain static ambient contact under distant canopy. Regional forest-floor/canopy masks can support distant coverage without allocating tree meshes across every hectare. Replace the uniform 330 m empty ring around towns with per-building/road/rail exclusions and irregular gardens/woodland edges.

Arizona uses lower, patchy shrubs, grass tufts, prickly pear/cholla-like original forms where referenced, juniper/pinyon groups on selected cooler slopes and sparse dry mesquite-like trees in lower zones. Saguaros only in an authored warm-low-basin habitat, with ribbed stems, upward arms and age variation. Do not interpret the game's relative Y elevation as an exact real-world habitat altitude.

Acceptance: tree fills 150–300 px in a near view and shows branches/foliage separation; 30–80 px trees still read as crowns; camera travel through LOD bands has no mass extinction or obvious silhouette swap; tree and rock count diagnostics report drawn detail as well as generated totals. Construction removes only intersecting scenery, with stable remaining IDs.

## GFX-R05 — Norway cliffs, shore and visible waterfalls

Create **Norway world/campaign V3** for authoritative landform changes; retain Norway V1/V2 generators and save loading. Sculpt directed rock buttresses, irregular gullies, exposed steep faces and talus at their bases, with narrow settlement terraces and an inland valley. Establish at least three named cliff clusters, one visible across the fjord from the entry camera and another beside a railway approach. Choose hard/soft slope transitions deliberately rather than increasing random noise everywhere.

Model terrain-defining faces in the heightfield. Decorative Blender rock fragments (roughly 5–30 m) and cliff-detail modules (roughly 20–80 m) can break local silhouettes, but sit largely within terrain and outside building/rail clearances. Clear them when track is built. No fake traversable wall layered over a planner-approved empty space. Overhanging rock collision is a separate feature; do not introduce it accidentally.

Author a watercourse descriptor with upstream channel, lip, falling segment, plunge pool, outlet and named camera anchor. Implement one prominent fall (~60–140 m drop as a starting art range) plus a smaller cascade, flowing downhill into connected water. Use a directed ribbon/sheet with transparent edges, foam at impact and subtle mist; do not reuse the current constant-Z strip as the whole waterfall. Match water depth/shore boundaries to terrain and avoid water appearing on arbitrary land. A huge ornamental fall is not required in the dry Arizona map.

Acceptance: neutral clay terrain already reads as a fjord with rock walls; waterfall silhouette and outlet are visible from a named landmark view and detectable from a settlement approach. All settlement pads and commissioned/empty-company build journeys pass against V3, and old worlds retain exact numeric samples. Add cliff, wet-rock and waterfall close screenshots; availability in the asset list is not evidence of visibility.

## GFX-R06 — Arizona escarpments and geological variety

Create **Arizona study world/campaign V2**, preserving V1. Break circular mesa symmetry with branching erosional cuts, stepped resistant ledges, irregular caprock and talus fans. Replace the straight trench impression with connected, meandering main/side drainage and a narrower incised gorge. Keep broad basin openness but introduce gravel washes, outcrops, low relief fans and habitat patches that are legible at street/rail scale.

Strata follow a few authored geological layers with varied thickness and weathering, confined to exposed formations; soil and road surfaces do not inherit every elevation band. Use dusty tan, warm sandstone, pale ledges and darker weathered rock instead of one orange hue. Keep the long feasible rail shelf but vary its visual margins; no obvious artificially flattened strip extending to the world edge.

Acceptance: clay and textured views each show escarpment, mesa, canyon and basin as distinct forms; three flat settlement sites; two long feasible corridors and a visible bridge/detour decision. Recalculate and record bridge length/cost; the old 1.2 km bridge is a V1 fact, not a number to force into V2. Preserve railway feasibility and world/render agreement.

## GFX-R07 — Arizona architecture around 1900 and composed towns

Replace all visible two-box buildings with an original Blender pack. Minimum kit: two timber houses, one adobe/plastered masonry house, one modest brick/stone building, two street-facing shops, a timber depot, water tower, freight shed and mine shed/headframe exterior. Each needs actual windows/door openings or inset representations, glazing/frames, roof structure, weathered boards/plaster/masonry and foundation contact. Homes use documented gabled/hipped or adobe roof forms. Commercial false-front facades must reveal a plausible roof behind them. Porches, boardwalks, awnings, chimneys, crates and fences give period scale. No modern glass curtain walls, air conditioners, satellite dishes, road markings or invented generic neon Western scenery.

Start with asset-specific historical reference pairs; the photographs above establish the overall vocabulary, not measured building plans. All color choices are art interpretation unless documented. Reuse earlier Norwegian locomotive detail requirements for windows/doors/pipes/grilles, but do not relabel Norwegian rolling stock as historically accurate American equipment. US trains/economic content belong to the remaining EXP-004 task.

Generate streets and plots first, then place buildings with doors facing access paths, aligned foundations, setbacks, gardens/yards and occasional secondary sheds. Main frontage should read as a settlement at operating zoom; avoid radial random scatter and perfectly identical spacing. Reuse this placement discipline for Norway's empty lawns, preserving its clustered harbour/farm character. Visual paths do not create simulated road transport.

Architecture maps: start with shared 1K base-color/normal/roughness sets for timber, masonry and roof/trim; use 2K only after close-view evidence and residency accounting. Paint must not tint roof/window/masonry channels. Near budgets: houses ~800–3,000 triangles, depot/industrial forms ~2,000–6,000; far LOD ~150–700 with window/door/roof identity retained. Build render batches by material/region; avoid one unique material per window.

Files: new `tools/blender/generate_arizona_architecture.py`, shared asset helpers, Arizona manifest, generic asset loading and presentation asset-role mapping, new deterministic settlement placement. Remove the renderer's Norway-specific station/building asset selection for the shared path; missing Arizona manifest/assets must surface a load failure, not silently display cube substitutes.

Acceptance: a normal street/settlement screenshot shows at least three distinct building forms, doors/windows readable, textured roofs and coherent ground contact; front, side and roof inspections for both LODs. Arizona remains explicitly a scenery study until gameplay is implemented. No implied complete campaign from an art pack.

## GFX-R08 — Composition and performance integration

Freeze honest review cameras: Norway entry, Granli roofs, forest near/mid, cliff/shore, waterfall, moving train and regional; Arizona entry/street, house close, vegetation, mesa, canyon, industry exterior and regional. Capture native 1440×900 and the user's large desktop proportions, with paired UI-on/UI-off images. Also navigate freely: showcase presets must not hide bad normal play views.

Keep target ≤300 normal draw calls and ≤2 million visible main-pass triangles as initial limits; separately report shadow work, foliage alpha overdraw and actual frame times. The Arizona prototype's <50-call cap is no longer its final art limit; explicitly revise that study test with the normal scene budget, not as a way to hide a regression. Use per-chunk LOD/culling, shared atlases and shadow reach before sacrificing near silhouettes.

Preferred 60 FPS, desktop p95 ≤33.3 ms at 1440×900 on the named measured device; record large-screen and mobile separately without assuming desktop parity. Measure sustained 60-second 1×/8× sweeps, transitions and five scene unload/reloads. Treat render-submit timing as CPU, not GPU timing. Initial core compressed target <5 MB; active campaign art target ≤15 MB, ceiling 25 MB; unique decoded texture target ≤128 MiB including mipmaps. Count normal/roughness/foliage and shared duplicates honestly. Changes to these goals require documented measured tradeoffs, not automatic acceptance.

## GFX-R09 — Actual visual acceptance and durable handoff

A checkpoint can pass technical tests while remaining visually unfinished. Maintain a visual checklist with each camera, source reference, before/after image, observer's specific finding and pass/fail. A screenshot file being created, asset count matching or no console errors does not constitute an art pass. Never label unreviewed images accepted.

Required visible outcomes:

- Every pitched roof has its ridge highest, joins sealed and trim following the correct roof slope.
- Nearby trees have branching crowns and foliage texture; mid-distance woods read as irregular canopy, with no field of toy cones/lollipops.
- Norway has prominent exposed cliffs, varied slopes and at least one clearly visible connected waterfall; Arizona has broken escarpments and a recognizable incised canyon.
- No large repeating checker/wave carpet on either map at entry, settlement or regional scale.
- Arizona buildings show period-appropriate windows, doors, roof types and streets; Norway has planted/working surroundings rather than bare radial lawns.
- Entry feels situated inside a region: useful house scale, landscape behind it, no board edge. Regional overview remains accessible.
- Buildings, trees, rocks and trains have grounded contact and legible materials under normal lighting; moving-camera details do not flicker or vanish.

Run relevant Node, Blender/GLB and Chrome tests at each checkpoint, full regression after integration, production asset-load checks, old-world saves and scene disposal. Add tests for the diagnosed failures: ridge versus eave heights, camera-selected LOD, shadow depth bounds, new-world fingerprints, watercourse descent and shoreline/terrain agreement. Do not merely assert that a new material or file exists.

Refresh README screenshots from the final **actual game**, labeled by campaign/version, and link the before/after review report. Record remaining limitations explicitly. Commit/push every completed checkpoint to both `implementation/passenger-slice` and `main`; verify remote commit IDs. Update `CURRENT_STATUS.md` and `IMPLEMENTATION_PLAN.md` so the next model never resumes from an obsolete completion flag.

## Planning handoff

Planning is ready for SOL implementation. **Stop here until the user switches to SOL and asks to continue.** This pause is explicitly requested by the user, not an additional approval rule. Start at GFX-R01 with the roof fix and real exported-asset comparison, then follow the combined graphics/UX order above. Mark graphics implementation complete only after GFX-R09's visual and technical gates pass. Resume the unfinished EXP-004 campaign/economy portion after the integrated graphics/UX review; any pending independent UX acceptance must be reported explicitly.
