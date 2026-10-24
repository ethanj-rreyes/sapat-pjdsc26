# Eating scenarios: what the family app handles

Test cases for the family app. **Handled** = works in the current prototype; **Partly** = works with the limit noted; **Not yet** = planned.

## Meals: "Ano ang kinain?" (any meal, whole family or chosen members)

| # | Scenario | Status | How the app responds |
|---|---|---|---|
| 1 | Family ate the planned dish | Handled | One tap "Kinain namin"; split per person by the plan |
| 2 | Cooked something else at home | Handled | Pick foods and portions from the list |
| 3 | Bought cooked ulam (karinderya, turo-turo) | Handled | Pick food groups on the plate; nutrients estimated and labeled "tantiya"; money spent counts toward the week |
| 4 | Whole family ate out | Handled | Same as 3; planned dish marked "not cooked, keep ingredients for tomorrow" |
| 5 | One member ate out, others ate at home | Handled | Choose who; others get the planned dish, the one who ate out gets the estimate |
| 6 | Street food or meryenda outside | Handled | Same as 3, starts with nothing selected |
| 7 | Baon at school or work | Handled | Same as 3, per member |
| 8 | Fiesta, birthday, guests, ayuda or relief food | Handled | Same as 3; spending defaults to ₱0 |
| 9 | Skipped meal | Handled | Logged gently; if a child or a pregnant or breastfeeding mother skipped, suggests a small meal (kanin with itlog or monggo) |
| 10 | Ate no vegetables outside | Handled | Suggests adding vegetables at the next meal |
| 11 | Logged by mistake | Handled | Undo on every log |
| 12 | Price at the market differs | Handled | Enter what you paid; saved per kilo or piece and used in the next plan |
| 13 | Swapped a dish to another day | Handled | "Palitan" moves lunch or dinner within the week |
| 14 | Member with a diet (no pork, fish only, vegetarian, low sugar) | Handled | Per-member exclusions in the plan and in swap tips |
| 15 | Too many eggs, too much red meat or sweets in a week | Handled | Weekly balance flags it per person; egg swaps respect the limit |
| 16 | Same ulam over and over | Partly | Cooking styles rotate; balance flags any dish over 3 times a week |
| 17 | Common illness at home (cough, fever, diarrhea) | Partly | Food-as-support guide with red flags; not medical advice |
| 18 | Leftovers eaten the next day | Not yet | Workaround: log as "Iba ang niluto sa bahay" |
| 19 | Ate more or less than the portion | Partly | Food picker has portion sizes in ×0.5 steps; planned meals assume the plan's split |
| 20 | Canned goods, instant noodles (common relief food) | Partly | Noodles counted as a cereal estimate; sardines and corned beef not in the PSA list, so estimated as "isda" or "karne" |
| 21 | Member away for several days | Not yet | Workaround: remove from household, add back later |
| 22 | Guest eating with the family | Not yet | Workaround: add a temporary member |
| 23 | Infant under 6 months (breastfed only) | Not yet | Planner starts at age 1; needs a first-foods module |
| 24 | Child 6–23 months (complementary feeding) | Partly | Needs follow the PDRI; textures and first foods not yet guided |
| 25 | Budget ran out mid-week | Partly | Spending bar shows it; no automatic re-plan for the remaining days yet |
| 26 | Fasting (e.g. Ramadan) | Not yet | Meal times fixed at four per day |
| 27 | Shopping at a sari-sari store or supermarket (higher prices) | Partly | Family can enter their own prices; a "where I shop" adjustment is planned |
| 28 | Item not available at the market | Partly | Uncheck and swap; no automatic substitute yet |
| 29 | History beyond this week | Not yet | Balance covers the current Monday–Sunday week only |

## Weekly balance: guides used

- **Eggs:** up to about 1 a day for healthy people (American Heart Association, 2019 science advisory). Egg swaps are hidden if they would push anyone past 7 a week.
- **Red meat (pork, beef):** up to about 350–500 g cooked a week (World Cancer Research Fund); flagged above 500 g.
- **Fish:** at least 2 days a week.
- **Vegetables:** every day (Pinggang Pinoy).
- **Free sugar:** under 5% of energy (WHO, 2015).
- **Variety:** the same dish at most 3 times a week.

At the poorest-10% budget, the demo family's plan has no fish days. The app shows this rather than hiding it, and links it to the budget-gap message.

## "Pagkain bilang pantulong": evidence behind each guide

| Guide | Situation | Evidence label | Basis |
|---|---|---|---|
| Salabat with calamansi and honey | Cough and colds | Some | Honey reduces cough in children ≥1 year (Cochrane review, Oduwole et al., 2018). **No honey under 1 year** (infant botulism) |
| Water, soup, soft fruit | Fever | Strong | Fluids and continued feeding (WHO). Food does not lower fever; red flags listed |
| ORS, lugaw, banana | Diarrhea | Strong | ORS, continued feeding and zinc for children (WHO/UNICEF) |
| Talbos or monggo with calamansi | Anemia | Strong | Vitamin C improves non-heme iron absorption; pregnant women still need iron-folic acid tablets (DOH) |
| Salabat, small frequent meals | Morning sickness | Some | Ginger is a listed non-drug option (ACOG) |
| Papaya, camote, vegetables | Constipation | Strong | Fiber and fluids |
| Kalabasa, carrot, talbos | Eyes and immunity | Strong | Vitamin A; free capsules for children 6–59 months (DOH) |
| Breakfast with egg, fish or banana | Study and exams | Some | Breakfast and attention in children; dark chocolate has a small, mixed effect and costs more |
| Pechay, dilis, malunggay | Bones | Some | Calcium; dilis, malunggay and tokwa are not yet in the PSA price list |
