# Product

## Register

product

## Users

Rail Frontier is for single-player strategy players who enjoy planning infrastructure, balancing capital and operating costs, and watching a system they designed come alive. They move repeatedly between a regional network view for decisions and a close train view for observation. The primary task is to build a viable railway through difficult terrain, connect settlements, configure service, and understand whether each route works operationally and financially.

## Product Purpose

Rail Frontier is a browser-based railroad company management simulation. It combines terrain-aware network construction with a legible economic model and a living model-railway landscape. The first success case is a complete Norwegian passenger loop: place stations, plan and build a connecting railway, purchase a train, assign a route, carry passengers, earn fares, pay costs, save, reload, and continue without simulation drift.

## Brand Personality

Measured, atmospheric, and exact. The interface should feel like a premium Scandinavian field instrument laid over a living railway landscape. Its voice is concise and calm; its visual character comes from the fjord, cartographic marks, restrained materials, and carefully presented operational information.

## Anti-references

- A flat economic map that hides the pleasure of watching trains and landscape.
- A permanently cluttered management screen with every panel open at once.
- Generic game HUD chrome, neon sci-fi controls, glassmorphism, and ornamental gradients.
- Copied visual language, names, assets, or interface patterns from proprietary railroad games.
- Decoration that weakens simulation legibility or changes authoritative state indirectly.

## Design Principles

1. Keep the world visible. Contextual controls should support the landscape rather than cover it.
2. Make consequences legible before commitment. Construction previews show feasibility, grade, engineering spans, and cost.
3. Let operational truth drive the interface. Cash, demand, cargo, route state, and objective progress come from immutable application snapshots.
4. Reward both planning and observation. Regional decisions and close train watching are equally important modes.
5. Use one coherent control vocabulary across construction, operations, finance, and saves.

## Accessibility & Inclusion

All primary actions require keyboard access, visible focus, readable labels, and explicit state text in addition to color. Motion respects reduced-motion preferences. Pointer capture and camera controls must always have a keyboard escape path. Responsive layouts retain speed, cash, objectives, and the active task on narrower screens.

## First-use priority (2026-09-15)

A new player must be able to create a first railway without reading external instructions or enlarging the browser to read controls. Place and orient a station first, then plan railway from its visible connection points using editable waypoints, automatic engineering and a full-route cost review. Introduce locomotive/wagon composition and service through real actions in the world. Show advanced choices progressively while retaining an explicit full-tools mode and all authoritative campaign/year constraints. Graphics should feel like a situated landscape with natural silhouettes and convincing buildings, rather than a tabletop of isolated primitives. Active detail: docs/ux/ONBOARDING_AND_CONTROLS_PLAN.md and docs/art/GRAPHICS_REWORK_PLAN.md.
