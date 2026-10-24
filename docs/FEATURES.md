# Features and how each one addresses the problem

**Problem:** healthy food is priced out of reach for poor Filipino families. Price is the *exposure*, nutrient gaps are the *mechanism*, and anemia, stunting and diarrhea are the *outcomes*. Families end up *busog pero hindi sapat* (full but not nourished).

Each feature is tagged with the part of the problem it works on:
- **PRICE**: getting more nutrition per peso
- **GAP**: closing nutrient gaps for each person
- **HEALTH**: protecting against illness and harm
- **HABIT**: helping families change one buying or eating habit at a time
- **TRUST**: numbers people can understand and believe
- **REACH**: works for real Filipino households

## 1. Plan: Linggo
| Feature | What it does | Helps with |
|---|---|---|
| Least-cost plan per person (linear programming) | Picks the most nutritious week the budget can buy, using PSA prices, FNRI PhilFCT nutrients and PDRI 2015 needs for each member's age, sex and pregnancy or breastfeeding | PRICE, GAP |
| Protects the most vulnerable first | When money is short, children under 5 and pregnant or breastfeeding mothers are covered first, then other children, then adults | GAP, HEALTH |
| Food rules | Cereals at most 65% of energy, at least 35% of protein from animal foods or legumes, about 100 g of vegetables per 1,000 kcal, sugar under 5%, portion caps | HEALTH |
| Real Filipino dishes | The plan becomes named ulam (ginisang monggo, tinola, sinigang, paksiw, ginataan, kare-kare, torta), with cooking styles that rotate so meals don't repeat | HABIT, REACH |
| Swap dishes between days | Lunch and dinner can move across the week (one shopping list) | REACH |
| Budget control | Set the weekly budget, or pick Masikip / Katamtaman / Mas maluwag | PRICE |
| Honest budget gap | Shows what share of needs the budget can reach (e.g. 63%) and the cost of a fully healthy week (₱6,121); one tap explains where to ask for help (4Ps, Walang Gutom, iron-folic acid at the health center) | TRUST, HEALTH |
| Same money, two ways | Usual shopping vs SAPAT plan at the same budget (demo family: 46% vs 63% of needs) | HABIT, TRUST |
| Weekly balance | Per person, eaten plus still planned: eggs (about 1 a day max), pork and beef (about ½ kilo cooked a week max), fish days, vegetable days, sugar, dish variety | HEALTH, GAP |
| Price trend and local situation | Cost of a healthy day over 24 months; regional food share, below-threshold share, poverty | TRUST |

## 2. Shop: Palengke
| Feature | What it does | Helps with |
|---|---|---|
| One market list in selling units | Rounded up to what stalls sell: kilo fractions, pieces, tali, ulo (e.g. "10 tali kangkong", "1½ kilo karot, about 12 pieces") | REACH, TRUST |
| Price ranges, not exact pesos | Range = how the same food's price differs across the region's provinces this month (±8% to ±25%) | TRUST |
| Kitchen-unit breakdown | e.g. "₱X–Y per kilo · about ₱3 per cup of cooked rice"; galunggong per piece; egg per piece and dozen | TRUST (numeracy) |
| "Paano kinuwenta?" on every price | A small calculator icon opens the step-by-step math: source price, amount, multiplication, range rule, rounding | TRUST (numeracy) |
| Your market's price | Enter what you paid in the selling unit; saved per kilo or piece and used in the next plan | PRICE, TRUST |
| Price source shown | "Presyo sa Leyte, Set 2026 (PSA)"; estimated prices are labeled and never used for best-value advice | TRUST |
| Where you shop | Region → province → city → market; shows which levels have PSA prices | REACH |
| Bayong progress | The basket fills as items are ticked; the budget bar includes money spent eating out | HABIT |
| Cheapest for each need | Cheapest food this month for protein, iron, calcium and vitamin A | PRICE, GAP |

## 3. Eat: Ngayon
| Feature | What it does | Helps with |
|---|---|---|
| "Ano'ng ulam natin?" | One big card: tonight's ulam, its cost range for the family and per person, ingredients | REACH |
| Why it's good, and for whom | Plain-language body benefits ("Pampadugo, para kay Baby at sa mga bata") | GAP, HABIT |
| One-tap logging | "Kinain namin" logs the meal for everyone, split by the plan; undo on every action | REACH |
| "Iba ang kinain?" | Planned dish, cooked something else, karinderya, ate out, street food, baon, handaan or ayuda, or skipped; for the whole family or chosen members | REACH, GAP |
| Plate check for food from outside | Tap the food groups on the plate plus money spent; nutrients estimated and labeled "tantiya" | TRUST, GAP |
| Gentle coaching | No vegetables → add some next meal; skipped meal by a child or mother → small fallback meal | HEALTH, HABIT |
| One swap a week | One concrete, cheaper swap with at least as much protein (e.g. ½ kilo kasim → ½ kilo monggo, about ₱100 saved); respects the egg limit and each member's diet | PRICE, HABIT |
| One health note | The first thing worth acting on this week (e.g. "Isda: 0 sa 7 araw") or a food tip | HEALTH, HABIT |

## 4. Check: Pamilya
| Feature | What it does | Helps with |
|---|---|---|
| Kumusta ang pamilya | Each member with a word (Sapat / Halos sapat / Kulang pa), measured against what the plan should have reached by now | GAP, TRUST |
| Body view per person | Lakas, Paglaki, Dugo, Mata, Buto in words and bars; numbers tucked under "Ipakita ang mga numero" | GAP, TRUST |
| Cheapest fix for a gap | e.g. "Para sa buto: dagdagan ng ½ tasa (luto) ng petsay", with % of need and cost | GAP, PRICE |
| Household setup | Any age from 1 year up; pregnant or breastfeeding status; per-person diets (no pork, fish only, vegetarian, low sugar) | REACH, HEALTH |
| Pagkain bilang pantulong | 9 searchable, filterable guides (cough and colds, fever, diarrhea, anemia, morning sickness, constipation, eyes, study, bones) with foods and prices, preparation, why, evidence strength, and when to see a health worker | HEALTH, HABIT |

## 5. Whole app
| Feature | What it does | Helps with |
|---|---|---|
| Warm welcome | Launch splash and three screens: "Kumain ka na ba?", one list for the week, prices from the market | REACH |
| Filipino-first words | Tagalog and English; food and dish names stay Filipino, English adds a gloss; no scores out of 10, no alarm red | REACH, TRUST |
| Purposeful color | Green = healthy / do this; mango = money; coral = needs attention; sky = water and fish; indigo = evening | REACH |
| Motion with meaning | Steam on the pot, bayong filling, small celebration after a meal or a swap; respects "reduce motion" | HABIT |
| Runs on the phone | Solver runs in the browser in milliseconds; no server, no account, data stays on the phone | REACH, TRUST |
| Light and dark modes | For daytime and night use | REACH |

## 6. LGU dashboard
- **Food affordability map:** province heatmap of the cost of a healthy diet, 9 metrics, month slider, Watch/Alert levels, 24-month trends. Back-tested on the 2023 rice spike (8 of 17 regions flagged) and the Dec 2022 onion crisis (7). PRICE (early warning), REACH (targeting aid).
- **Feeding-program menu planner:** 5-day menu and supplier order for schools and communities. GAP, PRICE.

## 7. Known gaps
See `docs/SCENARIOS.md` and `docs/LIMITATIONS.md`.
