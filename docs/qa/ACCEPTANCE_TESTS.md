# Player acceptance checks

## Repeatable local run

```sh
npm ci
npm test
npm run test:acceptance
```

Requires the project-supported Node version and Google Chrome. The acceptance command type-checks and builds its own test-mode site in `artifacts/acceptance/site`, then starts a private preview on **127.0.0.1:5180**. It refuses to reuse an existing server, runs one browser worker and gives every test a fresh context/storage. It does not attach to or reset the player's development session on 5173, and it does not replace the ordinary `dist` build. Leave port 5180 free.

No automatic retries hide first-run failures. Failed journeys retain a screenshot and Playwright trace. Results are available as:

- `artifacts/acceptance/report/index.html` — readable HTML report.
- `artifacts/acceptance/results.xml` — JUnit results for CI.
- `artifacts/acceptance/results/` — failed-case screenshots and traces.
- `artifacts/evidence/` — scenario-specific screenshots explicitly recorded by tests.

Inspect a trace with `npx playwright show-trace <trace.zip>` or the report with `npx playwright show-report artifacts/acceptance/report`.

## Coverage

| Player journey | Durable tests |
| --- | --- |
| Choose a company, interface size/language, named saves and archive errors | `menu`, `localization-exit` |
| Begin, dismiss, repeat and resume the introduction | `tutorial` |
| Place real stations and connect their platforms | `construction`, `station-approaches` |
| Rotate a station preview, align toward a town, preserve built orientation on reload and see time with tools open in DE/EN | `ux-station-time` |
| Draw, drag, repair, undo and price a real railway | `drawn-route`, `draft-persistence` |
| Compare water/ridge alternatives and keep the previous company | `construction-lessons` |
| Reopen a built railway without confusing internal-node markers | `route-connections` |
| Buy a consist, create stops, assign, resume and follow | `practice-service`, `follow-train`, `operations`, `ux-service-state` |
| Earn actual passenger/mail fares; keep cash and saved state consistent | `passenger` |
| Deliver timber and processed lumber through real simulation | `freight` |
| Preserve route comparisons across panel switching | `ux-route-review` |
| Native keyboard activation, localized accessible names, narrow 100/125/150% layouts | `ux-accessibility` |

The gameplay tests use ordinary controls for purchases, construction and service assignment. Read-only probes inspect state to verify cash, graph, cargo and persistence; a few setup/observation helpers control time or camera. Storage-failure tests deliberately inject a failing write, separately from ordinary journeys.

## Review method and limits

The September 22 review has two rounds: three separate agents attempt first-play journeys from fresh storage without reading implementation first; two further agents inspect interaction/wording and keyboard/responsive accessibility. Findings must include viewport, steps, expected/actual outcome, severity and evidence, and distinguish bugs from suggestions. Individual reports live in `docs/qa/player-review/`.

Agent simulations and automated Chromium journeys do not establish human first-use comprehension or Safari, touch-device and screen-reader acceptance. Those require separate manual checks. A test passing means its specific assertions passed, not that the whole game is finished. New confirmed failures should become focused reproducible tests rather than broad screenshot snapshots or tests that only repeat implementation details.

The consolidated findings, dispositions and retained screenshots are in [PLAYER_REVIEW_2026-09-22.md](PLAYER_REVIEW_2026-09-22.md).
