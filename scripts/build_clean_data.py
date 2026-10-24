"""SAPAT data pipeline: raw PJDSC files -> clean, merged working files.
Usage: python scripts/build_clean_data.py data_raw data_clean   (see data_raw/README.md for the files it expects)
Every step logs counts to out_dir/cleaning_log.txt so the methodology can cite them."""
import sys, re, glob, os, subprocess
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reference_tables import region_xwalk, commodity_xwalk, FIES_TO_KEY, PSA_TO_KEY, WFP_TO_KEY, EXCLUDED_NOTE
from parse_fct_pdf import parse as parse_fct_pdf

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
LOG = []
def log(*a):
    s = " ".join(str(x) for x in a); print(s); LOG.append(s)
MONTHS = {m: i for i, m in enumerate(["January","February","March","April","May","June","July","August","September","October","November","December"], 1)}
NUTR = ["energy_kcal","protein_g","fat_g","carb_g","fiber_g","iron_mg","vit_a_rae_ug","calcium_mg","zinc_mg","vit_c_mg"]

# ======================= 1. PSA OpenSTAT retail prices -> long =======================
frames = []
for f in sorted(glob.glob(os.path.join(RAW, "psa_openstat_retail_prices", "*.csv"))):
    table = os.path.basename(f).split("-")[0].strip()
    df = pd.read_csv(f, skiprows=1, encoding="latin1", dtype=str)
    df["Geolocation"] = df["Geolocation"].ffill()
    mcols = [c for c in df.columns if re.match(r"^\d{4} [A-Z][a-z]+$", c) and "Annual" not in c]
    long = df.melt(id_vars=["Geolocation", "Commodity"], value_vars=mcols, var_name="period", value_name="raw")
    long["psa_table"] = table
    frames.append(long)
psa = pd.concat(frames, ignore_index=True)
n_cells = len(psa)
psa["price"] = pd.to_numeric(psa["raw"].str.replace(",", ""), errors="coerce")
psa = psa.dropna(subset=["price"])
psa = psa[psa.price > 0]
psa["year"] = psa.period.str[:4].astype(int)
psa["month"] = psa.period.str[5:].map(MONTHS)
psa["date"] = pd.to_datetime(dict(year=psa.year, month=psa.month, day=1))
g = psa.Geolocation
psa["geo_level"] = np.where(g.str.upper() == "PHILIPPINES", "national", np.where(g.str.startswith("...."), "province", "region"))
psa["geo_name"] = g.str.lstrip(".")
psa["region_key"] = g.map(PSA_TO_KEY)
psa.loc[psa.geo_level == "national", "region_key"] = "PH"
psa = psa.rename(columns={"Commodity": "psa_commodity"})
psa["unit"] = np.where(psa.psa_commodity.str.endswith("1 PC"), "PC", "KG")
dups = psa.duplicated(["Geolocation", "psa_commodity", "date"]).sum()
psa = psa.drop_duplicates(["Geolocation", "psa_commodity", "date"])
log(f"[PSA] {n_cells:,} table cells -> {len(psa):,} non-missing prices ({len(psa)/n_cells:.0%}); {dups} duplicate rows dropped")
log(f"[PSA] {psa.psa_commodity.nunique()} commodities, {psa.date.min():%Y-%m} to {psa.date.max():%Y-%m}; levels: {psa.geo_level.value_counts().to_dict()}")
# robust outlier flag: > 4 MAD from commodity-geo rolling median on log scale
psa = psa.sort_values(["Geolocation", "psa_commodity", "date"])
lp = np.log(psa.price)
med = lp.groupby([psa.Geolocation, psa.psa_commodity]).transform(lambda s: s.rolling(13, center=True, min_periods=5).median())
mad = (lp - med).abs().groupby([psa.Geolocation, psa.psa_commodity]).transform(lambda s: s.rolling(13, center=True, min_periods=5).median())
psa["outlier_flag"] = ((lp - med).abs() > 4 * 1.4826 * mad.clip(lower=0.02)).astype(int)
log(f"[PSA] outlier flag (>4 robust SD from 13-month rolling median): {psa.outlier_flag.sum():,} rows ({psa.outlier_flag.mean():.2%}) flagged, kept")
keep = ["psa_table","psa_commodity","unit","geo_level","geo_name","region_key","date","year","month","price","outlier_flag"]
psa[psa.geo_level != "province"][keep].to_csv(os.path.join(OUT, "psa_prices_long_region.csv"), index=False)
psa[psa.geo_level == "province"][keep].to_csv(os.path.join(OUT, "psa_prices_long_province.csv.gz"), index=False, compression="gzip")

# ======================= 2. SRA sugar (Metro Manila) =======================
sra = pd.read_csv(os.path.join(RAW, "sra_sugar_retail_mm_monthly.csv"), parse_dates=["date"])
sra = sra.sort_values("outlet", key=lambda s: s.map({"wet": 0, "groc": 1})).drop_duplicates("date").sort_values("date")
log(f"[SRA] {len(sra)} months {sra.date.min():%Y-%m} to {sra.date.max():%Y-%m}; outlet used: {sra.outlet.value_counts().to_dict()} (wet market preferred)")
sra_long = pd.concat([
    sra.assign(psa_commodity="SRA REFINED SUGAR, 1 KG", price=sra.refined_avg),
    sra.assign(psa_commodity="SRA RAW SUGAR, 1 KG", price=sra.raw_avg)])[["date", "psa_commodity", "price"]].dropna()

# ======================= 3. PhilFCT nutrient table =======================
mapped = pd.read_csv(os.path.join(RAW, "philfct_mapped.csv"))
fct = mapped.dropna(subset=["fct_food_id"]).drop_duplicates("fct_food_id")
fct = fct[["fct_food_id","fct_food_name","common_name","report_file","ep_pct"] + NUTR]
new_ids = []
for p in sorted(glob.glob(os.path.join(RAW, "food_reports", "*.pdf"))):
    r = parse_fct_pdf(p)
    if r["fct_food_id"] and r["fct_food_id"] not in set(fct.fct_food_id):
        fct = pd.concat([fct, pd.DataFrame([r])[fct.columns]], ignore_index=True); new_ids.append(r["fct_food_id"])
    elif r["fct_food_id"]:  # cross-check the mapping file against the PDF
        old = fct.set_index("fct_food_id").loc[r["fct_food_id"]]
        bad = [k for k in ["ep_pct","energy_kcal","protein_g","iron_mg"] if r[k] is not None and abs(float(old[k]) - r[k]) > 1e-6]
        if bad: log(f"[FCT] WARNING {r['fct_food_id']} differs from PDF on {bad}")
log(f"[FCT] {len(fct)} PhilFCT entries ({len(mapped)} rows in mapping file); added from PDFs: {new_ids}")
log(f"[FCT] zinc reported for {fct.zinc_mg.notna().sum()}/{len(fct)} entries -> excluded from analysis")
fct.to_csv(os.path.join(OUT, "philfct_nutrients.csv"), index=False)

# ======================= 4. WFP prices (validation + coconut calibration) =======================
wfp = pd.read_csv(os.path.join(RAW, "wfp_food_prices_phl.csv"), skiprows=[1], parse_dates=["date"])
wfp = wfp[(wfp.pricetype == "Retail") & (wfp.priceflag == "actual")].copy()
wfp["date"] = wfp.date.dt.to_period("M").dt.to_timestamp()
wfp["region_key"] = wfp.admin1.map(WFP_TO_KEY)
log(f"[WFP] retail actual: {len(wfp):,} rows, {wfp.market.nunique()} markets, {wfp.date.min():%Y-%m} to {wfp.date.max():%Y-%m}; unmatched admin1: {wfp.region_key.isna().sum()}")
wfp_rm = wfp.groupby(["region_key", "commodity", "unit", "date"], as_index=False).agg(wfp_price=("price", "median"), wfp_markets=("market", "nunique"))

# coconut grams per piece: PSA (PHP/pc) / WFP (PHP/kg)
coco = psa[(psa.psa_commodity == "MATURED COCONUT, MEDIUM, 1 PC") & (psa.geo_level == "region")].merge(
    wfp_rm[wfp_rm.commodity == "Coconut"], on=["region_key", "date"])
coco_g = float((coco.price / coco.wfp_price * 1000).median())
log(f"[CAL] coconut: {len(coco)} region-months overlap; median implied weight = {coco_g:.0f} g per medium nut (IQR {np.percentile(coco.price/coco.wfp_price*1000,25):.0f}-{np.percentile(coco.price/coco.wfp_price*1000,75):.0f})")
xw = commodity_xwalk.copy()
xw.loc[xw.psa_commodity.str.startswith("MATURED COCONUT"), "grams_per_unit"] = round(coco_g)
xw.to_csv(os.path.join(OUT, "commodity_crosswalk.csv"), index=False)
region_xwalk.assign(fies_codes=region_xwalk.fies_codes.astype(str)).to_csv(os.path.join(OUT, "region_crosswalk.csv"), index=False)

# ======================= 5. Nutrient-price panel (region x month x food) =======================
reg = psa[psa.geo_level.isin(["region", "national"]) & psa.psa_commodity.isin(xw.psa_commodity)][["region_key","psa_commodity","date","price","outlier_flag"]]
sra_all = pd.concat([sra_long.assign(region_key=k) for k in ["PH"] + [r for r in region_xwalk.region_key]])
sra_all["outlier_flag"] = 0
panel = pd.concat([reg, sra_all], ignore_index=True).merge(xw, on="psa_commodity").merge(fct, on="fct_food_id", how="left")
panel["price_per_100g_ap"] = panel.price / (panel.grams_per_unit / 100)
panel["edible_g_per_peso"] = (panel.ep_pct) / panel.price_per_100g_ap  # g edible per PHP (100g AP * ep%/100 / price)
for k in ["energy_kcal","protein_g","iron_mg","vit_a_rae_ug","calcium_mg"]:
    panel[f"{k}_per_peso"] = panel[k] * panel.ep_pct / 100 / panel.price_per_100g_ap
panel["php_per_10g_protein"] = 10 / panel.protein_g_per_peso.replace(0, np.nan)
panel["php_per_1000kcal"] = 1000 / panel.energy_kcal_per_peso.replace(0, np.nan)
panel["php_per_mg_iron"] = 1 / panel.iron_mg_per_peso.replace(0, np.nan)
panel["php_per_100ug_vitA"] = 100 / panel.vit_a_rae_ug_per_peso.replace(0, np.nan)
panel["php_per_100mg_calcium"] = 100 / panel.calcium_mg_per_peso.replace(0, np.nan)
panel = panel.sort_values(["region_key", "psa_commodity", "date"])
panel.to_csv(os.path.join(OUT, "nutrient_price_panel.csv"), index=False)
cov = panel[panel.region_key != "PH"].groupby("psa_commodity").region_key.nunique()
log(f"[PANEL] {len(panel):,} rows; {panel.psa_commodity.nunique()} foods x {panel.region_key.nunique()} geos (incl. PH, NIR); foods with <17 regions: {cov[cov<17].to_dict()}")

# ======================= 6. WFP vs PSA validation table =======================
val = panel[panel.wfp_commodity.notna() & (panel.region_key != "PH")][["region_key","psa_commodity","wfp_commodity","date","price","grams_per_unit"]]
val = val.merge(wfp_rm, left_on=["region_key","wfp_commodity","date"], right_on=["region_key","commodity","date"])
val["psa_price_wfp_unit"] = np.where(val.unit.eq("KG") & val.grams_per_unit.ne(1000), val.price / val.grams_per_unit * 1000, val.price)
val["ape"] = (val.psa_price_wfp_unit - val.wfp_price).abs() / val.wfp_price
val.drop(columns=["commodity"]).to_csv(os.path.join(OUT, "validation_psa_vs_wfp.csv"), index=False)
log(f"[VAL] {len(val):,} region-month-food overlaps; overall MAPE {val.ape.mean():.1%}, median APE {val.ape.median():.1%}")

# ======================= 7. FIES 2021 + 2023 harmonized =======================
GROUPS = ["BREAD","MEAT","FISH","MILK","OIL","FRUIT","VEG","SUGAR","FOOD_NEC"]
base = ["W_REGN","FSIZE","URB","RFACT","TOINC","TOTEX","FOOD","FOOD_HOME","FOOD_OUTSIDE","NPCINC","RPCINC"] + GROUPS
fies = []
for yr, fn, pc in [(2021, "fies_2021_volume_2_household_summary.csv", "PCINC"), (2023, "fies_2023_vol2_household_summary_694509957977.csv", "PERCAPITA")]:
    d = pd.read_csv(os.path.join(RAW, fn), usecols=base + [pc]).rename(columns={pc: "PCINC"})
    d.insert(0, "year", yr)
    fies.append(d)
fies = pd.concat(fies, ignore_index=True)
fies.columns = [c.lower() for c in fies.columns]
fies["region_key"] = fies.w_regn.map(FIES_TO_KEY)
fies["urban"] = (fies.urb == 1).astype(int)
fies["person_weight"] = fies.rfact * fies.fsize
fies["food_share_income"] = fies.food / fies.toinc
fies["food_share_exp"] = fies.food / fies.totex
fies["food_pc_day"] = fies.food / fies.fsize / 365
fies["food_home_pc_day"] = fies.food_home / fies.fsize / 365
# Population-weighted per-capita income deciles (each = 10% of persons). NPCINC in the PUF is household-based
# (10% of households each); the concept note's Figure A1 figures reproduce with the population-based version.
def pop_decile(d):
    d = d.sort_values("pcinc"); cw = d.person_weight.cumsum() / d.person_weight.sum()
    return pd.Series(np.minimum(np.ceil(cw * 10), 10).astype(int), index=d.index)
fies["pop_decile"] = fies.groupby("year", group_keys=False).apply(pop_decile, include_groups=False)
fies["grp_sum_check"] = fies[[g.lower() for g in GROUPS]].sum(axis=1) / fies.food_home.replace(0, np.nan)
log(f"[FIES] {fies.groupby('year').size().to_dict()} households; unmatched region codes: {fies.region_key.isna().sum()}; "
    f"food-group sum / FOOD_HOME median = {fies.grp_sum_check.median():.3f}")
fies.drop(columns=["grp_sum_check"]).to_csv(os.path.join(OUT, "fies_households_2021_2023.csv.gz"), index=False, compression="gzip")

# ======================= 8. PSA food thresholds (poverty publication, Table 3) =======================
txt = subprocess.run(["pdftotext", "-layout", os.path.join(RAW, "2023 FY Official Poverty Statistics Publication_15August2024.pdf"), "-"], capture_output=True, text=True).stdout
lines = txt.splitlines()
labels = {r.poverty_label: r.region_key for r in region_xwalk.itertuples() if isinstance(r.poverty_label, str)}
labels.update({"PHILIPPINES": "PH", "Region XIII (Caraga)": "R13", "Bangsamoro Autonomous Region in Muslim Mindanao": "BARMM"})
def parse_table(title, nxt, prefix):
    start = next(i for i, l in enumerate(lines) if title in l)
    end = next(i for i, l in enumerate(lines) if nxt in l and i > start)
    out = []
    for l in lines[start:end]:
        s = l.strip()
        for lab, key in labels.items():
            if s.startswith(lab + " "):
                rest = s[len(lab):]
                th = re.findall(r"\d{2},\d{3}", rest)[:3]
                after = rest.split(th[-1], 1)[1] if th else ""
                inc = re.findall(r"(?<![\d,])(\d{1,2}\.\d|-)(?![\d,])", after)[:3]
                if len(th) == 3:
                    out.append((key, *[int(n.replace(",", "")) for n in th], *[float(x) if x != "-" else np.nan for x in inc]))
    cols = ["region_key"] + [f"{prefix}_{y}" for y in (2018, 2021, 2023)] + [f"{prefix}_incidence_fam_pct_{y}" for y in (2018, 2021, 2023)]
    return pd.DataFrame(out, columns=cols).drop_duplicates("region_key")
ft = parse_table("Table 3. Annual Per Capita Food Threshold", "Table 3a.", "food_threshold")
pt = parse_table("Table 1. Annual Per Capita Poverty Threshold", "Table 1a.", "poverty_threshold")
ft = ft.rename(columns=lambda c: c.replace("food_threshold_incidence", "subsistence_incidence")).merge(pt.rename(columns=lambda c: c.replace("poverty_threshold_incidence", "poverty_incidence")), on="region_key", how="outer")
log(f"[THRESH] food & poverty thresholds parsed for {len(ft)} geos (expect 18 = PH + 17 regions); missing: {sorted(set(labels.values()) - set(ft.region_key))}")
ft.to_csv(os.path.join(OUT, "psa_thresholds_2018_2021_2023.csv"), index=False)
ft = ft.rename(columns={f"food_threshold_{y}": f"ft_{y}" for y in (2018, 2021, 2023)})

# ======================= 9. Merged region-year panel (FIES x thresholds x prices) =======================
def wavg(x, w): return np.average(x, weights=w)
rows = []
for (yr, rk), d in fies.groupby(["year", "region_key"]):
    w = d.person_weight
    ftv = ft.set_index("region_key").loc[rk, f"ft_{yr}"] if rk in set(ft.region_key) else np.nan
    pc_food_yr = d.food / d.fsize
    rows.append(dict(year=yr, region_key=rk, households=len(d), pop_weighted_m=w.sum() / 1e6,
        pcinc_mean=wavg(d.pcinc, w), food_pc_day_mean=wavg(d.food_pc_day, w),
        food_share_income_agg=(d.food * d.rfact).sum() / (d.toinc * d.rfact).sum(),
        food_share_exp_agg=(d.food * d.rfact).sum() / (d.totex * d.rfact).sum(),
        cereal_share_home_agg=(d.bread * d.rfact).sum() / (d.food_home * d.rfact).sum(),
        animal_src_share_home_agg=((d.meat + d.fish + d.milk) * d.rfact).sum() / (d.food_home * d.rfact).sum(),
        food_threshold_pc_yr=ftv,
        pct_pop_food_spend_below_ft=(w[pc_food_yr < ftv].sum() / w.sum()) if pd.notna(ftv) else np.nan,
        pct_pop_income_below_ft=(w[d.pcinc < ftv].sum() / w.sum()) if pd.notna(ftv) else np.nan))
ry = pd.DataFrame(rows)
pa = panel[panel.region_key.isin(ry.region_key)].assign(year=lambda x: x.date.dt.year)
pa = pa[pa.year.isin([2021, 2023])]
price_feats = pa.groupby(["year", "region_key"]).apply(lambda d: pd.Series({
    "rice_regular_php_kg": d.loc[d.psa_commodity == "RICE, REGULAR-MILLED, 1 KG", "price"].mean(),
    "egg_php_pc": d.loc[d.psa_commodity == "FRESH EGG, CHICKEN, MEDIUM, 1 PC", "price"].mean(),
    "cheapest_protein_php_10g": d.groupby("psa_commodity").php_per_10g_protein.mean().min(),
    "median_animal_protein_php_10g": d[d.food_group.isin(["meat", "fish & seafood", "eggs"])].groupby("psa_commodity").php_per_10g_protein.mean().median(),
}), include_groups=False).reset_index()
ry = ry.merge(price_feats, on=["year", "region_key"], how="left").merge(region_xwalk[["region_key", "region_short"]], on="region_key")
ry.to_csv(os.path.join(OUT, "region_year_panel.csv"), index=False)
log(f"[MERGE] region_year_panel: {len(ry)} rows ({ry.region_key.nunique()} regions x {ry.year.nunique()} years)")

open(os.path.join(OUT, "cleaning_log.txt"), "w").write("\n".join(LOG) + "\n")
