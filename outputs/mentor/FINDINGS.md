# Mentor follow-up analyses (16 Nov 2026)

Answers three of Jasper Catapang's comments (PJDSC advanced workshop, 14 Nov 2026) with new runs of the SAPAT engine.
All numbers: Sep 2026 PSA prices, PDRI 2015 needs, adequacy capped at 100%, team computation.

| Script | Output |
|---|---|
| `scripts/mentor_a_per_nutrient.py` | `a_member_nutrient_h1.csv`, `a_member_nutrient_titababy.csv`, `a_plan_variety_h1.csv`, `a_titababy_*.csv`, `fig_a_*.png` |
| `scripts/mentor_b_price_sensitivity.py` | `b_price_sensitivity.csv`, `fig_b_price_sensitivity.png` |
| `scripts/mentor_c_alert_false_alarms.py` | `c_alert_false_alarms.csv`, `c_alert_episodes.csv`, `fig_c_alert_thresholds.png` |
| `scripts/mentor_charts.py` | the four `fig_*.png` |

Run from the repo root in this order (A before B: B imports the Tita Baby family from A). `province_index_from_dashboard.csv` is the
83 province series exported from `web/lgu-dashboard/data/ph_provinces.js`.

---

## A. Results per nutrient and per person
*Comment: "An average adequacy score can hide serious gaps … whether the 3-year-old meets their iron needs."*

**Reference family, poorest 10%, average of 17 regions (share of need met):**

| | Energy | Protein | Iron | Vitamin A | Calcium |
|---|---|---|---|---|---|
| Father | 71 → 66 | 58 → 64 | 46 → 61 | 12 → 53 | 21 → 25 |
| Mother | 71 → 72 | 52 → 60 | 15 → **21** | 10 → 60 | 16 → **21** |
| Child 10 | 71 → 84 | 74 → 95 | 22 → **38** | 13 → 82 | 13 → **22** |
| Child 7 | 71 → 84 | 91 → 100 | 36 → 61 | 13 → 87 | 15 → **27** |
| Child 3 | 71 → 90 | 98 → 100 | 32 → 64 | 11 → 86 | 15 → **38** |

(usual spending → SAPAT plan; bold = still below half)

- **The 3-year-old's iron goes from 32% to 64% of need, but reaches 100% in none of the 51 region-income cases.**
- Member-nutrient pairs below half of need: **61% → 30%**. Pairs at 90% or more: 7% → 15%.
- The biggest gain is **vitamin A (12% → 74%)**. The gap that remains is **calcium (16% → 27%)** for everyone, and iron for the mother and the 10-year-old girl.
- The father's energy goes down (71% → 66%) because the budget mode shifts food to the children. That is a trade-off, and you should say so.

**Tita Baby's family, Leyte, ₱1,290 a week** (`fig_a_titababy_per_person.png`): average 48% → 65%.
- Ana (1): iron 32% → 60%, vitamin A 8% → 85%, calcium 14% → 46%.
- Baby (pregnant): iron 16% → **23%**, calcium 21% → 32%.

**Why mothers gain least (slide 7 vs slide 14):**
1. In the H1 reference family the mother is **not pregnant**. The model gives her adult priority (1), not the "protect first" priority (3). Only pregnant or breastfeeding women and children under 5 get priority 3.
2. Women 13–49 need 28 mg of iron a day (38 mg in pregnancy). The PDRI itself says food alone cannot meet this. The model therefore down-weights that gap (weight 0.1) instead of spending the whole budget on it, and SAPAT refers her to iron-folic acid at the health center.

So slide 7's claim is true for *pregnant* mothers in energy, protein and vitamin A. It is not true for iron, and not for a non-pregnant mother.

**Variety** (`a_plan_variety_h1.csv`; comment 2):
- At the poorest-10% budget, a week's plan uses about 10 foods from 5–7 food groups.
- Three foods, usually **rice, monggo and carrot, take 74% of the pesos** (range 58–90%).
- Tita Baby's list has 13 foods, no fish or meat, and about 3 eggs a week. Jasper's point stands.
- What adds variety is the app's dish rotation and the weekly balance check, not the optimizer.
- Cooking fuel is not modeled. Monggo needs long cooking, so fuel cost is a real limitation to state.

## B. Sensitivity to price errors
*Comment: "Test how sensitive the plans are to price errors (PSA vs WFP differ by about 10.7%)."*

**Method:**
- Each food's price was multiplied by a random error drawn from the 28,937 real PSA-vs-WFP gaps (centred, sd 0.166).
- Each food got its own independent draw, which is stricter than real life.
- 200 runs × 17 regions = 3,400 runs at the poorest-10% budget, plus all prices −10%, +10% and +20%.

**Results** (`fig_b_price_sensitivity.png`):
- **SAPAT beats usual spending in 3,400 of 3,400 runs.** Median gain +22 points (middle 90%: +15 to +30).
- SAPAT adequacy stays between 56% and 70% (middle 90%). The 3-year-old stays between 70% and 85%.
- The shopping list is fairly stable: in the median run, 89% of the pesos go to the same foods (worst 5%: under 47%).
- The cost of a fully healthy week moves only −7% to +5%, because the errors partly cancel out across foods.
- If all prices are 20% higher (e.g., buying at a sari-sari store or supermarket), adequacy falls 62% → 56%, but the gain over usual spending stays at +22 points.
- Tita Baby: 62–68% across runs (baseline 65%).

## C. Alert false alarms
*Comment: "The alert thresholds (5% and 10%) seem chosen by hand … how often would they raise false alarms?"*

**Definition:** an alarm is *false* if the rise reverses within 2 months, meaning the cost is no longer 5% above the average the alert was measured against. Runs of consecutive alert months count as one episode.

**Data:** the 83 province series behind the LGU dashboard, Jan 2018–Sep 2026. Region-level results are in the same CSV.

| Level (current rule) | Episodes | Short-lived | False alarms per province per year |
|---|---|---|---|
| Watch (≥ 5% vs 3-month average) | 550 | 42% | **0.32** (about 1 every 3 years) |
| Alert (≥ 10%, or ≥ 15% vs last year) | 200 | 41% | **0.11** (about 1 every 9 years) |

- More than half of the short-lived alerts (47 of 81 at province level, 10 of 16 at region level) come from one episode: the **early-2021 price surge**. That surge was real, but it eased within weeks after the government's pork and chicken price ceiling and supply measures (EO 124, Feb 2021). Without it, about **1 in 4** alerts reverses on its own.
- **Threshold sweep** (`fig_c_alert_thresholds.png`): at 3% the rule flags 53 of 83 provinces in the 2023 rice spike but gives 0.72 false alarms per province per year. At 10%, false alarms drop to 0.07, but only 23 provinces are flagged. At 15%, nothing is caught.
- So the two-step design is reasonable: **Watch at 5% catches crises early** (39 provinces in the rice spike, 31 in the onion crisis), and **Alert at 10% is rarely wrong**.
- Still to do: calibrate the thresholds with LGU nutrition officers in the pilot.

---

## Slide-ready lines
- **Slide 13:** "On paper, the same pesos meet 62% of needs instead of 41%. Our pilot tests whether families cook it. The gain holds in all 3,400 runs with price errors as large as PSA vs WFP."
- **Slide 13/14:** "Gaps that remain: calcium for everyone (about 27%), and iron for mothers (21%). The 3-year-old's iron doubles (32% → 64%) but still falls short."
- **Slide 7:** "Under-5s and pregnant mothers get priority. Pregnancy iron (38 mg/day) can't come from food alone, so SAPAT refers her to the health center."
- **Slide 15:** "Back-tested 2018–2026: about 1 false alert per province every 9 years; watch-level signals caught 39 provinces in the 2023 rice spike."

## Notes and caveats
- These runs use the Python reference engine. The app's own figures for Tita Baby differ slightly: the app shows 46% → 63% and ₱6,121 for a healthy week, while the engine gives 48% → 65% and ₱5,854. The app adds its own dish rules and price fallbacks. Quote one source consistently.
- "Short-lived" does not mean "not real". It means an LGU acting on it would have found prices already falling.
