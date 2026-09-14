# Astra escalations

## ESC-001 — Resolved: terminology, not missing infrastructure

On 2026-09-13 the user clarified that Astra and Sol refer only to Codex models. The initial assumption of an external Astra rendering engine was incorrect. Three.js 0.186.0 was selected, its MIT license inspected, and real rendering/import/camera/LOD/performance experiments passed. No engine access is needed from the user.

## Current escalation status

No open architectural blocker. Initial architecture and the 2026-09-14 graphics planning are complete; Sol may proceed only after the user switches models and asks to continue. Full gameplay and graphics implementation are not claimed complete.

## GFX architecture review — resolved by plan, implementation pending

The user requested real Norway references and a Blender scenery enhancement before mail transport. Inspection found that replacing V1 terrain in place would invalidate saved railway elevations, and the current state-only load path cannot change the readonly game terrain or renderer terrain. Reviewed alternatives: visual materials/models only (preserves saves but retains the artificial large landforms); replace V1 in place (breaks existing worlds); versioned V2 plus matching session replacement (selected).

Decision: freeze V1 generation and old campaign content, introduce V2 only for new worlds, keep schema 3 unless a genuinely new persisted field becomes necessary, and resolve saves through a version-aware content/session host. Use one owned WebGL renderer with staged scene replacement and explicit shared asset lifetime. Reject unsupported world definitions and retain the current session on load failure. Original Blender assets improve both versions. Blast radius: content registry, world generation dispatch, game/bootstrap/save session ownership, renderer lifetime, scenery placement, asset pipeline and related tests; rail geometry, money, tick cadence and existing saved semantics remain protected.

Exact work packages, reference sources and acceptance gates: [docs/art/NORWAY_GRAPHICS_PLAN.md](docs/art/NORWAY_GRAPHICS_PLAN.md). This record approves an implementation direction; it does not claim V2 or cross-version loading has been implemented or tested. Pause for the requested model switch.

Texture planning extension resolved: [Norway timber and rolling stock](docs/art/NORWAY_TEXTURES_AND_ROLLING_STOCK.md) specifies separate building material regions so wall tint does not recolour roofs/glass; shared original PBR maps; geometry for silhouette-changing pipes, windows and locomotive features; and distinct era/livery reference records. Current Nord 2-6-0 content is preserved while borrowing type 18a detail vocabulary; future diesel/electric classes require their own assets and technology work. No additional save-schema change is required for fixed current-stock appearances. GFX-006B is inserted before performance/regression. Planning only; pause for Sol remains in force.

## Later Sol escalation policy

Escalate incompatible subsystem boundaries, major data/save model changes, rail graph/terrain/timing redesign, fundamental performance failure, rendering/asset coordinate redesign or campaign architecture changes. Record problem, evidence, affected systems, current architecture, options, recommendation and estimated blast radius. Set ASTRA_REVIEW_REQUIRED=true in CURRENT_STATUS.md and recommend Astra-level review. Ordinary implementation bugs, type errors, content balancing and local optimizations do not require escalation.
