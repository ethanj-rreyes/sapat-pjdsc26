"""SAPAT Cost of Nutritious Diet (CoND) index and early-warning alerts.

For every region and month, solve the cheapest plan that meets the PDRI needs of a reference family of five
(father 35, mother 32, children 10, 7 and 3) at that month's regional prices. Output: PHP per person per day.

Alert rule (for LGU nutrition offices): a region is on WATCH when CoND is >= 5% above its own average of the
previous 3 months, and on ALERT when >= 10% above it or >= 15% above the same month last year.

Usage: python scripts/compute_index.py   ->  outputs/cond_index.csv
"""
import os
import sys
import time

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sapat.data import ROOT, food_table, price_cube, regions  # noqa: E402
from sapat.model import solve  # noqa: E402
from sapat.needs import REFERENCE_HOUSEHOLD  # noqa: E402


def main():
    est, _ = price_cube()
    months = sorted(est.index.get_level_values(1).unique())
    rows = []
    t0 = time.time()
    for r in ["PH"] + [x for x in regions()]:
        for d in months:
            ds = d.strftime("%Y-%m")
            f = food_table(r, ds)
            if len(f) < 20:
                continue
            p = solve(REFERENCE_HOUSEHOLD, f)
            cov = p.coverage
            p2 = solve(REFERENCE_HOUSEHOLD, f, ignore={"calcium_mg"})
            rows.append(dict(region_key=r, month=ds, cond_pp_day=p.cost_day / len(REFERENCE_HOUSEHOLD),
                             cond_no_calcium_pp_day=p2.cost_day / len(REFERENCE_HOUSEHOLD),
                             n_foods=len(f), min_coverage=float(cov.drop(columns="iron_mg").min().min()),
                             protein_share_cost=float((p.grams.sum() * f.price_g)[f.group.isin(["meat", "fish", "eggs", "pulses"])].sum() / p.cost_day)))
        print(r, f"{time.time() - t0:.0f}s", flush=True)
    df = pd.DataFrame(rows).sort_values(["region_key", "month"])
    g = df.groupby("region_key").cond_pp_day
    df["vs_prev3"] = df.cond_pp_day / g.transform(lambda s: s.shift(1).rolling(3, min_periods=2).mean()) - 1
    df["yoy"] = df.cond_pp_day / g.shift(12) - 1
    df["level"] = "normal"
    df.loc[df.vs_prev3 >= 0.05, "level"] = "watch"
    df.loc[(df.vs_prev3 >= 0.10) | (df.yoy >= 0.15), "level"] = "alert"
    out = os.path.join(ROOT, "outputs", "cond_index.csv")
    df.to_csv(out, index=False, float_format="%.4f")
    print("wrote", out, len(df))


if __name__ == "__main__":
    main()
