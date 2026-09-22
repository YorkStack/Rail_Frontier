# A02 — mixed keyboard/pointer adversarial review

**Independence disclosure:** the coordinator could not create another agent because of the thread limit, so this worker previously performed P09. This is a separate fresh headless Chrome browser and context with no reused saves or profile. P09 browser had already closed. Knowledge of the menu and route buttons carried over; this should not be represented as an independently unfamiliar participant.

Frozen `fb5f666` build at `http://127.0.0.1:5190`, German, 1440×900, default scale/DPR 1. Read PROTOCOL and MATRIX. Approximately six minutes, around 40 user-level actions plus observations. No application/test/server edits and no delegation.

## Result

**Zero confirmed findings in the sequences actually tested.** Reached the valley construction lesson, drew and keyboard-edited a route, built it with keyboard activation, saved a named company, reloaded the browser and restored the same company. No claim of exhaustive input correctness.

## Sequences and observed outcomes

1. Menu → Bauschule → Gleisbau ausprobieren → Von: Sundvik. Read-only snapshot: 995,000,000 cash minor units (9,950,000 NOK after prepared stations), four railway edges, tick 0, one draft point.
2. Mouse down at (310,300), drag through eight steps to (440,420), press Escape **before mouseup**, release. Draft returned to its initial one point; planner stayed available and no track was built. This cancellation behavior is appropriate.
3. Repeat drag from (310,300) to (450,410), press Space before mouseup. Time visibly changed from PAUSIERT to LÄUFT and the three-point draft remained. A second Space paused time. This is the normal global play/pause shortcut; no phantom build occurred.
4. Meta+Z, then visible Wiederholen button: undone stroke could be restored. One subsequent automation lookup used the wrong button name (“Punkt zurücknehmen”) and timed out; corrected to the observed “Rückgängig.” Click Rückgängig → draft one point; Meta+Shift+Z → draft restored all three original coordinates. Thus pointer undo followed by keyboard redo was directly verified.
5. With three-point draft, drag from (480,435) to (580,490), inject `window.dispatchEvent(new Event('blur'))`, then release mouse. Draft after blur exactly matched all three pre-drag coordinates. Cash remained 995,000,000 and edges four.
6. Repeat drag from (480,435) to (590,510), inject a `pointercancel` event on the canvas with pointerId 1/type mouse/isPrimary true, then release. Draft again had the original three points; no page errors. **These blur and pointercancel events were deliberate adversarial injections, not claims of an actual OS focus switch.** Mouse movements, down/up and keyboard events used Playwright input APIs; no game-state injection.
7. Open Gleiseinstellungen. Focus native `select#track-class`; Space, ArrowDown, Enter selected Regionalbahn. Type R and F, press Escape. Select remained regional, planner stayed open, draft remained three points, time stayed PAUSIERT. No visible global overview/follow/close/play action occurred from this native control.
8. Focus visible handle named “Streckenpunkt 1, ziehen oder Pfeiltasten verwenden.” ArrowRight and Shift+ArrowDown moved the first editable point from x2899.0358/z3749.7622 to x2904.0358/z3774.7622, while start and final draft point remained unchanged. Read-only terrain height changed consistently with the move.
9. Click Nach: Granli. Wait for completed plan. Selected ground route quote: 665,847 NOK, 2.94 km, 2.9% grade, zero bridge/tunnel. Focus build button and press Enter. Connected card appeared; cash became 928,415,346 minor units (9,284,153 displayed NOK), edges seven, ledger entries three. Charge was 66,584,654 minor units, matching rounded visible quote 665,847 NOK. Tick145 reflects the explicit Space play interval, not an input leak from the native controls.
10. Spielmenü → Einstellungen → Spiel laden. In native text input `#save-name`, fill A02, press Space, type `r f`, Escape, Meta+Z. Text undo restored `A02`; archive view remained open and cash/edges/tick unchanged. Thus typing R/F/space and Escape did not invoke global map/menu/play shortcuts in this field.
11. Click Aktuelle Gesellschaft speichern, observe named A02 slot, reload browser, click Weiterspielen. Valley Connected card and cash928,415,346/edges7/tick145/ledger3 restored exactly.

## Coverage limits and evidence

Not tested: real OS focus/visibility transition, touch/pen capture, multiple simultaneous pointers, keyboard layouts other than this macOS-style Meta mapping, drag across browser chrome, textareas/contenteditable, train operations, later construction lessons, malformed save states. No source or existing test file was read during this A02 run. Previous P09 knowledge is disclosed above. Read-only `__railProbe.snapshot()` and `.planning()` were used solely for invariants and point coordinates, not setup or success injection.

Screenshots actually opened and inspected:

- `artifacts/swarm/evidence/a02/start.png`: initial valley planner and visible target positions.
- `artifacts/swarm/evidence/a02/mixed-route.png`: route after draw, cancellation/recovery, keyboard handle edit and destination selection; quote/build control present.
- `artifacts/swarm/evidence/a02/named-save.png`: named A02 slot after native text editing and save.

Page-error listener recorded `[]`. Console/network errors were not comprehensively instrumented. Final context/browser closed through the driver's `finally`; output `CLOSED []`, process exited 0. Driver is `artifacts/swarm/scripts/a02-driver.mjs`. No remaining A02 browser session; coordinator-owned server left untouched.
