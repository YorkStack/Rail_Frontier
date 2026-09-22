# P08 — returning player, saved companies

- Baseline served: coordinator's frozen build at `http://127.0.0.1:5190`; no application source or existing tests inspected or changed.
- Persona: returning regular player, German, 1440 × 900, browser default scale (100%). One fresh nonpersistent headless Chrome context, locale `de-DE`.
- Approximately 22 successful UI actions across six minutes, plus four harness locator mistakes. This is simulated agent testing, not human research.

## Achieved journey

1. From the initial menu chose **Neues Spiel → Freies Spiel**.
2. Paused and opened **Bahnhof bauen**. The default Sundvik preview said ready at 25,000 NOK. Confirmed construction through the visible button.
3. Cash settled from 5,000,000 NOK to **4,975,000 NOK**. The build confirmation identified the cost and advised connecting a marked track end.
4. Used **Spiel speichern**, opened **Spielmenü → Zum Hauptmenü**, and chose **Speichern & verlassen** in the explicit save-or-discard prompt.
5. Opened **Spiel laden**. A `Norwegian Fjords company` slot appeared. Typed `P08 Fjordbahn Original` into the new-save name field and clicked **Aktuelle Gesellschaft speichern**. The named slot appeared alongside the original slot.
6. Used **Umbenennen**, filled the inline name input, and clicked **Namen speichern**. The slot became `P08 Fjordbahn Archiv`.
7. Exported that slot using **Exportieren** and Playwright's normal download event. Saved the resulting own test file to `artifacts/swarm/evidence/p08/p08-own-save.json`.

The named-slot creation, rename and export all visibly succeeded. The menu confirmation before leaving clearly distinguished saving from discarding. The named-save field and creation action made it understandable that a new slot would be added. Existing slots offered continue/export/rename/delete.

## Observed invariants and evidence

- Inspected screenshot: `artifacts/swarm/evidence/p08/save-library.png`. It shows the renamed slot, original slot, export confirmation, and German menu at the stated viewport with no clipping.
- Inspected own downloaded JSON after the UI run ended: format `rail-frontier-save`, version 1, exported name `P08 Fjordbahn Archiv`, save schema 11. The saved company is `company:1`, cash `497500000` in minor currency units, and a single construction ledger debit of `2500000`, corresponding to 25,000 NOK. It contains Sundvik `station:7` and its two internal platform edges `edge:11`/`edge:12`.
- This demonstrates the export contains the constructed asset and expected balance. **It does not establish successful import or restored-state identity.**
- No commands, injected state, camera/time helpers, fixtures or probe helpers were used. All game mutations were normal visible UI interactions; JSON inspection was read-only evidence after export.

## Findings

### P08-F01 — P3 — German save library generates English default names

- Classification: confirmed localization polish issue, not data loss.
- Steps: German fresh menu → free play → build/save → main menu → Spiel laden.
- Expected: automatically generated save names and default proposed name follow the chosen language.
- Actual: saved slot is `Norwegian Fjords company`; proposed new name is `Northern Line · Day 1`, surrounded by German labels.
- Evidence: inspected `save-library.png`; accessible DOM read showed both names. The generated original slot persisted in the library throughout the naming/export workflow.
- Reproducibility: observed once in this fresh context; no second-context reproduction attempted.
- Recommendation/regression: localize generated fallback/company/day names; verify fresh German and English saves use the corresponding locale while user-entered names remain intact.

No P0/P1, confirmed data-loss, or core save failure was observed.

## Unreached stages and harness failure

Import, switching/new company, restoring the original slot, cross-reload identity, built interstation track, and pending track draft persistence were **not reached**. No claim is made about them.

After export, the harness incorrectly looked for a button named `Spielstand importieren` and started an unhandled `filechooser` wait. That wait timed out after 4.5 seconds and terminated the Node driver. The visible import control may be a label-backed file input; its failure was not established as an application bug. Earlier failed locator attempts used rendered uppercase instead of accessible names or `input[type=text]` instead of a default-type input; they were harness errors, not product findings.

The driver registered a page-error listener, but process termination prevented its final errors dump. Therefore browser JavaScript errors are **not reliably assessed** in this report.

## Cleanup

The driver included `context.close()` and `browser.close()` in `finally`, but the unhandled promise rejection exited before that block logged completion. A subsequent process inspection found no P08 driver or its Chrome tree; the only remaining headless Chrome belonged to the separate `p09-driver.mjs` process, which was left untouched. The P08 browser closed on driver exit. No second browser was launched. No server, application file, existing test, user profile or user save was changed. Own export/screenshot/driver are intentionally retained as evidence.
