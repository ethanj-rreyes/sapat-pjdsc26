# Before every merge into `main`

Do these on the branch you're about to merge (for us, `updates`), after a fresh **Fetch / Pull**. It takes about 15 minutes. If any step fails, fix it on the branch first.

## 1. Tests (2 minutes)

From the repository folder (Node 18 or newer):

```bash
npm test
```

This runs three tests. All three must end with a pass line:

| Test | Must show |
|---|---|
| `tests/smoke_test.js` | `All checks passed` (data bundles load; the demo family's 63% vs 46% is reproduced) |
| `tests/parity_test.js` | `40 cases, 0 mismatches` (the browser solver agrees with the Python/HiGHS solver) |
| `tests/privacy_test.js` | `All checks passed` (no network calls, trackers, cookies or accounts; nothing loaded from other websites except Google Fonts) |

`npm test` stops at the first test that fails. To run one test on its own, use `node tests/parity_test.js` (or the smoke or privacy test).

## 2. Console open, no red errors (5 minutes)

1. Open the app with Live Server (or `npm start`).
2. Press **F12**, then open the **Console** tab, and clear it.
3. Press **Ctrl+Shift+R**.
4. Go through every screen: Ngayon, Linggo, Palengke, Pamilya. Open at least one sheet on each (a dish, the budget, a price, a family member).
5. Do the same on the LGU dashboard: Price alerts, Feeding program, How it works. Change the measure, sort the table, and download CSV and Excel.

The console must show **no red lines**. Yellow warnings are worth a look but don't block the merge.

## 3. Both languages, both themes (3 minutes)

| | Light | Dark |
|---|---|---|
| **TL** | ☐ | ☐ |
| **EN** | ☐ | ☐ |

- Family app: use the TL/EN switch and the sun/moon button at the top.
- LGU dashboard: it is English only by design (for officials); check light and dark with its sun/moon button.
- Look for text that overlaps, is cut off or runs off the screen, and for any word left in the wrong language.
- At least once, use the phone size in DevTools (**Ctrl+Shift+M**, 360 px wide).

## 4. The low-end Android phone (5 minutes)

On the actual phone, not DevTools:

1. Open the app from a fresh tab, so it loads anew.
2. Count roughly how many seconds until the welcome screen appears.
3. Choose the sample family and check that the plan appears. Switch all four tabs.
4. Tap one meal, one price and one family member.
5. Rotate the phone once.

Write down the phone model, Android and Chrome versions, and the seconds to the welcome screen. Anything that freezes, overlaps or is too small to tap blocks the merge.

## 5. Nothing new leaves the phone

- `tests/privacy_test.js` (step 1) checks the code.
- To also check by watching: on the phone or with DevTools, open **Network**, reload, and use the app. The only outside requests should be `fonts.googleapis.com` and `fonts.gstatic.com`. Everything else must come from the app's own folder.
- No accounts, sign-in, tracking or cookies. Settings stay in the browser's own storage on the device (keys starting with `sapat`).

If a change truly needs a new outside service, it is a team decision. Add the host to `ALLOWED_HOSTS` in `tests/privacy_test.js` in the same commit and say why in the commit message.

## 6. One line in the commit message

The first line says **what changed and why**, in plain words, for example:

```
LGU dashboard opens with one sentence per province on Alert, so officers see what needs attention in under a minute
```

Not `update 7`. If needed, more detail can go in the lines below it.
