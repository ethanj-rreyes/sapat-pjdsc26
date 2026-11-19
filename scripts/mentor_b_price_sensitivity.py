"""Mentor follow-up B: how sensitive are SAPAT plans to errors in PSA prices?

Error model, taken from our own validation (data_clean/validation_psa_vs_wfp.csv, 28,937 PSA-WFP pairs):
each food's price is multiplied by exp(e), where e is drawn at random from the observed log(WFP/PSA) gaps,
centred on zero (sd 0.166; MAPE 10.7%). Each food gets its own independent draw, which is harsher than
reality, where prices of the same market tend to move together.
Plus three systematic shifts (all prices -10%, +10%, +20%: e.g. buying at a sari-sari store or supermarket).

For the reference family at the decile-1 budget in all 17 regions (N_DRAWS draws each) and for Tita Baby:
  - SAPAT and typical-spending adequacy at the perturbed prices (does SAPAT still win?)
  - how much of the shopping list (by pesos) stays the same
  - the cost of a fully healthy week (full mode)

Usage: python scripts/mentor_b_price_sensitivity.py -> outputs/mentor/b_*.csv
"""
import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sapat.data import DATA, ROOT, food_table, regions  # noqa: E402
from sapat.model import solve  # noqa: E402
from sapat.needs import REFERENCE_HOUSEHOLD  # noqa: E402
from sapat.typical import GROUPS, decile_budgets, tracked_share, typical_coverage  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mentor_a_per_nutrient import TITA_BABY  # noqa: E402

MONTH = "2026-09"
N_DRAWS = 200
OUT = os.path.join(ROOT, "outputs", "mentor")
rng = np.random.default_rng(2026)

v = pd.read_csv(os.path.join(DATA, "validation_psa_vs_wfp.csv"))
LR = np.log(v.wfp_price / v.psa_price_wfp_unit).to_numpy()
LR = LR - LR.mean()


def basket(plan):
    c = plan.grams.sum() * plan.foods.price_g
    return c[c > 0.01] / c.sum()


def overlap(a, b):
    """Share of pesos spent on the same foods (sum of min of the two cost shares)."""
    return float(pd.concat([a, b], axis=1).fillna(0).min(axis=1).sum())


def run_case(label, members, f, B_track, B_typ, sh, scenarios):
    base = solve(members, f, budget_day=B_track)
    base_b = basket(base)
    rows = []
    for name, mult in scenarios:
        g = f.copy()
        g["price_g"] = f.price_g * mult(len(f))
        p = solve(members, g, budget_day=B_track)
        typ = typical_coverage(members, B_typ, sh, g).clip(upper=1)
        cov = p.coverage.clip(upper=1)
        full = solve(members, g)
        rows.append(dict(case=label, scenario=name, mar_sapat=float(cov.values.mean()),
                         mar_typical=float(typ.values.mean()),
                         youngest_sapat=float(cov.iloc[-1].mean()), mother_sapat=float(cov.iloc[1].mean()),
                         list_overlap=overlap(base_b, basket(p)), full_cost_week=full.cost_day * 7))
    return rows


def scenarios():
    s = [("baseline", lambda n: np.ones(n))]
    s += [(f"random_{i:03d}", lambda n: np.exp(rng.choice(LR, n))) for i in range(N_DRAWS)]
    s += [(f"all{d:+d}%", (lambda d: lambda n: np.full(n, 1 + d / 100))(d)) for d in (-10, 10, 20)]
    return s


def main():
    idx = pd.read_csv(os.path.join(ROOT, "outputs", "cond_index.csv"))
    base23 = idx[idx.month.str.startswith("2023")].groupby("region_key").cond_pp_day.mean()
    now = idx[idx.month == MONTH].set_index("region_key").cond_pp_day
    db = decile_budgets(2023)
    rows = []
    for r in regions():
        if r == "NIR" or r not in now.index:
            continue
        f = food_table(r, MONTH)
        x = db[(db.region_key == r) & (db.decile == 1)].iloc[0]
        sh = {g: x[f"share_{g}"] for g in GROUPS}
        B = x.food_home_pc_day * 5 * now[r] / base23[r]
        rows += run_case(r, REFERENCE_HOUSEHOLD, f, B * tracked_share(sh), B, sh, scenarios())
        print(r, flush=True)
    f = food_table("R08", MONTH)
    x = db[(db.region_key == "R08") & (db.decile == 1)].iloc[0]
    sh = {g: x[f"share_{g}"] for g in GROUPS}
    B = 1290 / 7
    rows += run_case("TitaBaby_R08", TITA_BABY, f, B, B / tracked_share(sh), sh, scenarios())
    df = pd.DataFrame(rows)
    df.to_csv(os.path.join(OUT, "b_price_sensitivity.csv"), index=False, float_format="%.4f")


if __name__ == "__main__":
    main()
