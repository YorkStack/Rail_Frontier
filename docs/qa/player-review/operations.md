# First-play review: train operations and return to play

Reviewed 2026-09-22 against http://127.0.0.1:5174, the preview identified by the coordinator as baseline ed66975. Fresh isolated Chromium 1223 context, 1440 × 1000, English selected through Settings. No application source or existing tests were read before or during the playthrough. All state-changing actions used visible controls. No application code, builds, or global tests changed.

## Journey exercised

1. Settings → Language English → Campaign → Construction school → Try track drawing.
2. From: Sundvik → To: Granli → wait for checked alignment → Build for NOK 524,165. The recommended direct route succeeded.
3. Trains & lines → Buy this train (default Nord 2-6-0, two coaches, NOK 180,000). Exactly one train was purchased. Sundvik and Granli were prefilled as ordered stops.
4. Create route → Assign service → Follow this train → manually choose 1×, then 8×.
5. Save game → Game menu → Return to main menu → Save & leave → Load game → first Resume.
6. Reopen Trains & lines, resume using practice banner, continue simulation through passenger deliveries and positive company result.

## OPS-01 · P2 · Office claims service is running while time remains paused

**Steps:** Perform steps 1–4 through Assign service while practice time is paused. Click Follow this train.

**Expected:** Assignment is described as ready/assigned until time resumes, and the next action clearly resumes time or explains the pause.

**Actual:** Assignment reports “Your service is running,” “Service is now running,” and “Travelling to Granli,” while the persistent time control says PAUSED. Follow this train closes the office and focuses the train, but leaves it at 0 km/h and 0 km with no resume instruction. Clicking 1× subsequently moved the train (41 km/h observed), confirming a guidance mismatch rather than failed route operation.

**Evidence:** artifacts/player-review/operations/03-assigned-paused.png and 04-follow-still-paused.png.

The separate construction-practice banner already supplies a Resume and follow train action. The reported problem is specifically the office assignment/follow path.

**Regression outline:** UI-create the first practice service while paused; assert no implicit time start during purchase or assignment; assert assigned/paused wording and an explicit resume CTA; activate that CTA; assert running time and nonzero train movement after observation.

## OPS-02 · P2 · Loading an assigned service resets office guidance to buying another train

**Steps:** Set up the service, run it, then Game menu → Return to main menu → Save & leave → Load game → Resume. Open Trains & lines.

**Expected:** The office recognizes the existing train and route, shows the completed setup/current service, and offers resume/follow as appropriate.

**Actual:** The train and route survive and are listed (train 45 running, route 47 with one train). However the guidance highlights “1 · BUILD YOUR TRAIN CURRENT” and tells the player to choose a connected station and buy the recommended train. The service section contains disabled Assign service and no office follow action. This remains the office state after time resumes and even after first passenger delivery. A new player following the current step is pointed toward an unnecessary second purchase.

**Evidence:** artifacts/player-review/operations/07-resumed-workflow-reset.png and .txt. The same erroneous current step remains visible in 08-passenger-summary.png.

**Regression outline:** In a fresh browser context, UI-create one train and one assigned route; Save & leave; Resume from Load game; open office. Assert train/route counts remain one, step 1 is not current, saved train/route are selected, completed-service guidance and explicit paused resume/follow CTA are shown. Activate it, confirm movement, and assert no extra consist was purchased. Repeat using a full page reload then Continue latest to cover loss of transient UI selection IDs.

## OPS-03 · P3 · Passenger cargo is repeated by batch instead of summarized

**Steps:** Continue the two-stop passenger service at 8× until passengers board. Open Trains & lines and inspect the train card.

**Expected:** A compact occupancy summary, for example “84 passengers · 48 mail” (ideally 84/96 seats), with batch/destination detail only if useful.

**Actual:** The card displays “14 passengers” six times, then “48 mail.” Earlier it displayed four “21 passengers” entries plus “12 passengers.” The repeated categories consume several lines and make the player total them manually. “2 coachs” also appears instead of “2 coaches.”

**Evidence:** artifacts/player-review/operations/08-passenger-summary.png and .txt.

## Passed journeys

- Direct practice track planning, cost comparison, validation, and construction succeeded.
- The default locomotive plus two coaches was purchased once; platform-fit and budget feedback appeared.
- Guide advanced from purchase to stops to assignment without additional purchases before saving.
- The two prepared stops were automatically present; creating a shuttle and assigning it succeeded.
- Manual 1× and 8× controls moved the train. Shuttle service later carried passengers and earned revenue.
- First passengers delivered guidance appeared; operations report became available. NOK 6,480 revenue and +NOK 395 company operating result were observed by the final screenshot.
- Game menu paused time. Return to main menu supplied clear Save & leave / Leave without saving / Keep playing choices.
- Save & leave and explicit Resume preserved the track, one consist, one assigned route, and in-progress service. Paused return was explicit in the speed control and practice banner.
- The practice banner Resume and follow train action resumed at 1× successfully.

## Smaller observations and limits

- Quick-save feedback reads “Study saved at tick 18,416,” a technical confirmation without a save name; not treated as a separate blocker.
- The save archive named the practice company “Norwegian Fjords company”; with only one company there was no demonstrated selection failure.
- Fresh default language was German, changed through a working language select.
- This review covered the first construction exercise and passenger shuttle, not freight, loops, multiple trains, renaming, import/export, mobile, or keyboard-only operation.
- Full browser reload restoration is proposed above but was not performed; explicit Save & leave / Load game / Resume was exercised.
- Two short Playwright action/screenshot timeouts occurred during rapid 8× updates; a real pointer click at the visible Pause control worked and subsequent capture succeeded. No product-level freeze was established.
