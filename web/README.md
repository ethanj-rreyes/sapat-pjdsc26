# web/: the SAPAT apps

Static HTML, CSS and JavaScript. No build step, no server code, no account. The linear-programming solver runs in the browser.

| Folder | For | Open |
|---|---|---|
| `family-app/` | Families (the main prototype). On a laptop it shows inside a phone frame; on a phone it fills the screen. | `family-app/index.html` |
| `lgu-dashboard/` | LGU nutrition offices and feeding programs: province map of the cost of a healthy diet, Watch/Alert levels, feeding-program menu | `lgu-dashboard/index.html` |
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
