# Astra escalations

## ESC-001 — Resolved: terminology, not missing infrastructure

On 2026-09-13 the user clarified that Astra and Sol refer only to Codex models. The initial assumption of an external Astra rendering engine was incorrect. Three.js 0.186.0 was selected, its MIT license inspected, and real rendering/import/camera/LOD/performance experiments passed. No engine access is needed from the user.

## Current escalation status

No open architectural blocker. Astra-phase architecture work is complete; Sol may proceed only after the user switches models and asks to continue. Full gameplay is intentionally not claimed complete.

## Later Sol escalation policy

Escalate incompatible subsystem boundaries, major data/save model changes, rail graph/terrain/timing redesign, fundamental performance failure, rendering/asset coordinate redesign or campaign architecture changes. Record problem, evidence, affected systems, current architecture, options, recommendation and estimated blast radius. Set ASTRA_REVIEW_REQUIRED=true in CURRENT_STATUS.md and recommend Astra-level review. Ordinary implementation bugs, type errors, content balancing and local optimizations do not require escalation.
