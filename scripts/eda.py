"""EDA on the clean SAPAT working files -> eda_results.json (feeds the dashboard) + printed summary.
Usage: python eda.py <clean_dir> <out_json>"""
import sys, os, json
import numpy as np, pandas as pd
C, OUTJ = sys.argv[1], sys.argv[2]
R = {}
_pp = os.path.join(C, "nutrient_price_panel.csv")
panel = pd.read_csv(_pp if os.path.exists(_pp) else _pp + ".gz", parse_dates=["date"])  # the repo ships the gzipped copy
fies = pd.read_csv(os.path.join(C, "fies_households_2021_2023.csv.gz"))
ry = pd.read_csv(os.path.join(C, "region_year_panel.csv"))
th = pd.read_csv(os.path.join(C, "psa_thresholds_2018_2021_2023.csv"))
val = pd.read_csv(os.path.join(C, "validation_psa_vs_wfp.csv"), parse_dates=["date"])
xw = pd.read_csv(os.path.join(C, "commodity_crosswalk.csv"))
rx = pd.read_csv(os.path.join(C, "region_crosswalk.csv"))
SHORT = dict(zip(rx.region_key, rx.region_short))

def nice(c):  # short food label
    s = c.replace(", 1 KG", "").replace(", 1 PC", "").replace("FRESH FISH, ", "").replace("FRESH ", "").replace(", MEDIUM", "").replace("FRUIT, ", "")
    return s.title().replace("Sra ", "SRA ")
panel["food"] = panel.psa_commodity.map(nice)
nat = panel[panel.region_key == "PH"]
reg = panel[~panel.region_key.isin(["PH"])]
LATEST = nat.date.max()
Q = nat[nat.date > LATEST - pd.DateOffset(months=3)]  # latest 3 months
R["latest_month"] = f"{LATEST:%B %Y}"

# ---------- 1. Coverage: share of 105 months with a regional price ----------
months = pd.date_range("2018-01-01", LATEST, freq="MS")
cov = (reg[reg.region_key != "NIR"].groupby(["food", "region_key"]).date.nunique() / len(months)).unstack(fill_value=0)
order_r = [k for k in rx.region_key if k in cov.columns]
cov = cov[order_r]
cov = cov.loc[cov.mean(axis=1).sort_values(ascending=False).index]
R["coverage"] = {"foods": cov.index.tolist(), "regions": [SHORT[k] for k in order_r], "values": cov.round(2).values.tolist()}
full = (cov >= 0.9).all(axis=1)
R["coverage_summary"] = {"foods_total": int(len(cov)), "foods_full_17": int(full.sum()), "foods_full_list": cov.index[full].tolist(),
                         "nir_first": f"{reg[reg.region_key=='NIR'].date.min():%Y-%m}"}

# ---------- 2. National price trends ----------
KEY = {"RICE, REGULAR-MILLED, 1 KG": "Rice, regular-milled (kg)", "FRESH EGG, CHICKEN, MEDIUM, 1 PC": "Egg, chicken (x10 pcs)",
       "FRESH FISH, ROUND SCAD, GALUNGGONG, MEDIUM, 1 KG": "Galunggong (kg)", "FRESH CHICKEN, FULLY DRESSED, BROILER, 1 KG": "Chicken, whole (kg)",
       "FRESH PORK, KASIM, 1 KG": "Pork kasim (kg)", "MONGGO, GREEN, 1 KG": "Mung beans (kg)", "SRA REFINED SUGAR, 1 KG": "Refined sugar, Metro Manila (kg)"}
tr = nat[nat.psa_commodity.isin(KEY)].copy()
tr.loc[tr.psa_commodity.str.contains("EGG"), "price"] *= 10
tr["label"] = tr.psa_commodity.map(KEY)
piv = tr.pivot_table(index="date", columns="label", values="price")
R["trends"] = {"dates": [f"{d:%Y-%m}" for d in piv.index], "series": {c: [None if pd.isna(v) else round(v, 2) for v in piv[c]] for c in piv.columns}}
chg = {}
for c in piv.columns:
    s = piv[c].dropna()
    b = s[(s.index.year == 2018)].mean() if (s.index.year == 2018).any() else s.iloc[:12].mean()
    yoy = s.iloc[-1] / s[s.index == s.index[-1] - pd.DateOffset(years=1)].iloc[0] - 1 if (s.index == s.index[-1] - pd.DateOffset(years=1)).any() else np.nan
    chg[c] = {"latest": round(s.iloc[-1], 2), "vs_2018_avg_pct": round((s.iloc[-1] / b - 1) * 100, 1), "yoy_pct": round(yoy * 100, 1)}
R["trend_change"] = chg

# ---------- 3. Cost of nutrients by food (national, latest 3 months) ----------
q = Q.groupby(["food", "food_group"], as_index=False)[["php_per_10g_protein", "php_per_1000kcal", "php_per_mg_iron", "php_per_100ug_vitA", "php_per_100mg_calcium", "price_per_100g_ap", "ep_pct"]].mean()
prot = q.dropna(subset=["php_per_10g_protein"]).sort_values("php_per_10g_protein")
prot = prot[prot.food_group.isin(["meat", "fish & seafood", "eggs", "pulses & nuts", "cereals"])]
R["protein_cost"] = prot[["food", "food_group", "php_per_10g_protein", "ep_pct"]].round(2).to_dict("records")
top5 = {}
for col, lab in [("php_per_1000kcal", "Energy (1,000 kcal)"), ("php_per_10g_protein", "Protein (10 g)"), ("php_per_mg_iron", "Iron (1 mg)"),
                 ("php_per_100ug_vitA", "Vitamin A (100 µg RAE)"), ("php_per_100mg_calcium", "Calcium (100 mg)")]:
    t = q[q.food_group != "sugar"].dropna(subset=[col]).nsmallest(5, col)  # sugar excluded: nutrient-poor, would top calcium via brown sugar
    top5[lab] = [{"food": f, "php": round(v, 2)} for f, v in zip(t.food, t[col])]
R["top5_national"] = top5

# ---------- 4. Protein cost over time: cheapest plant vs typical animal source ----------
def mo(series): return series.groupby(nat.date).mean()
grp = nat.assign(kind=np.where(nat.food_group.isin(["meat", "fish & seafood", "eggs"]), "animal", np.where(nat.food_group == "pulses & nuts", "pulse", "other")))
pm = grp[grp.kind != "other"].groupby(["date", "kind"]).php_per_10g_protein.median().unstack()
egg = nat[nat.psa_commodity == "FRESH EGG, CHICKEN, MEDIUM, 1 PC"].set_index("date").php_per_10g_protein
mung = nat[nat.psa_commodity == "MONGGO, GREEN, 1 KG"].set_index("date").php_per_10g_protein
R["protein_trend"] = {"dates": [f"{d:%Y-%m}" for d in pm.index], "animal_median": pm.animal.round(2).tolist(),
                      "mung": [round(mung.get(d, np.nan), 2) for d in pm.index], "egg": [round(egg.get(d, np.nan), 2) for d in pm.index]}

# ---------- 5. Regional protein cost (latest 12 months) ----------
last12 = reg[(reg.date > LATEST - pd.DateOffset(months=12)) & (reg.region_key != "NIR")]
rp = last12[last12.food_group.isin(["meat", "fish & seafood", "eggs"])].groupby(["region_key", "food"]).php_per_10g_protein.mean().groupby("region_key").agg(["min", "median"])
rp["cheapest_food"] = last12[last12.food_group.isin(["meat", "fish & seafood", "eggs"])].groupby(["region_key", "food"]).php_per_10g_protein.mean().groupby("region_key").idxmin().str[1]
rice = last12[last12.psa_commodity == "RICE, REGULAR-MILLED, 1 KG"].groupby("region_key").price.mean()
rp = rp.join(rice.rename("rice_kg")).reset_index()
rp["region"] = rp.region_key.map(SHORT)
R["regional_protein"] = rp.sort_values("median").round(2).to_dict("records")

# ---------- 6. FIES deciles (population-weighted per-capita income deciles) ----------
dec = []
for (yr, dcl), x in fies.groupby(["year", "pop_decile"]):
    w = x.rfact
    ft = th.set_index("region_key")
    dec.append({"year": int(yr), "decile": int(dcl),
        "food_share_income": (x.food * w).sum() / (x.toinc * w).sum(),
        "food_php_pc_day": (x.food * w).sum() / (x.fsize * w).sum() / 365,
        "cereal_share_home": (x.bread * w).sum() / (x.food_home * w).sum(),
        "meat_share_home": (x.meat * w).sum() / (x.food_home * w).sum(),
        "fish_share_home": (x.fish * w).sum() / (x.food_home * w).sum(),
        "milk_eggs_share_home": (x.milk * w).sum() / (x.food_home * w).sum(),
        "veg_fruit_share_home": ((x.veg + x.fruit) * w).sum() / (x.food_home * w).sum(),
        "outside_share_food": (x.food_outside * w).sum() / (x.food * w).sum()})
dec = pd.DataFrame(dec)
# share of persons whose per-capita FOOD SPENDING is below their region's food threshold
fies["ft"] = [th.set_index("region_key").loc[r, f"food_threshold_{y}"] for r, y in zip(fies.region_key, fies.year)]
fies["below_ft_spend"] = (fies.food / fies.fsize) < fies.ft
b = fies.groupby(["year", "pop_decile"]).apply(lambda x: np.average(x.below_ft_spend, weights=x.person_weight), include_groups=False).rename("pct_persons_food_spend_below_ft").reset_index()
dec = dec.merge(b.rename(columns={"pop_decile": "decile"}), on=["year", "decile"])
R["deciles"] = dec.round(4).to_dict("records")
R["below_ft_national"] = {int(y): round(float(np.average(d.below_ft_spend, weights=d.person_weight)), 4) for y, d in fies.groupby("year")}

# ---------- 7. Region-year merged view ----------
ry2 = ry.merge(th[["region_key", "poverty_incidence_fam_pct_2021", "poverty_incidence_fam_pct_2023"]], on="region_key")
ry2["poverty_incidence_fam_pct"] = np.where(ry2.year == 2021, ry2.poverty_incidence_fam_pct_2021, ry2.poverty_incidence_fam_pct_2023)
R["region_year"] = ry2[["year", "region_key", "region_short", "food_share_income_agg", "food_pc_day_mean", "cereal_share_home_agg", "animal_src_share_home_agg",
                        "food_threshold_pc_yr", "pct_pop_food_spend_below_ft", "poverty_incidence_fam_pct", "rice_regular_php_kg", "median_animal_protein_php_10g"]].round(4).to_dict("records")
r23 = ry2[ry2.year == 2023]
R["corr_2023"] = {"food_share_vs_poverty": round(r23.food_share_income_agg.corr(r23.poverty_incidence_fam_pct), 3),
                  "cereal_share_vs_poverty": round(r23.cereal_share_home_agg.corr(r23.poverty_incidence_fam_pct), 3),
                  "below_ft_vs_poverty": round(r23.pct_pop_food_spend_below_ft.corr(r23.poverty_incidence_fam_pct), 3)}
# 2021 -> 2023 growth: food threshold vs nominal food spending per capita
g = ry2.pivot_table(index="region_key", columns="year", values=["food_threshold_pc_yr", "food_pc_day_mean"])
gg = pd.DataFrame({"ft_growth": g["food_threshold_pc_yr"][2023] / g["food_threshold_pc_yr"][2021] - 1,
                   "food_spend_growth": g["food_pc_day_mean"][2023] / g["food_pc_day_mean"][2021] - 1}).dropna()
gg["region"] = gg.index.map(SHORT)
R["growth_21_23"] = gg.reset_index().round(4).to_dict("records")
nat_th = th.set_index("region_key").loc["PH"]
nfood = fies.groupby("year").apply(lambda x: (x.food * x.rfact).sum() / (x.fsize * x.rfact).sum(), include_groups=False)
R["growth_national"] = {"ft": round(nat_th.food_threshold_2023 / nat_th.food_threshold_2021 - 1, 4), "food_spend_pc": round(nfood[2023] / nfood[2021] - 1, 4)}

# ---------- 8. Validation PSA vs WFP ----------
v = val.groupby("psa_commodity").agg(n=("ape", "size"), mape=("ape", "mean"), median_ape=("ape", "median"),
                                     bias=("psa_price_wfp_unit", "mean"), wfp=("wfp_price", "mean")).reset_index()
v["bias_pct"] = v.bias / v.wfp - 1
v["food"] = v.psa_commodity.map(nice)
v = v.sort_values("mape")
R["validation"] = {"overall_mape": round(val.ape.mean(), 4), "overall_median_ape": round(val.ape.median(), 4), "n": int(len(val)),
                   "share_foods_under_15": round(float((v.mape < 0.15).mean()), 3), "by_food": v[["food", "n", "mape", "bias_pct"]].round(4).to_dict("records"),
                   "period": f"{val.date.min():%Y-%m} to {val.date.max():%Y-%m}"}
# ---------- 9. Data-quality facts ----------
R["dq"] = {"fct_entries": int(len(pd.read_csv(os.path.join(C, "philfct_nutrients.csv")))), "foods_in_panel": int(panel.psa_commodity.nunique()),
           "proxy_foods": int((xw.match_type == "proxy").sum()), "outlier_rate": round(float(panel.outlier_flag.mean()), 4)}
json.dump(R, open(OUTJ, "w"), indent=1, default=float)
print(json.dumps({k: R[k] for k in ["latest_month", "coverage_summary", "trend_change", "top5_national", "below_ft_national", "corr_2023", "growth_national", "dq"]}, indent=1, default=float))
print(pd.DataFrame(R["protein_cost"]).to_string()); print(dec[dec.year == 2023].round(3).to_string())
print(v[["food", "n", "mape", "bias_pct"]].round(3).to_string()); print(rp.round(2).to_string())
