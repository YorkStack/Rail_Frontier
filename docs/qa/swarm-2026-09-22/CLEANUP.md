# Resource cleanup audit

2026-09-22. Requested scope: stop test browsers/sessions/services and the project development server; retain useful reports/evidence and do not touch unrelated apps.

- All eighteen role reports confirm browser closure. P08 lost its driver on an unhandled harness promise; its process tree was subsequently inspected and absent. Other role browsers closed in finally. Reused roles created fresh browsers only after the prior role closed.
- Coordinator responsiveness browser closed in finally, script completed without errors.
- Frozen baseline preview 5190: verified PID 70533 pointed to this repository's `vite preview --outDir artifacts/swarm/site`, then sent SIGTERM. Port 5190 confirmed no listener afterwards.
- Old devserver 5173: verified PID 6641 was this repository's Vite process, child of npm PID 6620, then sent SIGTERM as requested. Final audit confirms both Vite and npm parent exited.
- Acceptance uses one automatically managed Chrome worker and private 5180 preview. Completed; its preview and Chrome worker exited automatically after both the broad sweep and focused follow-up.

No user browser profile or unrelated app/service has been closed. A browser tab already displaying a cached game can still exist; closing user-owned tabs was not part of the test-session cleanup. Build/report files do not consume background CPU/GPU. Temporary builds `artifacts/swarm/site` and `artifacts/acceptance/site` were removed; evidence and test reports retained.

Final audit: 2026-09-22T12:29:51.843211+02:00. No listeners on 5173/5180/5190; no project Vite/Playwright/role driver processes; no headless Chrome processes. Raw local audit: `artifacts/swarm/processes-after.json`. Existing Codex/ChatGPT tool runtimes and user-owned apps remain untouched. No power/CPU benchmark claim is made. To play again, start `npm run dev -- --host 127.0.0.1`.
