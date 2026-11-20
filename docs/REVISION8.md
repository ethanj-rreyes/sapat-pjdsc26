# Revision 8: housekeeping before every merge

The checklist now lives in [MERGE_CHECKLIST.md](MERGE_CHECKLIST.md). GitHub also shows it as a pull-request template (`docs/pull_request_template.md`), so it appears every time someone opens a pull request into `main`. Below are the results of the first full run, on branch `updates` after "update 7" (20 Nov 2026).

| Check | Result |
|---|---|
| `node tests/parity_test.js` | ✅ **40 of 40 cases match** (0 mismatches; worst objective difference 0.00113%; mean solve 2.9 ms) |
| `node tests/smoke_test.js` | ✅ All 9 checks pass (demo family 63% vs 46%; plan within budget; solved in 17 ms) |
| `node tests/privacy_test.js` (new) | ✅ 6 checks pass across 40 files. No `fetch`, XMLHttpRequest, sendBeacon, WebSocket or service worker; nothing loaded from other websites except Google Fonts; no analytics, cookies, sign-in or forms. It was checked against a planted `fetch`, cookie, outside script and tracking pixel, and failed on each as it should. Now part of `npm test`. |
| Console, both apps, every screen | ✅ No red errors, page errors or failed requests, and no warnings. This was done in a headless browser, opening a sheet on each family tab, plus the dashboard's measures, table, region filter, Excel download and all three tabs. |
| TL and EN, light and dark | ✅ All four combinations of the family app, and the dashboard in light and dark. **One bug found and fixed:** on Pamilya in English, the "Household" heading ran into its label "of what the budget can buy". The label now wraps to the right, and a heading is never narrower than its longest word (`styles.css`, `.head`). |
| Low-end Android | ⏸ Needs the real phone; the steps are in the checklist. A stand-in run used a Moto G4 screen, a CPU slowed 6×, and slow 4G (150 ms, 1.6 Mbps); results are below. |
| Nothing new leaves the phone | ✅ While both apps were used, the only outside host contacted was `fonts.googleapis.com` (and `fonts.gstatic.com` for the font files). This is the same as before; revision 7 added one more typeface from the same service. There are no accounts and no tracking. Settings stay in the browser's own storage under `sapatm3:`, `sapatw2:`, `sapat:` and `sapat-lgu7:`. |
| One line in the commit message | Template and example in the checklist. |

## Low-end phone stand-in (Moto G4 screen, CPU 6× slower, slow 4G)

| | Family app | LGU dashboard |
|---|---|---|
| Download, served compressed (`npm start`) | 0.81 MB | 0.89 MB |
| First screen, compressed | **5.5 s** to the welcome screen | **6.0 s** to the answer |
| Download, uncompressed (`python -m http.server`, Live Server) | 3.3 MB | 3.7 MB |
| First screen, uncompressed | 17.9 s | 20.1 s |
| First plan after choosing the family | 0.21 s | n/a |
| Switching tabs | 0.2–0.45 s | changing the measure: 0.37 s |
| Memory (JS heap) | 17 MB | 15 MB |

The data bundles are big as plain text but shrink about 5× when the server compresses them. `npm start` (serve) does this; Live Server and `python -m http.server` don't. **For testing on the phone, and for any public link, serve the apps compressed** (`npm start`, GitHub Pages and Netlify all do). After the first visit, the browser keeps the files.

## Not changed

- The engine and data (`web/shared/`) are untouched since the start, which is why parity and smoke give the same results as on 24 Oct.
- The LGU dashboard stays English only, as designed for officials, so the TL check applies to the family app.
