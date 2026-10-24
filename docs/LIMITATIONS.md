# Limitations

> **SAPAT is a prototype built for demonstration in the Philippine Junior Data Science Challenge 2026.** It shows that the method works on real Philippine data. It has not been tested with families in the field, it is not a production service, and it gives meal-planning guidance only, not medical, clinical-nutrition or financial advice.

## Prototype scope

- **Not yet field-tested.** No pilot with barangay nutrition scholars or households has run yet. The effect on what families buy and eat is a hypothesis to test in the planned barangay pilot, not a result.
- **Demo data in the family app.** The app opens with an example family (Tita Baby's household in Leyte) and an example week of logged meals so judges can see every screen. "Burahin" clears the example.
- **Data stays on one phone.** Household setup, logged meals and prices a family enters are saved in that browser only (`localStorage`). There is no account, sync, backup or shared price database yet.
- **Web app, not a store app.** It runs in a phone's browser, or inside a phone frame on a laptop. Packaging as an installable or Play Store app is future work.
- **English and Tagalog only.** No Bisaya, Ilocano or other languages yet; text has not been reviewed by a translator or by users.
- **Accessibility and security** follow good practice (large tap targets, reduced-motion support, light and dark modes, no data leaves the device) but have not been formally audited.

## Data

- **PSA prices are averages.** Retail prices are monthly market averages by region, province or city, not prices at a specific stall. Sari-sari stores and supermarkets are usually higher. The app shows prices as ranges for this reason and lets families enter what they paid.
- **Price ranges** come from how the same food's price differs across the region's provinces in the same month, clamped to ±8% to ±25%. Where fewer than two provinces report, ±10% is used. They are a guide to variation, not a statistical interval.
- **Missing months** are filled with the last regional price for up to 6 months. Foods without a surveyed regional price are marked "estimated" and never used for best-value advice.
- **Foods not in the PSA list:** milk, dilis, malunggay, tokwa, canned goods and instant noodles. Calcium is therefore costly to meet, and relief-pack foods can only be estimated by food group.
- **FIES records pesos, not quantities.** The "usual way" comparison spreads each food group's pesos over representative foods (`sapat/typical.py`).
- **Unit conversions are approximations.** Egg weights (55 g chicken, 70 g duck), coconut weight (calibrated to 1,000 g from WFP overlaps), pieces per kilo and bundle (tali) weights are typical values, labeled "mga" (about) in the app.
- **Market-level prices** (DA price monitoring) are supported by the engine but not loaded; the DA-AMAS reports could not be collected for this prototype.

## Nutrition model

- **Five planning nutrients** (energy, protein, iron, vitamin A, calcium) drive the plan. Fiber, fat, carbohydrate and vitamin C are tracked but not optimized; zinc, folate, iodine and others are not modelled.
- **Vitamin A** uses PhilFCT retinol activity equivalents against PDRI retinol equivalents, which slightly understates coverage. Bioavailability is not modelled beyond the PDRI's own assumptions.
- **Iron for women 13–49 and in pregnancy** cannot be met by usual diets alone (per the PDRI); the app flags this and points to iron-folic acid supplements at the health center.
- **Ages:** plans start at 1 year. Infants under 6 months (breastfeeding) and complementary feeding for 6–11 months are not planned. Health conditions other than "low sugar" (e.g. hypertension, kidney disease) are not handled.
- **Food eaten outside the home** is estimated from the food groups on the plate, not measured.
- **Weekly balance limits** (eggs, red meat, fish, sugar, variety) are general guidance for healthy people from AHA, WCRF and WHO.
- **"Pagkain bilang pantulong"** tips summarize published evidence and always include when to see a health worker; they are not treatment.

## Analysis

- **H1** compares an optimized plan with the FIES spending pattern at the same budget. It shows what the budget *could* buy, not what families will actually do.
- **The LGU index** is back-tested on two past price shocks (2023 rice, 2022 onion); thresholds (Watch +5%, Alert +10% or +15% year on year) are set by judgment and not yet validated with LGUs.
- **The rebuild from raw files** (`build_clean_data.py`) needs the two raw FIES files and the PhilFCT PDF exports, which are not in the repository (`data_raw/README.md`), plus `pdftotext`. Every later step was re-run and reproduced exactly from `data_clean/`.
- **The exploratory notebook** (`notebooks/SAPAT_EDA.ipynb`) is scratch work; `scripts/` and `outputs/` are the source of record.

See also `docs/SCENARIOS.md` for the eating situations the app handles, partly handles, or does not handle yet.
