# data_clean/: processed data (committed)

Outputs of `scripts/build_clean_data.py` from the files in `data_raw/`. Every other step (analysis, app exports, tests) reads from here, so the repository runs without the large raw files. Counts from each cleaning step are in `cleaning_log.txt`.

| File | Rows × columns | What it holds |
|---|---|---|
| `nutrient_price_panel.csv.gz` | 95,887 × 37 | **Main analysis table.** One row per region, food and month: price, PhilFCT nutrients, edible portion, nutrients per peso and peso cost per nutrient unit |
| `psa_prices_long_region.csv.gz` | 192,202 × 11 | PSA retail prices, national and regional, long format (one row per place, commodity, month) |
| `psa_prices_long_province.csv.gz` | 529,097 × 11 | Same for provinces and selected cities; source of the web apps' local prices |
| `fies_households_2021_2023.csv.gz` | 328,297 × 30 | FIES 2021 and 2023 households, harmonized: income, food spending by group, weights, region, population decile |
| `philfct_nutrients.csv` | 61 × 15 | Nutrients per 100 g edible portion for each food used |
| `commodity_crosswalk.csv` | 64 × 7 | PSA/SRA commodity → PhilFCT entry, with match type (direct or proxy) and notes |
| `region_crosswalk.csv` | 18 × 6 | One key per region linking PSA, FIES, WFP and poverty-table names |
| `region_year_panel.csv` | 34 × 18 | Region × year (2021, 2023) food-burden indicators from FIES |
| `psa_thresholds_2018_2021_2023.csv` | 18 × 13 | PSA food and poverty thresholds and poverty incidence by region |
| `validation_psa_vs_wfp.csv` | 28,937 × 11 | PSA vs WFP price for the same region, month and food (MAPE 10.7%) |
| `cleaning_log.txt` | | Counts and checks written by each cleaning step |

Column definitions and sources: `docs/DATA.md`. Methodology: `docs/DATA_PIPELINE.md`.
