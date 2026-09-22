# First-play and UX review — 2026-09-22

## Method

Five agents in two sequential rounds, using isolated Chrome browser contexts and ordinary gameplay inputs. Three first-play reviewers covered onboarding, construction, and operations without reading implementation first. Two further reviewers covered navigation/clarity and keyboard/responsive accessibility after the first fixes. These are agent simulations, not observations of human first-time players.

Round 1 used the fixed `ed66975` preview. Round 2 used a frozen test build with initial service and comparison fixes; later local corrections were verified separately. Neither round touched the player's browser or development server. Original reports preserve their observed baseline, including now-fixed defects:

- [First-play onboarding](player-review/onboarding.md)
- [First-play construction](player-review/construction.md)
- [First-play operations](player-review/operations.md)
- [UX clarity/navigation](player-review/ux-clarity.md)
- [UX keyboard/responsive accessibility](player-review/ux-accessibility.md)

## Confirmed findings and disposition

| Finding | Severity | Correction | Regression coverage |
| --- | --- | --- | --- |
| Space activates simulation instead of focused button | P1 | Native controls retain their keyboard activation; canvas Space remains pause/resume | `ux-accessibility` keyboard journey |
| Office calls assigned service “running” while paused; follow leaves it paused | P2 | Assigned/paused status, explicit Resume and follow action, real time advance only on that action | `ux-service-state` EN/DE; second-round independent verification |
| Loaded service points player toward buying another train | P2 | Recover active train/route from saved entities, retain the completed workflow | `ux-service-state` EN/DE reload; independent Save & leave/Resume pass |
| Planner close/reopen discards certified comparisons | P2 | Preserve same-draft cache across tool switches; edits/revisions still invalidate it | `ux-route-review`, existing draft/undo tests |
| Compact map buttons expose only glyphs as names | P2 | Explicit localized accessible names independent of hidden visual labels | `ux-accessibility` EN/DE |
| 150% compact toolbar overlaps camera/speed controls | P2 | Reserve actual wrapped toolbar height, update on resize and scaling | `ux-accessibility` EN/DE at 100/125/150% |
| Existing service's next action buried below completed forms | P3 | Open and advance office at the relevant step; focus and scroll the action into view | `ux-service-state` 1280×720 |
| Repeated cargo batches and “coachs” | P3 | One localized total per cargo kind; correct singular/plural car names | `cargo-summary` core test; service/freight browser journeys |
| Mixed English operational text and To:/Terrain variant in German | P3 | Explicit parameterized messages and both language packs, including success, cost, status and formerly CSS-generated labels | `i18n`, `ux-service-state`, language-switching journey |

No engineering limits were relaxed to make the first-play routes pass. The prior station-approach correction remains protected by forward/reverse default-orientation construction/save tests.

## Retained visual evidence

Before: [loaded office incorrectly suggests purchase](evidence/resumed-office-before.png), [150% compact toolbar overlap](evidence/toolbar-overlap-before.png).

After: [loaded service with explicit resume action](evidence/resumed-office-after.png), [separate enlarged toolbar areas](evidence/toolbar-overlap-after.png).

The individual reviews refer to additional local captures under `artifacts/player-review/`; those generated files are not all committed. The selected before/after images above remain available in Git.

## Validation

The repeatable acceptance command, coverage matrix, reports and isolation rules are documented in [ACCEPTANCE_TESTS.md](ACCEPTANCE_TESTS.md). Validation reached 215/215 core tests and 34 distinct passing browser cases: the broad sweep passed 33/34, with the remaining older layout assertion updated from a fixed y=644 cutoff to an actual 8px clearance from camera controls. Both practice-service cases then passed in a focused rerun. The final four-case service/localization rerun passed, covering the last localized CSS-generated labels. No automatic retries were enabled. Local full-sweep evidence is retained in `artifacts/acceptance/report-full-sweep/` and `full-sweep.xml`; practice follow-up results are in `practice-followup.xml`.

The first broad run passed 25/27 journeys. Its two failures were an exact floating-point camera comparison (differences below 10⁻¹² px) and an outdated cargo label expectation after adding the tonnage unit. The camera test now keeps a sub-micropixel tolerance; the freight test expects `40 t timber` and still requires actual deliveries and balanced cash. No product assertions were removed. A focused test authoring run also used an incorrect settings selector; that selector was corrected before the final run. Automatic retries remain disabled.

## Remaining limits and follow-up

- Human first-use comprehension, screen-reader use, Safari and touch construction still need separate testing. Passing a 390px DOM layout test does not establish mobile game usability.
- Small secondary office text and the number of completed form sections remain candidates for further design work. The active next action is now brought into view, but completed forms are not collapsed.
- Station orientation lacks a dedicated destination-bearing cue; default orientation now produces valid curves, so this did not block the reviewed introduction.
- Further freight onboarding, complex multi-train network comprehension and long-session usability were outside the agent journeys. The acceptance suite separately checks the actual timber-to-lumber chain.
