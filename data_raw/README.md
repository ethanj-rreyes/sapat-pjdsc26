# data_raw/: source files, as downloaded

These are the inputs to `scripts/build_clean_data.py` and to the exploratory notebook. Keep file and folder names exactly as listed: the scripts read them by name, and the PSA table name (e.g. `Fish`) is taken from the text before the first `-` in each OpenSTAT file name.

You only need this folder to rebuild `data_clean/` from scratch. Everything else in the repository (analysis, web apps, tests) runs from `data_clean/`, which is committed.

## In the repository

| File | Size | Source | Used by |
|---|---|---|---|
| `psa_openstat_retail_prices/*.csv` (11 files: Beans and Legumes, Cereals, Commercial Crops, Condiments, Fish, Fruit Vegetables, Fruits, Leafy Vegetables, Livestock, Poultry, Rootcrops) | 12 MB | PSA OpenSTAT, *Retail Prices of Agricultural Commodities by Geolocation, Commodity, Year and Period*, Jan 2018 to Sep 2026. https://openstat.psa.gov.ph | `build_clean_data.py` step 1; notebook §2 |
| `sra_sugar_retail_mm_monthly.csv` | 4 KB | Sugar Regulatory Administration, Metro Manila retail sugar prices, compiled monthly by the team from the SRA price bulletins | `build_clean_data.py`; notebook §2 |
| `philfct_mapped.csv` | 15 KB | Team mapping of foods to DOST-FNRI PhilFCT entries, with nutrients per 100 g edible portion | `build_clean_data.py`; notebook §2 |
| `philfct_checklist.csv` | 7 KB | Team checklist used while exporting PhilFCT entries (reference only) | none (kept for traceability) |
| `wfp_food_prices_phl.csv` | 17 MB | World Food Programme, *Philippines – Food Prices*, HDX. https://data.humdata.org/dataset/wfp-food-prices-for-philippines | `build_clean_data.py` (independent price check, coconut weight) |
| `2023 FY Official Poverty Statistics Publication_15August2024.pdf` | 2.3 MB | PSA, *2023 Full Year Official Poverty Statistics of the Philippines* | `build_clean_data.py` step 8 (food thresholds, poverty incidence) |

## Not in the repository (download if you rebuild from scratch)

| File | Size | Why it is not here | How to get it |
|---|---|---|---|
| `fies_2021_volume_2_household_summary.csv` | 148 MB | Over GitHub's 100 MB file limit | PSA microdata catalog (https://psada.psa.gov.ph): FIES 2021 public-use file, Volume 2 household summary. Save with this exact name. |
| `fies_2023_vol2_household_summary_694509957977.csv` | 143 MB | Over GitHub's 100 MB file limit | PSA microdata catalog: FIES 2023 public-use file, Volume 2 household summary. Save with this exact name. |
| `food_reports/*.pdf` (64 files) | 60 MB | Per-food PDF exports from the PhilFCT website; large and republished by FNRI | DOST-FNRI PhilFCT (https://i.fnri.dost.gov.ph/fct/library): export each food listed in `data_clean/commodity_crosswalk.csv` (column `fct_food_id`) as PDF into `data_raw/food_reports/`. |

These three are listed in `.gitignore`. Their processed results are already in `data_clean/` (`fies_households_2021_2023.csv.gz`, `philfct_nutrients.csv`), so you do not need them unless you re-run step 1 of the pipeline.

## Rebuild

```bash
python scripts/build_clean_data.py data_raw data_clean    # needs pdftotext (poppler) for the PDFs
# or everything, including analysis and app exports:
python scripts/run_pipeline.py --raw data_raw
```
