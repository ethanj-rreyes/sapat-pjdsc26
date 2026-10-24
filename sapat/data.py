"""Load the cleaned SAPAT data and build the food table for one region and month."""
from __future__ import annotations

import os
from functools import lru_cache

import numpy as np
import pandas as pd

from .foods import EXCLUDED, FOODS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data_clean")

NUTR_COLS = {  # planner nutrient -> PhilFCT column (per 100 g edible portion)
    "energy_kcal": "energy_kcal",
    "protein_g": "protein_g",
    "iron_mg": "iron_mg",
    "vit_a_ug": "vit_a_rae_ug",
    "calcium_mg": "calcium_mg",
}
CARRY_MONTHS = 6  # carry a regional price forward for up to 6 months


@lru_cache(maxsize=1)
def load_panel() -> pd.DataFrame:
    p = pd.read_csv(os.path.join(DATA, "nutrient_price_panel.csv.gz"), parse_dates=["date"])
    p = p[p.psa_commodity.isin(FOODS) & ~p.psa_commodity.isin(EXCLUDED)].copy()
    p["food_key"] = p.psa_commodity.map(lambda c: FOODS[c][0])
    return p


@lru_cache(maxsize=1)
def food_meta() -> pd.DataFrame:
    p = load_panel()
    meta = p.drop_duplicates("food_key").set_index("food_key")
    rows = []
    for c, (key, name, group, cap, unit, gpu) in FOODS.items():
        if key not in meta.index:
            continue
        m = meta.loc[key]
        r = dict(key=key, name=name, group=group, cap=cap, unit=unit, grams_per_unit=gpu,
                 psa_commodity=c, fct_id=m.fct_food_id, ep_pct=m.ep_pct)
        for k, col in NUTR_COLS.items():
            # nutrient per gram AS PURCHASED = per-100 g edible value x edible share / 100
            r[k] = float(m[col]) * float(m.ep_pct) / 100.0 / 100.0
        rows.append(r)
    return pd.DataFrame(rows).set_index("key")


@lru_cache(maxsize=1)
def price_cube() -> pd.DataFrame:
    """Wide table: index (region_key, date), columns food_key, values PHP per gram as purchased,
    with the fallback rules applied. A parallel table holds the source flag."""
    p = load_panel()
    wide = p.pivot_table(index=["region_key", "date"], columns="food_key", values="price_per_100g_ap", aggfunc="mean") / 100.0
    regions = wide.index.get_level_values(0).unique()
    dates = pd.date_range(p.date.min(), p.date.max(), freq="MS")
    full = wide.reindex(pd.MultiIndex.from_product([regions, dates], names=["region_key", "date"]))
    obs = full.notna()
    carried = full.groupby(level=0).ffill(limit=CARRY_MONTHS)
    nat = carried.xs("PH", level=0)
    est = carried.copy()
    src = pd.DataFrame(np.where(obs, "observed", np.where(carried.notna(), "recent", "")), index=full.index, columns=full.columns)
    for r in regions:
        if r == "PH":
            continue
        reg = carried.xs(r, level=0)
        ratio = (reg / nat).rolling(12, min_periods=1).median().median(axis=1)  # region price level vs national
        fill = nat.mul(ratio, axis=0)
        cur = est.loc[r]
        mask = cur.isna() & fill.notna()
        est.loc[r] = cur.where(~mask, fill).values
        s = src.loc[r]
        src.loc[r] = s.where(~mask.values, "estimated").values
    return est, src


def regions() -> list[str]:
    return list(pd.read_csv(os.path.join(DATA, "region_crosswalk.csv")).region_key)


def food_table(region: str, date: str, include_estimated: bool = False) -> pd.DataFrame:
    """Foods available in `region` in month `date` (YYYY-MM), with price per gram and nutrients per gram."""
    est, src = price_cube()
    d = pd.Timestamp(date + "-01") if len(date) == 7 else pd.Timestamp(date)
    price = est.loc[(region, d)]
    source = src.loc[(region, d)]
    t = food_meta().copy()
    t["price_g"] = price.reindex(t.index)
    t["source"] = source.reindex(t.index)
    ok = t.source.isin(["observed", "recent"] + (["estimated"] if include_estimated else []))
    return t[ok & t.price_g.notna()]
