# SAPAT optimization model

The same model is implemented twice: `sapat/model.py` (reference, solved with HiGHS via `scipy.optimize.linprog`) and `web/shared/sapat-engine.js` (a bounded-variable primal simplex written for the browser). `tests/parity_test.js` re-solves 40 random cases from `tests/cases.json` in JavaScript; objective values agree to within 0.001% and full-mode costs exactly. In budget mode the two solvers can return different plans with the same objective value (ties), so coverage can differ by a few points between them.

## Data per food *j* (region *r*, month *t*)

- `p[j]`: price per gram as purchased (PSA retail price ÷ unit weight). Eggs use 55 g (chicken) and 70 g (duck) per piece; coconuts are calibrated at about 1,000 g per nut against WFP per-kg prices.
- `a[j,k]`: nutrient *k* per gram as purchased = PhilFCT value per 100 g edible portion × edible portion % ÷ 10,000. The edible-portion term keeps bony fish and bone-in meat from looking cheaper than they are.
- `cap[j]`: largest daily amount per 1,000 kcal of the member's energy need (`sapat/foods.py`).

## Needs per member *m*

`R[m,k]` from PDRI 2015 RENI/RNI for energy, protein, iron, vitamin A and calcium by age group and sex, plus the PDRI additions for pregnancy (+300 kcal, +27 g protein, +10 mg iron, +300 µg vitamin A, +50 mg calcium) and lactation (+500 kcal, +27 g, +2 mg, +400 µg). Iron needs the PDRI marks as not met by usual diet alone (women 13–49, pregnancy) are flagged and given a lower penalty weight (0.1).

## Variables

- `x[m,j] ≥ 0`, ≤ `cap[j] × E[m] / 1000`: grams per day of food *j* for member *m*
- `s[m,k,t]`: shortfall of need *k* as a fraction, in three tiers of width 0.15, 0.25 and 0.60 (total ≤ 1)
- `v[m,t]`: vegetable shortfall, same tiers

## Constraints (each member)

| Rule | Formula |
|---|---|
| Meet each need or record the gap | Σ_j a[j,k] x[m,j] + R[m,k] Σ_t s[m,k,t] ≥ R[m,k] |
| Energy at most 110% | Σ_j e[j] x[m,j] ≤ 1.10 E[m] |
| Rice and corn at most 65% of energy | Σ_cereals e[j] x[m,j] ≤ 0.65 E[m] |
| Added sugar at most 5% of energy | Σ_sugar e[j] x[m,j] ≤ 0.05 E[m] |
| Protein quality: 35% of protein need from meat, fish, eggs, beans | Σ_QP prot[j] x[m,j] + 0.35 R[m,prot] Σ_t s[m,prot,t] ≥ 0.35 R[m,prot] |
| Pinggang Pinoy vegetables: 100 g per 1,000 kcal | Σ_veg x[m,j] + V[m] Σ_t v[m,t] ≥ V[m] |
| Budget (budget mode) | Σ_m Σ_j p[j] x[m,j] ≤ B |

## Objective

- **Full mode** (cheapest plan that meets all needs): minimise Σ p x + 500 × Σ w[m,k] × tier[t] × s[m,k,t]. Each 100% of a need left unmet costs PHP 500 at the first tier, so gaps remain only where the food list cannot close them within the portion rules.
- **Budget mode**: minimise Σ priority[m] × W[k] × tier[t] × s[m,k,t] (+ 10⁻⁴ × cost to break ties). priority = 3 for children under 5 and pregnant or breastfeeding women, 2 for ages 5–18, 1 for adults. W = 3 for energy, 2 for protein, 1 for iron, vitamin A and calcium. Tier multipliers 1 : 3 : 9 spread gaps across members instead of letting one person absorb all of them.

## Indicators

- **Coverage** = supplied ÷ need per member and nutrient; **mean adequacy ratio (MAR)** = mean of coverage capped at 100%.
- **Cost of Nutritious Diet (CoND)** index: full-mode cost for the reference family of five (father 35, mother 32, children 10, 7, 3) ÷ 5, per region and month. **Watch** when ≥ 5% above the mean of the previous 3 months; **alert** when ≥ 10% above it or ≥ 15% above the same month last year.
- **Typical spending** (`sapat/typical.py`): the same budget split by FIES 2023 food-group shares for the household's income decile, each group's pesos spread over representative foods (rice; chicken and pork kasim; galunggong and tilapia; eggs; banana; a vegetable mix with 15% monggo; refined sugar), and shared in proportion to energy needs. Oil and other untracked items keep their share but add no tracked nutrients; SAPAT is given the same pesos minus that share.
- **2023 to current budgets**: FIES 2023 budgets are scaled to a later month with that region's CoND ratio (month ÷ 2023 average).

## Feeding program menu

One meal per learner per day. Targets are a share of the daily needs of the age group (averaged over boys and girls), by default one third. Portion caps are half of the daily caps. Each protein food (meat, fish, eggs, beans) is used at most once across the five days while at least three other protein foods remain. The budget is per learner per meal (budget mode).
