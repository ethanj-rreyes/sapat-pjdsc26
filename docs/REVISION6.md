# Revision 6: features to fix or show better (family app)

Status of each candidate. ✅ fixed · ⏸ waiting for usability-test data (reason written below).

| # | Item | Status | What changed / why |
|---|---|---|---|
| 1 | Meal variety is hidden | ✅ | **Palitan** now shows as a labeled button on every lunch and dinner card on Linggo (it used to be an icon only). The weekly balance shows as one row at the top of the menu: **Itlog · Karne · Isda · Gulay · Asukal**, green when fine and outlined in orange when it needs watching, with "2 dapat bantayan" beside the title. Tapping it opens all six rows, including variety (same ulam no more than 3 times). It moved out of **Higit pa**. |
| 1a | Swap on breakfast and merienda | dropped | The swap exchanges one main meal for another within the week. Breakfast (kanin at itlog) and merienda (fruit or root crops) are the same every day, so there is nothing to swap them with. Variety for those comes from the plan itself. |
| 2a | Cooking time on the dish card | ✅ | Each meal shows rough minutes on the stove in place of the old "umaga / tanghali" hint (for example *Tanghalian · 60 min*). Tonight's dish on Ngayon shows *Mga 60 minutong luto · mga ₱18 na gas*. Minutes come from the dish style (see table below), rounded to 5. |
| 2b | Gas cost per dish, added to the week | ✅ | Gas = minutes × 0.15 kg of LPG an hour × the tank price ÷ 11 kg. Linggo shows **+ mga ₱309 na gas** under the weekly budget; tapping it opens *Pagkain ₱1,218 + Gas ₱309 = Kabuuan ₱1,527*, how it's estimated, and the family's own tank price (default ₱1,300 for 11 kg, the October 2026 price). Each dish's breakdown (calculator icon) shows its gas. The gas is **not** taken out of the food budget, so it never changes the plan; the budget question asks about food. |
| 2c | Wood or charcoal | not modeled | Said in the gas sheet. Fuel use for wood and charcoal varies too much by stove to give a useful peso figure. |
| 3 | "Iba ang kinain?" has many options | ⏸ | Needs the usability test. It has 8 options today: the plan, something else cooked at home, karinderya, eating out, street food, baon, handaan/bigay, and hindi nakakain. Count whether testers who open it finish logging, and which options they pick. If they don't finish, the proposal is to show four groups first: **Sa bahay** (plan or something else), **Binili** (karinderya, eating out, street food), **Baon o bigay** (baon, handaan) and **Hindi nakakain**, each opening its few choices. No change made without data. |
| 4 | Entering your own market price | ✅ | One tap on the price in the Palengke list (now with a pencil) opens "Iba ang presyo sa palengke mo? Magkano ang bili mo kada kilo?". After saving, that row shows **✓ Sarili mo** under the price, and reopening shows your number filled in. "Nabili na? Ilagay ang binayaran" is one more tap inside the same sheet. |
| 5 | Babies under 1 | ✅ | Pressing − at 1 year now shows a note instead of doing nothing: breast milk only until 6 months; from 6 months soft first foods while breastfeeding continues; ask the BNS or health center; and, if the mother is breastfeeding, choose "Nagpapasuso" under her name so the plan gives her more food. The baby is not added to the plan. |
| 6 | "1 yrs" typo | ✅ | English shows **1 yr / 2 yrs**; Tagalog stays **1 taon**. Fixed in member cards, the person page, the member sheet and the new-profile setup. |
| 7 | Keep the safety lines | ✅ | The welcome disclaimer (medDisc) and the BNS notes (bnsFam on Pamilya, bnsMom on mothers' pages, bnsKid on under-5s' pages) are marked "SAFETY LINE (keep)" in the code, and the revision 6 test fails if any of them disappears, in Tagalog or English. |

Also fixed: the price tag on the last welcome slide had jumped to the top corner and covered **Laktawan**. The "Huling ginamit" label from revision 2 had reused its style name.

## Cooking minutes (rough)

| Dish | Minutes |
|---|---|
| Pagsaing (rice), at breakfast and dinner; lunch uses the morning rice | 20 (mais: 30) |
| Itlog at breakfast | +5 |
| Ginisang / ginataang monggo, monggo na may sabaw | 60 |
| Kare-kareng gulay / ginataang gulay na may mani | 45 / 30 |
| Tortang itlog, ginisang gulay | 15 |
| Tinolang manok | 45 |
| Sinigang na baboy / baka | 60 / 90 |
| Paksiw na isda, ginataang hipon o alimango | 25 |
| Merienda: nilagang kamote, gabi, patatas or saba | 25 (fruit: none) |

One burner, so rice and ulam add up. That's on the high side for a family with two burners. The 0.15 kg an hour mixes high heat and simmering; an 11-kg tank then lasts Tita Baby's family about four weeks.

## Screen height (400 × 860, Tita Baby)

| Tab | Revision 5 | Revision 6 |
|---|---|---|
| Ngayon | 1.22 | 1.23 |
| Linggo | 1.37 | **1.49** |
| Palengke | 1.41 | 1.37 |
| Pamilya | 1.17 | 1.17 |

Linggo grew because this revision asks for two things on it: the balance row (moved out of Higit pa) and the gas. The budget and today's first meal still show without scrolling. If testers find Linggo long, the first thing to fold is the one-sentence budget gap.

## Tests

`t7` (31 checks): Palitan on every lunch/dinner, balance row of 5 on the first screen and its sheet of 6, minutes on meal cards, gas line and total, doubling the tank price doubles the gas, gas never changes the plan, Sarili mo after one tap, baby note, "1 yr", and all four safety lines in both languages. Earlier tests (t1, t3–t6) still pass.

Source for the default LPG price: Daily Tribune, 22 Oct 2026, "Another LPG price hike looms in November" (about ₱1,300–1,400 a cylinder).
