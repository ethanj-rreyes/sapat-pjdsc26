"""Mentor follow-up C: how often would the LGU alert rule raise a false alarm?

There is no official list of "real" food-price crises to score against, so a signal is judged by what happened
next: a signal is SUSTAINED if the cost of a nutritious diet two months later is still at least 5% above the
3-month average the signal was measured against (the rise lasted long enough for an LGU to act on), and
SHORT-LIVED otherwise (the price came back down on its own; a false alarm from an LGU's point of view).
Only the first month of each run of consecutive signals is counted, so one episode is one alarm.

Also sweeps the thresholds and lists how many regions each rule flags in three known episodes.

Run twice: region level (17 regions + NIR, outputs/cond_index.csv) and province level (the 83 province
series behind the LGU dashboard, exported from web/lgu-dashboard/data/ph_provinces.js to
outputs/mentor/province_index_from_dashboard.csv; its vs-3-month and year-on-year changes are used as the
dashboard shows them). Jan 2018 - Sep 2026.
Usage: python scripts/mentor_c_alert_false_alarms.py -> outputs/mentor/c_*.csv
"""
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sapat.data import ROOT  # noqa: E402

OUT = os.path.join(ROOT, "outputs", "mentor")
HORIZON = 2       # months ahead
SUSTAIN = 0.05    # still >= 5% above the pre-signal baseline
EPISODES = {"Pork shortage, Feb 2021": ["2021-01", "2021-02", "2021-03"],
            "Onion crisis, Dec 2022": ["2022-12", "2023-01"],
            "Rice spike, Aug-Sep 2023": ["2023-08", "2023-09"]}


def load(level):
    if level == "region":
        d = pd.read_csv(os.path.join(ROOT, "outputs", "cond_index.csv"))
        d = d[d.region_key != "PH"].copy()
    else:
        d = pd.read_csv(os.path.join(OUT, "province_index_from_dashboard.csv"))
        d = d.rename(columns={"key": "region_key", "cond": "cond_pp_day", "vs3": "vs_prev3"})
    d = d.sort_values(["region_key", "month"]).copy()
    g = d.groupby("region_key").cond_pp_day
    d["base3"] = g.transform(lambda s: s.shift(1).rolling(3, min_periods=2).mean())
    d["ahead"] = g.shift(-HORIZON)
    d["later_vs_base"] = d.ahead / d.base3 - 1
    return d


def episodes(flag, d):
    """First month of each run of consecutive flagged months, per region."""
    prev = flag.groupby(d.region_key).shift(1, fill_value=False)
    return flag & ~prev


def score(d, t_prev3, t_yoy=None):
    flag = d.vs_prev3 >= t_prev3
    if t_yoy is not None:
        flag |= d.yoy >= t_yoy
    flag &= d.later_vs_base.notna()
    start = episodes(flag, d)
    s = d[start]
    sustained = s.later_vs_base >= SUSTAIN
    region_years = d[d.vs_prev3.notna()].groupby("region_key").size().sum() / 12
    out = dict(rule=f">= {t_prev3 * 100:g}% vs 3-mo avg" + (f" or >= {t_yoy * 100:g}% y/y" if t_yoy else ""),
               flagged_months=int(flag.sum()), episodes=int(len(s)), sustained=int(sustained.sum()),
               short_lived=int((~sustained).sum()),
               short_lived_share=float((~sustained).mean()) if len(s) else float("nan"),
               false_alarms_per_region_year=float((~sustained).sum() / region_years))
    for name, months in EPISODES.items():
        out[name] = int(d[flag & d.month.isin(months)].region_key.nunique())
    return out, s.assign(sustained=sustained)


def run(level):
    d = load(level)
    current = [(0.05, None), (0.10, 0.15)]
    rows, detail = [], []
    for t, y in current:
        r, s = score(d, t, y)
        r["level"] = "Watch (current)" if y is None else "Alert (current)"
        rows.append(r)
        detail.append(s.assign(level=r["level"]))
    for t in (0.03, 0.05, 0.075, 0.10, 0.125, 0.15):
        r, _ = score(d, t)
        r["level"] = "sweep: 3-mo rule only"
        rows.append(r)
    res = pd.DataFrame(rows).assign(geography=level, units=d.region_key.nunique())
    det = pd.concat(detail)[["level", "region_key", "month", "cond_pp_day", "vs_prev3", "yoy", "later_vs_base", "sustained"]]
    return res, det.assign(geography=level)


def main():
    out = [run(g) for g in ("region", "province")]
    res = pd.concat([o[0] for o in out])
    res.to_csv(os.path.join(OUT, "c_alert_false_alarms.csv"), index=False, float_format="%.3f")
    pd.concat([o[1] for o in out]).to_csv(os.path.join(OUT, "c_alert_episodes.csv"), index=False, float_format="%.4f")
    pd.set_option("display.width", 250)
    print(res.drop(columns=["flagged_months"]).round(3).to_string(index=False))


if __name__ == "__main__":
    main()
