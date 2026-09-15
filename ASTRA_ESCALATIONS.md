# Astra escalations

## ESC-001 — Resolved: terminology, not missing infrastructure

On 2026-09-13 the user clarified that Astra and Sol refer only to Codex models. The initial assumption of an external Astra rendering engine was incorrect. Three.js 0.186.0 was selected, its MIT license inspected, and real rendering/import/camera/LOD/performance experiments passed. No engine access is needed from the user.

## Current escalation status

The latest station-first construction design is complete and awaiting the requested SOL switch. The decisions below resolve the architecture direction, not runtime correctness. Existing gameplay remains at schema 6. Earlier graphics-review notes are historical; current graphics/UX instructions are in CURRENT_STATUS.md.

## GFX architecture review — resolved by plan, implementation pending

The user requested real Norway references and a Blender scenery enhancement before mail transport. Inspection found that replacing V1 terrain in place would invalidate saved railway elevations, and the current state-only load path cannot change the readonly game terrain or renderer terrain. Reviewed alternatives: visual materials/models only (preserves saves but retains the artificial large landforms); replace V1 in place (breaks existing worlds); versioned V2 plus matching session replacement (selected).

Decision: freeze V1 generation and old campaign content, introduce V2 only for new worlds, keep schema 3 unless a genuinely new persisted field becomes necessary, and resolve saves through a version-aware content/session host. Use one owned WebGL renderer with staged scene replacement and explicit shared asset lifetime. Reject unsupported world definitions and retain the current session on load failure. Original Blender assets improve both versions. Blast radius: content registry, world generation dispatch, game/bootstrap/save session ownership, renderer lifetime, scenery placement, asset pipeline and related tests; rail geometry, money, tick cadence and existing saved semantics remain protected.

Exact work packages, reference sources and acceptance gates: [docs/art/NORWAY_GRAPHICS_PLAN.md](docs/art/NORWAY_GRAPHICS_PLAN.md). This record approves an implementation direction; it does not claim V2 or cross-version loading has been implemented or tested. Pause for the requested model switch.

Texture planning extension resolved: [Norway timber and rolling stock](docs/art/NORWAY_TEXTURES_AND_ROLLING_STOCK.md) specifies separate building material regions so wall tint does not recolour roofs/glass; shared original PBR maps; geometry for silhouette-changing pipes, windows and locomotive features; and distinct era/livery reference records. Current Nord 2-6-0 content is preserved while borrowing type 18a detail vocabulary; future diesel/electric classes require their own assets and technology work. No additional save-schema change is required for fixed current-stock appearances. GFX-006B is inserted before performance/regression. Planning only; pause for Sol remains in force.

## CON architecture review — resolved by design, implementation pending (2026-09-15)

Evidence: the user supplied a complete station-first/continuous-alignment brief after the previous UX proposal. Current stations require pre-existing track; construction accepts one cubic; terrain is an external readonly Heightfield; coverage accepts any station in range; save format is strict schema 6. Simply changing menu labels would not deliver the requested mechanics.

Alternatives challenged: isolated decorative stations (no real topology), zero-distance virtual platforms (teleportation), N separate build commands (partial expenditure), renderer-only earthworks (planner/render mismatch), 2D routing followed by unconstrained smoothing (invalid rail geometry), and silently regenerating old rails (broken saves). All rejected.

Selected: new stations own finite platform rails and real ports; old stations use a topology-preserving legacy layout. A bounded horizontal/vertical solver emits certified existing cubic edges. One alignment transaction stages state and authoritative local terrain patches. Current graph/motion/reservation kernels remain; active-edge splitting stays guarded. Corridor search adds heading/elevation/grade state and a cancellable worker. New class/engineering costs and save migrations are versioned; current electrification is reused.

Blast radius: domain/commands, station eligibility and coverage, alignment/planner, terrain capability and transaction/session ownership, renderer/input, persistence, speed anticipation and tests. Proposed sequential schemas: 6→7 station/alignment metadata, 7→8 earthworks, 8→9 tutorial; legacy data remains numerically stable. Review and detailed algorithms: [STATION_TRACK_DESIGN.md](docs/construction/STATION_TRACK_DESIGN.md). CON-01–05 is the first complete construction milestone, CON-06 routing follows; no implementation has started. SOL should implement this design without escalating the already-decided boundary changes again. Escalate a newly discovered contradiction rather than bypassing protected invariants.

## Later Sol escalation policy

Escalate incompatible subsystem boundaries, major data/save model changes, rail graph/terrain/timing redesign, fundamental performance failure, rendering/asset coordinate redesign or campaign architecture changes. Record problem, evidence, affected systems, current architecture, options, recommendation and estimated blast radius. Set ASTRA_REVIEW_REQUIRED=true in CURRENT_STATUS.md and recommend Astra-level review. Ordinary implementation bugs, type errors, content balancing and local optimizations do not require escalation.
