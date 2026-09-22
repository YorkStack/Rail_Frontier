# P03 — deliberate first-time play, German, 150%

Independent simulated agent playtest, 2026-09-22; baseline specified by protocol: fb5f666. This is not research with an actual older person. The persona's explicitly chosen preferences were deliberate mouse interaction, readable enlarged controls, and avoiding unexplained icons. Viewport 1280×720; fresh de-DE context; in-game scale changed from 100% to 150%; headless installed Chrome through Playwright. Approximately 35 successful UI actions over approximately 15 minutes, plus read-only DOM/screenshot inspections and several locator corrections. No app source or existing test source was read. No probe, state injection, camera helper, simulation helper, or keyboard shortcut was used. The visible 8× time button was used once.

## Journey and outcome

1. Fresh main menu → Einstellungen. Selected 150% in the Bedienoberfläche select, then Kampagne → Neues Spiel → Geführter Einstieg. Settings navigation was understandable; native selection worked. Menu pages scroll at this scale.
2. Clicked Bahnhofsplanung öffnen. The guide supplied a valid Sundvik preview. Scrolled in the station panel, selected Granli under Richtung eines Ortes, clicked Zum Ort ausrichten, then Bahnhof bauen. Tutorial advanced to step 2; cash changed from 5,000,000 to 4,975,000 NOK.
3. Opened station planning again; the guide supplied the Granli preview. Built it at the inherited 55° direction. Tutorial advanced to step 3; cash became 4,950,000 NOK.
4. Streckenplanung öffnen → Von: Sundvik → Nach: Granli. These labeled buttons allowed deliberate selection without interpreting small map icons. Waited for cost evaluation. The first route was 2,934 m, 1.9% maximum slope, no bridge/tunnel, 524,331 NOK; alternative 523,833 NOK. Clicked Für 524.331 NOK bauen. Tutorial advanced to step 5; cash became 4,425,669 NOK. Track construction succeeded without drawing a custom path.
5. Bahnbetrieb öffnen → bought the recommended steam locomotive and two passenger coaches for 180,000 NOK. Guide prefilled Sundvik and Granli stops. Clicked Linie anlegen then Linie zuweisen; tutorial reached step 7. Clicked Zeit fortsetzen und Zug folgen, then 8×. The assigned train existed, but no passenger delivery was observed within this bounded run.
6. Spiel speichern succeeded at simulation step 1,710. Spielmenü → Zum Hauptmenü showed an explicit save/leave choice. Speichern & verlassen returned to the main menu. Spiel laden showed a manual company and Autosave. Reloaded the page, reopened Spiel laden after initialization, and clicked the first Fortsetzen. The game returned with 150% retained, step 7, day 2, 4,245,238 NOK, paused time, connected-settlement progress 2/2, and a train-follow control. The same cash value was visible immediately before leaving and after loading.

Achieved: two stations, one connecting railway, one purchased/assigned shuttle, saved and restored progress. Not reached: observed passenger arrival/revenue, tutorial completion, 200-passenger or operating-profit objectives, Fjellhavn expansion, custom track dragging, invalid terrain, import/export, deliberate failed-save handling. Therefore no conclusion about longer-term economics or complete campaign success.

## Findings

### P03-01 — P2 confirmed layout issue: objective card is covered by the clock

- Environment: German, 1280×720, 150%.
- Exact reproduction: start guided play, build the first station, close construction panel; also reproduced after restoring the saved game.
- Expected: the first-contract objective names and values remain readable alongside the date/speed deck.
- Actual: the right objective card extends below the clock deck; Betriebsgewinn and its amount are behind the clock at the bottom right. The screenshot after reload visibly shows this overlap. The text remains in DOM, but is not legibly presented to the player. No independent control is blocked.
- Evidence inspected: `artifacts/swarm/evidence/p03-older-novice/first-station-built.png`; `artifacts/swarm/evidence/p03-older-novice/load-list.png` (despite its filename, this captures the restored game after asynchronous load).
- Reproducibility: seen in two distinct game states plus after reload, same session.
- Recommendation: reserve space above the clock for the full objective card or provide its own visible scroll/collapse affordance.
- Suggested regression: German 1280×720 at 150%, objective card expanded, verify all three objective rows are within viewport and unobscured by clock bounds.

### P03-02 — P2 UX friction: enlarged station panel leaves a very short scroll area

- Environment: German, 1280×720, 150%.
- Exact reproduction: guided step 1 → Bahnhofsplanung öffnen. Scroll wheel over panel body to reach orientation settings. Repeat at step 2.
- Expected: useful placement guidance and at least a coherent block of controls fit together, with scrolling discoverable.
- Actual: large fixed heading and fixed cost/build footer leave roughly 110–140 vertical pixels for the main station content. Initial guidance is visibly cut after “die Ringe”; selecting direction requires scrolling through a narrow window. The route preview panel similarly cuts the first alternative's engineering metrics at the bottom of its body. No visible scrollbar appeared in the screenshots.
- Evidence inspected: `station-panel-150.png`, `station-scroll-150.png`, `second-station-preview.png`, `track-direct-ready.png` in the evidence directory.
- Reproducibility: repeated on both stations and route preview.
- Important limit: this was not a construction blocker. Mouse wheel and locator-driven native scrolling reached the controls; both stations and track were successfully built. Accessible DOM inspection made discovery easier than purely visual first play.
- Recommendation: reduce fixed heading/footer space on short viewports, use a taller scrollable region, and expose a clear scroll cue.
- Suggested regression: show first-placement instructions and usable orientation controls at 150%/720px; assert scroll region has enough height for a complete control plus label.

### P03-03 — P2 readability friction: some helper/action text remains tiny at 150%

- Environment: German, 1280×720, 150%.
- Exact reproduction: after creating a railway, open Züge & Linien; then save, return to main menu, open Spiel laden.
- Expected: choosing 150% increases text throughout operational and persistence interfaces to a comfortable, consistent size.
- Actual: operational stepper/helper text and the save-page action/helper text remain extremely small relative to neighboring 22px labels. The save control AKTUELLE GESELLSCHAFT SPEICHERN and the new-save label are visually tiny even at 150%. DOM read-only check additionally confirmed the main Spielmenü button stayed 14px while Bahnhöfe was 22.5px and root scale was 1.5; the small save text itself was not measured.
- Evidence inspected: `train-panel.png`, `assigned-line.png`, `load-menu.png`.
- Reproducibility: observed in two independent panels. Controls remained usable by mouse/accessible text; no failed operation was attributed to font size.
- Recommendation: apply scale/minimum readable size consistently to helper and persistence action text, especially text needed to decide the next action.
- Suggested regression: screenshot/text-size checks for operation helper text and save/load actions at 100/125/150%, ensuring enlarged setting affects those elements.

### P03-04 — P3 confirmed localization gap: English labels inside German flow

- Environment: German, 1280×720, 150%.
- Exact reproduction: buy train, create/assign line, inspect line summary; save and open Spiel laden.
- Expected: status/economic labels and generated default save names follow selected language.
- Actual DOM text: train selection contained “Zug 45 · idle”; line summary “Einnahmen 0 NOK · cost 0 NOK · result +0 NOK”; default save was “Norwegian Fjords company” and new-save input showed “Northern Line · Day 1”.
- Evidence: rendered DOM captured during live run; `load-menu.png` visibly shows English new-save input. Line cost/result text was observed via rendered text, not separately captured in a screenshot.
- Reproducibility: one observed instance of each, multiple UI locations. No gameplay block.
- Recommendation: localize generated names and route/status terms with the existing language choice.
- Suggested regression: German generated company name, train status, and route economic summary contain the intended German terms.

## Harness limits, errors, and cleanup

No application `pageerror` events were recorded (`ERRORS []`). Browser-console/network errors were not separately collected, so absence of all console/network errors is not claimed. Several tool locator failures came from initially treating a select as a button, CSS uppercase versus actual accessible names, the purchase button's aria-label differing from visible wording, and a transient initialization race after reload. They are harness corrections rather than established product failures. Clicking early during reload briefly returned to the campaign tab; waiting for initialization and retrying succeeded, without a repeated user-facing failure.

The first harness launch used a closed stdin pipe and could not accept commands after loading the menu. Its own Node PID 71011 and Chrome PID 71014 were terminated before the interactive run; no other browser was targeted. This is a disclosed deviation from the one-launch preference; only one P03 browser was active at a time, and no gameplay occurred in that first launch. The second harness used a fresh context and an explicit `finally` closing context and browser. Its final output was `ERRORS []` then `CLOSED`, process exit 0. The owned script and evidence are under `artifacts/swarm/`; no source/tests or server processes were modified. No delegation occurred.
