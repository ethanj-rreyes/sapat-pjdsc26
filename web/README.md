# web/: the SAPAT apps

Static HTML, CSS and JavaScript. No build step, no server code, no account. The linear-programming solver runs in the browser.

| Folder | For | Open |
|---|---|---|
| `family-app/` | Families (the main prototype). On a laptop it shows inside a phone frame; on a phone it fills the screen. | `family-app/index.html` |
| `lgu-dashboard/` | LGU nutrition offices, health officers and dietitians: which provinces need attention this month and why, map and sortable table, CSV/Excel download, one-page province summary, feeding-program menu | `lgu-dashboard/index.html` |
| `shared/` | Code and data both apps load: `sapat-engine.js` (model and solver), `sapat-ui.js` (words, icons, units), `data/` (generated bundles) | — |

## Run

- **Double-click** `family-app/index.html` or `lgu-dashboard/index.html`. They work straight from the file in Chrome, Edge or Firefox.
- **VS Code:** install *Live Server*, right-click an `index.html` → *Open with Live Server*.
- **Terminal (from the repository root):** `npm start` (serves `web/` at http://localhost:5500), or `python -m http.server 5500 --directory web`.

To see the family app at phone size on a laptop: F12 → device toolbar (Ctrl+Shift+M).

## Family app: where things are

The family app's code is split into small files under `family-app/js/`, one job each. The full map and load order are in [family-app/js/README.md](family-app/js/README.md).

| To change | File · name |
|---|---|
| Screens: Ngayon, Linggo, Palengke, Pamilya | `js/screens/today.js`, `week.js`, `shop.js`, `family.js` |
| Words (Tagalog/English) | `js/words.js` · `W2`; shared words in `shared/sapat-ui.js` · `W` |
| Colors, type, spacing | `family-app/styles.css` · `:root` tokens (the "color pass" block sets the final palette) |
| Selling units (kilo, tali, piraso) | `shared/sapat-ui.js` · `buyUnits`, `PCS` |
| Price ranges and their breakdown | `js/prices.js` · `spreadOf`, `pRange`, `explainFood`, `explainList` |
| Weekly balance limits | `js/features/balance.js` · `weekBalance`, `balanceRows` |
| Health guides, swaps | `js/features/guide.js` · `GUIDE`; `js/features/swap.js` · `SWAPS` |
| Eating out ("Iba ang kinain?") | `js/sheets/eat-out.js` · `openOther`, `openPlate`, `saveOut` |
| The model | `shared/sapat-engine.js` · `solvePlan`, `memberNeeds`, `foodTable` |

State is saved in the browser's `localStorage` under the prefix `sapatm3:`. To reset, clear site data in DevTools.

## LGU dashboard: where things are

Split into ordered scripts under `lgu-dashboard/js/` (loaded by `index.html`; no build). See [docs/REVISION7.md](../docs/REVISION7.md).

| To change | File · name |
|---|---|
| Words of the answer sentences, the "why" line | `js/areas.js` · `sentence`, `why` |
| What to do at each level | `js/areas.js` · `ACTIONS` |
| Alert thresholds (must match the data pipeline) and the back-test | `js/areas.js` · `RULE`, `BACKTEST` |
| Measures on the map and table (3 up front, the rest under "More measures") | `js/areas.js` · `MEASURES` (`main: true` = up front) |
| Map, table, chosen-area panel | `js/situation.js` · `drawMap`/`paintMap`, `renderTable`, `renderDetail` |
| CSV, Excel, printing | `js/export.js` · `exportTable`, `downloadXlsx`, `printSummary` |
| Colours (status, map ramps, dark mode) | `lgu-dashboard/dashboard.css` · `:root` tokens |

Dashboard settings are saved in the browser's `localStorage` under the prefix `sapat-lgu7:`.

