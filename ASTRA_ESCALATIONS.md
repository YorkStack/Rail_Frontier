# Astra escalations

## ESC-001 — Rendering engine identity missing

Status: open initial architecture blocker (2026-09-13).

Problem: the directive assumes an existing Astra Engine, but the supplied remote at 66d6bb9 contains only README.md and LICENSE. The initially specified local directory was empty. No package, source, integration, API documentation, scene or asset loader is present.

Affected systems: rendering, mesh/shader/instancing choices, asset import, camera, picking, UI integration, terrain visual/query alignment, browser compatibility and performance budgets.

Current architecture: independent strict TypeScript core with provisional renderer port. No graphics engine is imported. Blender CLI and GLB export are tested; runtime import is not.

Options: (1) obtain the intended engine repository/package/docs and validate it; (2) if Astra meant the coding model, explicitly establish that and select a browser renderer based on the actual requirements. Do not infer a third-party package from the generic name Astra.

Recommendation: clarify engine identity before writing a renderer or claiming architecture complete. A text question has been sent. Continue only independent foundation tasks in the meantime.

Blast radius: limited core impact if rendering adapts to SI coordinates and immutable snapshots; significant impact to browser stack, asset extensions, terrain chunks, LOD and performance if an engine is guessed incorrectly.

## Later Sol escalation policy

For a major graph, terrain, timing, save, campaign, rendering or asset-boundary redesign, record problem, evidence, affected systems, current design, options, recommendation and blast radius here; set ASTRA_REVIEW_REQUIRED=true in CURRENT_STATUS.md and recommend Astra review. Ordinary syntax/type errors and isolated implementation bugs do not require escalation. Preserve the requested stop at the eventual Astra → Sol handoff.
