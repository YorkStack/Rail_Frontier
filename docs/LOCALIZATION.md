# Languages and translation packs

Rail Frontier ships German and English. Settings → Language changes the interface immediately and saves the preference locally. A first visit uses the browser language, with English as the fallback; `?lang=de` and `?lang=en` override it for a visit. Language belongs to presentation preferences, not the company save.

## Add a language

1. Copy `src/i18n/locales/en.json` to a new file, such as `fr.json`.
2. Set `code` to `fr`, `name` to the native language name, `locale` to an Intl locale such as `fr-FR`, and `direction` to `ltr` or `rtl`.
3. Translate **message values only**. Preserve keys and every `{placeholder}` name. Do not translate identifiers, model names, company names entered by players, or save data.
4. Import the file in `src/i18n/index.ts` and add it to `languages`: `{en,de,fr}`. The language type, browser-locale resolver and settings options derive from this registry; no new language-specific UI branches are needed.
5. Run `npm run check`, `npm test`, and the localization browser test. Check the menu, station planner, drawn-route prices, tutorial, train office and exit dialog at 100% and 150% UI size.

English supplies missing messages at runtime. The catalogue test requires complete shipped packs and identical interpolation parameters, so unfinished translations do not silently ship. Unknown source messages remain readable in English. Technical diagnostics and unclassified engine/storage errors can still use this fallback. Non-Latin fonts and a fully mirrored RTL layout require a separate visual acceptance pass; `direction` metadata alone is not a claim of tested RTL support.

## Write interface copy

`translate(key, parameters)` returns plain text. Use stable semantic keys for new features; existing vanilla-DOM messages retain their English source as a key to avoid changing simulation/save contracts. Static labels may use `data-i18n="key"`. Existing `data-ui-copy` hooks resolve the `ui.*` catalogue entries.

For plural messages, supply `key.one`, `key.other` and any additional categories required by the target language. Pass a numeric `count`; `Intl.PluralRules` selects the form. Numeric interpolation, `number`, `currency` and `date` use the selected locale. Currency inputs remain integer minor units, and Norway remains denominated in NOK regardless of interface language.

The shell's `setText`, `setHtml` and `setAttribute` helpers localize authored English messages at the DOM boundary. They remember the source text so switching back to English works, including accessible names. The source adapter also handles legacy interpolated sentences and middle-dot separated labels. It has a bounded lookup cache. New dynamic components should render semantic messages again when the language changes, rather than assembling translated sentence fragments.

`setHtml` is for trusted application templates, not player input. Translations become text nodes; they are not evaluated as HTML. Use text nodes for player names and mark them `data-no-translate`. The archive preserves names exactly. Simulation errors remain language-neutral source messages and are translated only when presented. The developer diagnostics block is deliberately excluded.

## Acceptance

`tests/i18n.test.ts` checks key/placeholder parity, locale fallback, plural forms, formatting and switching. `tests/browser/localization-exit.spec.ts` changes German to English during a paused real introduction, preserves the company and selected station class, and exercises cancellation, a rejected IndexedDB write, save-and-leave and reload. Existing construction tests verify real cash using the numeric quote, independently of localized separators.

No translation service, network request or additional runtime dependency is required.
