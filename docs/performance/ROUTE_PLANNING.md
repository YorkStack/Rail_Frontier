# Route-planning responsiveness, September 21, 2026

The candidate search already used a worker. Its results were then synchronously re-quoted on live terrain, ranked, and quoted again for obstacle markers and the chosen preview. That final main-thread task produced visible pauses under CPU throttling.

Live revalidation now yields between candidates after an approximately 8 ms work slice. It also yields before starting so the cost-check status and input can be processed. A candidate is still checked atomically, so this is a scheduling target, not a hard per-task bound. Selection reuses the engineering profiles computed during certification. The selected preview and its obstacle markers reuse that revision-bound live quote. Construction still revalidates authoritatively at commit.

## Measurements

Fixed test build, installed Chrome in headless mode, 1440×900, Node v25.8.0, three fresh contexts per lesson. CDP applies fourfold CPU throttling after loading the world; this does not model an actual slower device or throttle all GPU/worker work equally. Baseline: `15db4a5`. Values are rounded milliseconds.

| Exercise | Median ready time, before → after | Median first subsequent frame, before → after | Worst frame gap, before → after | Longest observed main-thread task, before → after |
| --- | --- | --- | --- | --- |
| Valley | 472 → 697 | 501 → 718 | 300 → 67 | 273 → none ≥50 ms |
| Highland | 300 → 375 | 350 → 419 | 200 → 67 | 159 → none ≥50 ms |

The tradeoff is deliberate: input and painting get time during validation, while the complete result takes longer. Every run returned the same number of choices (two in the valley, three in the highland). Unit comparisons independently verify unchanged exact prices and geometry. [Recorded runs](planning-responsiveness.json) contain the detailed values.

Ready time starts on the destination button click and ends when the Build button becomes enabled. Frame measurements include the first animation frame whose timestamp follows completion, so the final result-processing pause is not accidentally omitted. Long tasks are collected through the following frame. This is a small repeatable experiment, not browser p95 acceptance; it does not measure freehand pointer-to-paint delay, GPU stress, every route shape or mobile hardware.

## Reproduce

Use two terminals, with no build running during measurement:

```sh
npm run build:test
npm run preview -- --port 5174
```

```sh
CPU_RATE=4 RAIL_FRONTIER_URL=http://127.0.0.1:5174 npx tsx tools/measure-planning-browser.ts artifacts/planning-browser.json
```

Omit `CPU_RATE` for normal-speed measurements. A normal production build intentionally omits the test probe. The existing `tools/benchmark-route-planning.ts` measures only solver plus quote work in Node and is not interchangeable with this browser measurement.

## Cancellation and remaining work

Every resumed slice checks the request identity, railway revision, terrain revision and track class. Editing, restarting, closing the tool, switching company or timing out invalidates unfinished work. No partial choice list is published. The status remains busy and Build stays disabled until a complete current result is ready. A Chrome regression test queues Restart during live cost validation, checks that no stale result or money change survives, then successfully plans again.

Next: longer and denser freehand strokes, held-key edits, complete pointer-to-paint measurements, and broader device/accessibility coverage. The eight-second worker timeout and incomplete adaptive longitudinal subdivision remain known limits; DRAW acceptance is still open.


## Held keys and long strokes, September 22

A held arrow gesture now updates the drawing immediately but commits history and dispatches planning only when the last held arrow is released or focus moves to another control. Escape/window blur cancels it. Save captures the preceding committed draft. Pointer movement keeps accepted samples while coalescing adapter/DOM updates to animation frames; terrain picking is reused within the event. A stroke that exceeds the sample cap is cancelled rather than silently truncated. Keyboard edits beyond the world boundary use a clamped height query while preserving the actual out-of-map coordinates for diagnosis.

Fixed-build Chrome 153, 1440×900, one before/after run on the same machine, without CPU throttling. Twenty repeated ArrowRight keydowns caused **20 planning requests before, zero while held and one after release now**. One Undo restores the complete gesture. A real 160-event mouse stroke measured **75.1 → 40.0 ms p95** and **76.4 → 41.3 ms maximum** from a pointer event to a nested second animation-frame callback. This is an approximate following-frame delay, not measured presentation latency, INP or statistical device acceptance. The input comparison precedes this checkpoint's scenery changes. [Raw measurements](route-input.json).

Reproduce against a fixed test build with `RAIL_FRONTIER_URL=http://127.0.0.1:5174 npx tsx tools/measure-route-input.ts`. Browser regressions cover held/released keys, simultaneous keys, Escape, focus changes, map-boundary cancellation, pointer drawing, real construction and saved draft history. Remaining work includes physical-device testing, complete presentation latency and unassisted player acceptance.
