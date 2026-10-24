# SAPAT data pipeline: methodology and cleaning notes

Generated 12 Oct 2026; paths updated 24 Oct 2026 for the repository layout. To rebuild everything from the raw files in `data_raw/` (see `data_raw/README.md`):

```
python scripts/build_clean_data.py data_raw data_clean
python scripts/eda.py data_clean outputs/eda_results.json
# or, for every step including the analysis and app exports:
python scripts/run_pipeline.py --raw data_raw
```

Needs Python 3.10+, pandas, numpy and `pdftotext` (poppler) for reading the PhilFCT and PSA poverty PDFs. Every step writes its counts to `data_clean/cleaning_log.txt`.

## 1. Inputs

| Raw file | Used for |
|---|---|
| `psa_openstat_retail_prices/*.csv` (11 tables) | Monthly retail prices, Jan 2018 to Sep 2026, national, regional and provincial |
| `sra_sugar_retail_mm_monthly.csv` | Refined and raw sugar, Metro Manila, Sep 2018 to Sep 2026 |
| `wfp_food_prices_phl.csv` | Independent price check (2018 to Nov 2023) and coconut weight calibration |
| `philfct_mapped.csv` + `food_reports/*.pdf` | Nutrients per 100 g edible portion, edible portion % |
| `fies_2021_…csv`, `fies_2023_…csv` | Household income, food spending and food-group spending |
| `2023 FY Official Poverty Statistics Publication.pdf` | Regional food thresholds (Table 3) and poverty thresholds and incidence (Table 1), 2018, 2021, 2023 |

## 2. Steps

**PSA prices to long format.** Each OpenSTAT table has one row per place and commodity, one column per month. The place name is filled down, the table is melted to one row per place, commodity and month, and the "Annual" columns are dropped. `..` and `.` mean "no data" and are removed. 28% of the 2.53 million cells hold a price. Geography level comes from the leading dots (`..` region, `....` province). Prices more than 4 robust SDs from their own 13-month rolling median are flagged (`outlier_flag`, about 1%) but kept.

**Regions.** One crosswalk (`region_crosswalk.csv`) links PSA place names, FIES `W_REGN` codes, WFP `admin1` names and the poverty-table labels. FIES codes BARMM as 15 in 2021 and 19 in 2023. PSA prices also carry Negros Island Region (NIR) as its own series. FIES and the poverty tables use the older set of regions, so NIR stays in the price files only.

**Foods: PSA commodity to PhilFCT.** The existing `philfct_mapped.csv` is keyed to WFP commodity names, so a new crosswalk (`commodity_crosswalk.csv`) maps 62 PSA commodities plus 2 SRA sugar series to PhilFCT entries. Of these 64 foods, 52 match directly and 12 use a documented proxy. Three entries in the mapping file were wrong and are corrected:

- regular-milled rice pointed to A012 glutinous rice. The pipeline uses A019 well-milled rice instead.
- crab pointed to G036 crab fat. It now uses G040 mud crab without fat, parsed from your newer PDF export.
- fresh dilis would use G150 dried anchovy, which has 69 g protein per 100 g. Fresh dilis is excluded until a fresh entry is exported.

Four new entries (G040, F035 beef shank, F182 pork spare rib, C037 peanut without skin) are parsed directly from the PDFs. They fill the bone-in beef, bone-in pork and shelled-peanut gaps. Zinc is reported for only 13 of the 61 entries, so it is excluded.

**Unit conversion.** All prices become PHP per 100 g as purchased. Eggs are priced per piece and use assumed weights: 55 g for a medium chicken egg and 70 g for a duck egg. These weights should be checked against an FNRI reference before submission. Coconuts are priced per piece. Their weight is calibrated by dividing the PSA per-piece price by the WFP per-kg price for the same region and month across 731 overlaps. This gives a median of 1,000 g per nut (IQR 963 to 1,072 g).

**Nutrients per peso.** For food *j*, nutrient *k*, region *r* and month *t*:
`n_jkrt = a_jk × EP_j / 100 / p_jrt`, where `a` is the nutrient per 100 g edible portion and `p` is the price per 100 g as purchased. The panel stores the inverse costs too: PHP per 10 g protein, per 1,000 kcal, per mg iron, per 100 µg RAE vitamin A and per 100 mg calcium.

**Sugar.** SRA wet-market prices are used and applied to every region, as the proposal's limitations section states.

**FIES.** The 2021 and 2023 files are stacked with harmonised names. Per-capita income is `PCINC` in 2021 and `PERCAPITA` in 2023. The household weight is `RFACT`, and the person weight is `RFACT × FSIZE`. Population-weighted per-capita income deciles (`pop_decile`, each 10% of persons) are added. With these deciles the concept note's Figure A1 figures reproduce exactly:

- the poorest decile spends 52.8% of income on food, or PHP 32.95 per person per day;
- cereals take 44.2% of its home food budget and meat 10.6%;
- the richest decile spends 17.8% of income on food.

The PUF's own `NPCINC` is household-based (10% of households each) and gives 51.4% for the poorest decile.

**Thresholds.** PSA Tables 1 and 3 are read from the PDF text for the 17 regions and the Philippines total. The parse was checked against the national 2023 figures: food threshold PHP 22,994, poverty threshold PHP 33,296 and poverty incidence of 10.9% among families.

**Merged region-year panel.** `region_year_panel.csv` has 17 regions × (2021, 2023). It joins:

- FIES aggregates: food share of income and expenditure, PHP per person per day, cereal and animal-source shares, and the share of persons whose per-capita food spending is below the regional food threshold;
- PSA thresholds and incidence;
- price features from the panel for the same calendar year: regular rice, eggs, the cheapest protein, and the median animal-protein cost.

**Validation.** PSA regional prices are compared with the WFP median across markets in the same region and month (retail, `actual` flag) for every food with a WFP equivalent. There are 28,937 matched points from 2018 to 2023. The overall MAPE is 10.7% and the median APE is 4.8%, and 77% of foods are under the 15% target. Crab, dalandan (WFP "mandarins") and imported garlic diverge most, which looks like a product mismatch rather than bad prices.

## 3. Output files (`data_clean/`)

| File | Grain |
|---|---|
| `psa_prices_long_region.csv.gz` | national + region × commodity × month, all 197 PSA commodities |
| `psa_prices_long_province.csv.gz` | province × commodity × month |
| `nutrient_price_panel.csv.gz` | PH + 18 regions × 64 mapped foods × month, with nutrients and cost per nutrient |
| `philfct_nutrients.csv` | 61 PhilFCT entries |
| `commodity_crosswalk.csv`, `region_crosswalk.csv` | lookup tables with match type and notes |
| `fies_households_2021_2023.csv.gz` | 328,297 households with derived shares and deciles |
| `psa_thresholds_2018_2021_2023.csv` | food and poverty thresholds and incidence, PH + 17 regions |
| `region_year_panel.csv` | merged analysis table, 17 regions × 2 years |
| `validation_psa_vs_wfp.csv` | every PSA–WFP matched point with its error |
| `cleaning_log.txt` | counts from each step |

## 4. Things to decide before the LP step

1. **Regional coverage is thin for many cheap foods.** Only 24 of the 64 foods have a price in at least 90% of months in all 17 regions. Corn grits, kangkong, camote tops, most small fish and peanuts have gaps. Options: fill gaps from the province series, fall back to the national price × a regional price index, or restrict each region's LP to foods priced there and report it.
2. **Cereals are cheap protein on paper.** Rice and corn grits rank among the cheapest protein per peso, and only peanuts and mung beans beat them. The LP needs protein-quality handling (for example, a cap on cereal protein or a minimum from animal sources or legumes) or it will meet protein almost entirely from rice.
3. **Brown sugar has 148 mg calcium per 100 g in PhilFCT.** An LP without an upper bound on sugar will use it as a calcium source. Cap it.
4. **"Food spending below the food threshold" is not the subsistence rate.** 56% of Filipinos spent less per person on food than their region's food threshold in 2023. The official subsistence incidence is 2.7% because it is based on income. Present the spending measure as such.
