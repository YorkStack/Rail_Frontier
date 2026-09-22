# Review assignment matrix

Baseline `fb5f666`, immutable build on port 5190. All are simulated agent perspectives, not real demographic research. Each report states actual coverage and limits; assignment does not imply successful completion.

| ID | Perspective | Distinct focus |
|---|---|---|
| P01 | Young first-time player, age-10-inspired | German short instructions, experimentation, first railway |
| P02 | Adult strategy novice, 20–35-inspired | English full guided passenger service and reload |
| P03 | Older first-time player, age-70-inspired | German 150% interface, deliberate mouse, menu recovery |
| P04 | Regular strategy player | German free play without introduction, discoverability |
| P05 | Keyboard-preferring older player | English keyboard navigation, settings, recovery, focus |
| P06 | Experienced freight player | Industry chain, consist suitability, loading and economics |
| P07 | Experienced network builder | Multiple trains, station upgrades, physical capacity, congestion |
| P08 | Returning player | Named saves, archive/import/export, company switching, resume |
| P09 | Young returning player | Construction lesson sequence, valley/inlet/ridge/highland decisions |
| P10 | Experienced campaign explorer | Progression, available scenarios, era gates, truthful objectives |
| A01 | Rapid-input adversary | Repeated buttons, fast tool switches, commits during planning |
| A02 | Mixed-input adversary | Keyboard plus pointer, drags, focus loss, undo/redo/cancel |
| A03 | Wrong-order adversary | Missing stations/track/trains/stops, unsuitable purchases |
| A04 | Persistence adversary | Malformed imports, storage failures, rapid save/load/exit |
| U01 | Critical onboarding reviewer | First impression, terminology, instruction hierarchy |
| U02 | Critical construction reviewer | Draw/edit/compare/build clarity and player control |
| U03 | Critical operations reviewer | Operational explanations, costs, state, progression, incentives |
| U04 | Critical inclusive-layout reviewer | Keyboard, scaling, contrast, target sizes, motion, responsive layout |

The coordinator independently reviews the physical station-capacity contract while designing the requested station expansion. Confirmed defects join the same issue register, identified separately from agent findings.

## Worker limit disclosure

After eleven distinct new workers (P01–P10 and A01), spawning A02 was rejected with `agent thread limit reached`. Remaining roles reuse completed workers with fresh browser contexts and separate reports. These are eighteen review sessions, not eighteen independent people or agent identities. Worker reuse is recorded in each affected report. Maximum three test browsers at once remains unchanged.

## Completed outcomes

| Role/report | Actually reached | Important limit |
|---|---|---|
| [P01](p01-young-novice.md) | Two stations, drawn route, passenger service, save/reload | Agent perspective, not a child participant |
| [P02](p02-adult-novice.md) | Complete guided English service and reload | First route only |
| [P03](p03-older-novice.md) | German 150%, two stations/route/train, save/reload | Readability preference, not demographic evidence |
| [P04](p04-regular-freeplay.md) | Freeplay discovery, passenger/mail deliveries, save/reload | No later era |
| [P05](p05-keyboard-older.md) | Keyboard construction/service and save/reload | Native scale selection required harness selectOption |
| [P06](p06-freight-veteran.md) | Real timber/lumber deliveries | Disclosed commissioned fixture; no full freight construction/reload |
| [P07](p07-network-veteran.md) | Three trains/opposing routes, deliveries, legacy upgrade | No proven physical collision clearance or long-term deadlock freedom |
| [P08](p08-returning-saves.md) | Paid station, named save, rename, export | Import/load stages not reached after harness failure |
| [P09](p09-lesson-progression.md) | All four lessons, alternatives, restore checks | Saved original company overwritten on baseline |
| [P10](p10-campaign-explorer.md) | Day 22, 257 passengers, 2/3 goals, Arizona truthfulness | Era boundaries are model tests, not century playthrough |
| [A01](a01-rapid-ui.md) | Repeated commits/purchases, worker cancellation/tool races | One bounded sequence per economic action |
| [A02](a02-mixed-input.md) | Mixed input/cancel/undo/keyboard edit/build/save/reload | Reused P09 worker; blur/cancel injections disclosed |
| [A03](a03-wrong-order.md) | Missing prerequisites/disconnected stops/recovery | Reused P10; later-era limits supplemented by core tests |
| [A04](a04-persistence-adversary.md) | Malformed/oversized imports, IDB abort, recovery, rapid save/load | Reused A01; injected abort is not power-loss testing |
| [U01](u01-onboarding-critic.md) | Full guided service, 28 passengers, save/reload | Reused P09; prior game knowledge disclosed |
| [U02](u02-construction-critic.md) | Hand-drawn inlet, large edit, alternatives,undo,build,reload | Reused P09; no train service in this role |
| [U03](u03-operations-critic.md) | Operational navigation, accounting, stalled production | Reused A01; commissioned fixture disclosed |
| [U04](u04-inclusive-layout-critic.md) | Scales, narrow station, keyboard, one control contrast | Reused P10; not comprehensive WCAG/screen-reader testing |
