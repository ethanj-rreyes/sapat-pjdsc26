"""Mentor follow-up D: cost of a nutritious diet and what PHP 66/person/day buys, as ranges, not averages.

Sep 2026 PSA prices, 17 regions x 7 household types (full mode = cheapest fully nutritious diet;
budget mode = best plan at PHP 66 per person per day). Province range from the LGU dashboard series
(reference family only). Usage: python scripts/mentor_d_threshold_ranges.py -> outputs/mentor/d_*.csv
"""
import os, sys
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sapat.data import ROOT, food_table, regions
from sapat.model import solve
from sapat.needs import REFERENCE_HOUSEHOLD, Member

MONTH, LINE = "2026-09", 66.0
OUT = os.path.join(ROOT, "outputs", "mentor")
HH = {
    "Reference family of 5 (35, 32, 10, 7, 3)": REFERENCE_HOUSEHOLD,
    "Tita Baby: pregnant mother, father, kids 8, 4, 1": [Member("Jun", 38, "M"), Member("Baby", 34, "F", "pregnant"),
                                                        Member("Mika", 8, "F"), Member("Paolo", 4, "M"), Member("Ana", 1, "F")],
    "Young couple with kids 3 and 1": [Member("F", 30, "M"), Member("M", 28, "F"), Member("C3", 3, "F"), Member("C1", 1, "M")],
    "Breastfeeding mother with a 2-year-old": [Member("M", 25, "F", "lactating"), Member("C2", 2, "M")],
    "Large family of 7 with teens": [Member("F", 45, "M"), Member("M", 42, "F"), Member("B16", 16, "M"), Member("G14", 14, "F"),
                                     Member("B12", 12, "M"), Member("G9", 9, "F"), Member("B6", 6, "M")],
    "Single working man, 40": [Member("A", 40, "M")],
    "Older couple, 65 and 62": [Member("H", 65, "M"), Member("W", 62, "F")],
}

rows = []
for r in regions():
    if r in ("NIR", "PH"):
        continue
    f = food_table(r, MONTH)
    for name, mem in HH.items():
        n = len(mem)
        full = solve(mem, f)
        p = solve(mem, f, budget_day=LINE * n)
        cov = p.coverage.clip(upper=1)
        rows.append(dict(region=r, household=name, members=n, cond_pp_day=full.cost_day / n,
                         mar_at_line=float(cov.values.mean()), worst_member_mar=float(cov.mean(axis=1).min()),
                         cells_below_half=float((cov.values < 0.5).mean())))
d = pd.DataFrame(rows)
d.to_csv(os.path.join(OUT, "d_threshold_ranges.csv"), index=False, float_format="%.4f")
s = d.groupby("household").agg(cost_min=("cond_pp_day", "min"), cost_max=("cond_pp_day", "max"),
                               mar_min=("mar_at_line", "min"), mar_max=("mar_at_line", "max"),
                               worst_member_min=("worst_member_mar", "min"))
pd.set_option("display.width", 200)
print(s.round(3).to_string())
print("ALL: cost", round(d.cond_pp_day.min(), 1), round(d.cond_pp_day.max(), 1), "| mar", round(d.mar_at_line.min(), 3),
      round(d.mar_at_line.max(), 3), "| worst member", round(d.worst_member_mar.min(), 3), "| cost/line", round(d.cond_pp_day.min() / LINE, 2), round(d.cond_pp_day.max() / LINE, 2))
pv = pd.read_csv(os.path.join(OUT, "province_index_from_dashboard.csv"))
pv = pv[pv.month == MONTH]
print("PROVINCES (reference family):", len(pv), "min", pv.cond.min(), pv.loc[pv.cond.idxmin(), "key"], "max", pv.cond.max(), pv.loc[pv.cond.idxmax(), "key"])
