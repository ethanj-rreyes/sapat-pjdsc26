"""What a household's budget buys today when spent the way FIES says households at that income level spend it.

FIES records pesos by food group, not quantities, so each group's pesos are spread over a few
representative foods (below), priced at current regional prices. Oil and "food not elsewhere
classified" are bought as before but carry no tracked nutrients. Food is assumed to be shared in
proportion to each member's energy need (one family pot).
"""
from __future__ import annotations

import os
from functools import lru_cache

import numpy as np
import pandas as pd

from .data import DATA
from .needs import NUTRIENTS, Member, member_needs

# FIES group -> representative foods and their within-group peso shares
TYPICAL_MIX = {
    "bread": {"rice_rm": 1.0},
    "meat": {"chicken": 0.5, "pork_kasim": 0.5},
    "fish": {"galunggong": 0.5, "tilapia": 0.5},
    "milk": {"egg": 1.0},  # FIES "milk, cheese and eggs"; no milk in the PSA retail list, eggs used
    "fruit": {"latundan": 0.6, "saba": 0.4},
    "veg": {"monggo": 0.15, "repolyo": 0.2, "talong": 0.2, "sitaw": 0.15, "kalabasa": 0.15, "tomato": 0.15},
    "sugar": {"sugar_w": 1.0},
}
FALLBACK = {"rice_rm": "rice_wm", "tilapia": "bangus", "latundan": "lakatan", "saba": "lakatan", "sitaw": "baguio"}
UNTRACKED = ["oil", "food_nec"]
GROUPS = list(TYPICAL_MIX) + UNTRACKED


@lru_cache(maxsize=1)
def decile_budgets(year: int = 2023) -> pd.DataFrame:
    """Per region and national income decile: home food spending per person per day and group shares."""
    f = pd.read_csv(os.path.join(DATA, "fies_households_2021_2023.csv.gz"))
    f = f[f.year == year]
    rows = []
    for (rk, dec), d in list(f.groupby(["region_key", "pop_decile"])) + [(("PH", k), v) for k, v in f.groupby("pop_decile")]:
        w = d.rfact
        home = (d.food_home * w).sum()
        r = dict(region_key=rk, decile=int(dec), n=len(d),
                 food_home_pc_day=(d.food_home * w).sum() / (d.fsize * w).sum() / 365)
        for g in GROUPS:
            r[f"share_{g}"] = (d[g] * w).sum() / home
        rows.append(r)
    return pd.DataFrame(rows)


def typical_supply(budget_day: float, shares: dict, foods: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
    """Nutrients bought per day and grams per food, spending `budget_day` with FIES group `shares`."""
    grams = pd.Series(0.0, index=foods.index)
    tracked = sum(shares[g] for g in TYPICAL_MIX)
    for g, mix in TYPICAL_MIX.items():
        pesos = budget_day * shares[g] / (tracked + sum(shares[u] for u in UNTRACKED))
        avail = {}
        for k, w in mix.items():
            k2 = k if k in foods.index else FALLBACK.get(k)
            if k2 in foods.index:
                avail[k2] = avail.get(k2, 0) + w
        tot = sum(avail.values())
        for k, w in avail.items():
            grams[k] += pesos * w / tot / foods.loc[k, "price_g"]
    supply = pd.Series({k: float((grams * foods[k]).sum()) for k in NUTRIENTS})
    return supply, grams[grams > 0]


def typical_coverage(members: list[Member], budget_day: float, shares: dict, foods: pd.DataFrame) -> pd.DataFrame:
    supply, _ = typical_supply(budget_day, shares, foods)
    needs = pd.DataFrame([member_needs(m).values for m in members], index=[m.name for m in members])
    share = needs.energy_kcal / needs.energy_kcal.sum()
    supplied = pd.DataFrame({k: supply[k] * share for k in NUTRIENTS})
    return (supplied / needs).clip(upper=9.99)


def tracked_share(shares: dict) -> float:
    return sum(shares[g] for g in TYPICAL_MIX) / sum(shares[g] for g in GROUPS)
