"""Mentor follow-up A: adequacy per nutrient and per person (not just the average).

Re-runs the H1 comparison (17 regions x deciles 1-3, reference family of five, Sept 2026 prices) and keeps the
full member x nutrient table, then does the same for the Tita Baby persona (Leyte/R08, PHP 1,290 a week).
Also reports how varied the SAPAT plans are (number of foods, share of cost on the top 3 foods).

Usage: python scripts/mentor_a_per_nutrient.py -> outputs/mentor/a_*.csv
"""
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sapat.data import ROOT, food_table, regions  # noqa: E402
from sapat.model import solve  # noqa: E402
from sapat.needs import NUTRIENTS, REFERENCE_HOUSEHOLD, Member  # noqa: E402
from sapat.typical import GROUPS, decile_budgets, tracked_share, typical_coverage  # noqa: E402

MONTH = "2026-09"
OUT = os.path.join(ROOT, "outputs", "mentor")
os.makedirs(OUT, exist_ok=True)

TITA_BABY = [
    Member("Jun (38, tatay)", 38, "M"),
    Member("Baby (34, buntis)", 34, "F", "pregnant"),
    Member("Mika (8)", 8, "F"),
    Member("Paolo (4)", 4, "M"),
    Member("Ana (1)", 1, "F"),
]


def long_table(tab, **keys):
    t = tab.clip(upper=1).stack().rename("adequacy").reset_index()
    t.columns = ["member", "nutrient", "adequacy"]
    for k, v in keys.items():
        t[k] = v
    return t


def variety(plan):
    cost = (plan.grams.sum() * plan.foods.price_g)
    cost = cost[cost > 0.01].sort_values(ascending=False)
    g = plan.grams.sum()
    return dict(n_foods=int((g > 0.5).sum()), top3_cost_share=float(cost.head(3).sum() / cost.sum()),
                top3=", ".join(plan.foods.loc[cost.head(3).index, "name"]),
                n_groups=int(plan.foods.loc[g[g > 0.5].index, "group"].nunique()))


def main():
    idx = pd.read_csv(os.path.join(ROOT, "outputs", "cond_index.csv"))
    base23 = idx[idx.month.str.startswith("2023")].groupby("region_key").cond_pp_day.mean()
    now = idx[idx.month == MONTH].set_index("region_key").cond_pp_day
    db = decile_budgets(2023)
    H = REFERENCE_HOUSEHOLD
    rows, var = [], []
    for r in regions():
        if r == "NIR" or r not in now.index:
            continue
        f = food_table(r, MONTH)
        infl = now[r] / base23[r]
        for dec in (1, 2, 3):
            x = db[(db.region_key == r) & (db.decile == dec)].iloc[0]
            sh = {g: x[f"share_{g}"] for g in GROUPS}
            B = x.food_home_pc_day * len(H) * infl
            typ = typical_coverage(H, B, sh, f)
            p = solve(H, f, budget_day=B * tracked_share(sh))
            rows.append(long_table(typ, region=r, decile=dec, scenario="typical"))
            rows.append(long_table(p.coverage, region=r, decile=dec, scenario="sapat"))
            var.append(dict(region=r, decile=dec, **variety(p)))
    df = pd.concat(rows, ignore_index=True)
    df.to_csv(os.path.join(OUT, "a_member_nutrient_h1.csv"), index=False, float_format="%.4f")
    pd.DataFrame(var).to_csv(os.path.join(OUT, "a_plan_variety_h1.csv"), index=False, float_format="%.4f")

    # Tita Baby: Leyte (R08), PHP 1,290/week
    f = food_table("R08", MONTH)
    B = 1290 / 7
    p = solve(TITA_BABY, f, budget_day=B)
    # typical: R08 decile-1 FIES shares at the same pesos
    x = db[(db.region_key == "R08") & (db.decile == 1)].iloc[0]
    sh = {g: x[f"share_{g}"] for g in GROUPS}
    typ = typical_coverage(TITA_BABY, B / tracked_share(sh), sh, f)  # same pesos on tracked food as SAPAT
    tb = pd.concat([long_table(typ, scenario="typical"), long_table(p.coverage, scenario="sapat")])
    tb.to_csv(os.path.join(OUT, "a_member_nutrient_titababy.csv"), index=False, float_format="%.4f")
    full = solve(TITA_BABY, f)
    pd.DataFrame([dict(budget_week=1290, full_cost_week=full.cost_day * 7, **variety(p))]).to_csv(
        os.path.join(OUT, "a_titababy_summary.csv"), index=False, float_format="%.2f")
    p.market_list().to_csv(os.path.join(OUT, "a_titababy_market_list.csv"), index=False, float_format="%.2f")
    print("Tita Baby full healthy week:", round(full.cost_day * 7))
    print("Tita Baby SAPAT coverage (uncapped):\n", (p.coverage * 100).round(0).to_string())
    print("Tita Baby typical coverage (uncapped):\n", (typ * 100).round(0).to_string())


if __name__ == "__main__":
    main()
