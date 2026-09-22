# Agent playtest protocol

Baseline: fb5f666. Date: 2026-09-22. This is simulated agent testing, not research with actual children, adults or older people. Personas represent explicit interaction constraints, not claims about an age group's abilities. Eighteen review roles run in waves of at most three browsers, against the same immutable test-mode build on http://127.0.0.1:5190. The coordinator handles findings, prioritization, fixes and regression verification separately.

## Agent contract

- Work only in this repository. Read this protocol. Do not modify application files or existing tests. Save your report to `docs/qa/swarm-2026-09-22/<assigned-id>.md`; optional individual scripts/evidence to `artifacts/swarm/scripts/<id>.mjs` and `artifacts/swarm/evidence/<id>/`.
- Use installed Playwright through Node (`import {chromium} from '@playwright/test'`) with channel `chrome`, headless true, a fresh browser/context and a normal desktop viewport. No persistent profile, no shared browser, no user tabs or user saves. Server 5190 is coordinator-owned; do not start/stop any server.
- Launch only one browser. Always put `await browser.close()` in finally; close contexts and remove your own listeners/processes. Set action/navigation timeouts so a blocked action returns evidence instead of hanging. Report browser closure.
- First-play agents must begin from the menu and attempt the task using visible UI without reading app code or existing test scripts first. Accessible DOM and screenshots are allowed. Once a specific obstruction is observed, implementation may be inspected for diagnosis, clearly separated in the report. Advanced scenario agents may inspect existing browser test setup after an initial UI attempt; disclose any fixture/probe assistance.
- Use actual clicks, keyboard, selection and dragging for normal gameplay. `window.__railProbe.snapshot()` and stats are read-only evidence, not a substitute for gameplay. Camera/time helpers are allowed if explicitly disclosed. Do not dispatch commands or inject state to pretend a player completed a journey. Deliberate failure injection belongs only to assigned adversarial tests and must be recorded.
- Try multiple consecutive stages, then recovery/save/reload if feasible. Do not stop after a screenshot or one button. Bound repeated failure attempts; preserve evidence and move to an independent check if blocked. Do not invent successes or claim user enjoyment as measured.
- For each finding include stable local ID, priority (P0 destructive/data loss; P1 blocks/badly misleads core play; P2 workaround exists; P3 polish), viewport/language/scale, exact steps, expected/actual, observed evidence, reproducibility, suggested regression and a recommendation. Distinguish confirmed bug, UX friction, planned capability and inference. Screenshots must be inspected before using them as evidence.
- Include the achieved end state, approximate action count and elapsed play time, browser errors, state/cash invariants observed, which stages were NOT reached, and cleanup status. No generic checklist pretending coverage. Report zero findings when appropriate.
- Send major reproducible issues to coordinator promptly. Do not spawn more agents. Do not commit/push. Do not modify this protocol.

## Review groups

Ten player agents cover first-time, regular, returning and experienced play using age-inspired interaction preferences (10, 20–35, 70), both languages, construction progression, operations and persistence. Four adversarial agents exercise rapid UI input, mixed pointer/keyboard, wrong action order and failed saves. Four critical game-reviewer agents inspect onboarding, construction pleasure/clarity, operational truth/progression and accessibility/layout. Reviewer roles do not impersonate actual publications.

## Follow-through

Coordinator reproduces and deduplicates findings, fixes meaningful issues, and adds focused durable tests. Minor cosmetic ideas and larger planned capabilities stay documented with reasons. Fresh post-fix build runs relevant regressions plus the acceptance suite. At the end, close all created browsers, stop coordinator/test servers and the project's old development server as requested, inspect remaining project processes/listeners, and report exactly what was stopped. Unrelated user apps/services remain untouched.

## Worker limit disclosure

After eleven distinct new workers (P01–P10 and A01), spawning A02 was rejected with `agent thread limit reached`. Remaining roles reuse completed workers with fresh browser contexts and separate reports. These are eighteen review sessions, not eighteen independent people or agent identities. Worker reuse is recorded in each affected report. Maximum three test browsers at once remains unchanged.
