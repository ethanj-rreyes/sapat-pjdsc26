"""H1: at the food budget of low-income households, does a SAPAT plan cover more of each member's needs than
the same pesos spent the way FIES shows those households spend them?

For each of the 17 regions and income deciles 1-3 (FIES 2023 home food spending per person, scaled to
September 2026 prices with the region's SAPAT cost index), we compare for the reference family of five:
  typical : the budget spent with the decile's FIES food-group shares (sapat/typical.py)
  SAPAT   : the same pesos (minus oil and other untracked items) in budget mode (sapat/model.py)
Adequacy is coverage capped at 100%; the mean adequacy ratio (MAR) averages the five nutrients.

Usage: python scripts/h1_typical_vs_sapat.py  -> outputs/h1_results.csv, docs/figures/h1_*.png
"""
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sapat.data import ROOT, food_table, regions  # noqa: E402
from sapat.model import solve  # noqa: E402
from sapat.needs import NUTRIENT_LABELS, NUTRIENTS, REFERENCE_HOUSEHOLD  # noqa: E402
from sapat.typical import GROUPS, decile_budgets, tracked_share, typical_coverage  # noqa: E402

MONTH = "2026-09"


def main():
    idx = pd.read_csv(os.path.join(ROOT, "outputs", "cond_index.csv"))
    base23 = idx[idx.month.str.startswith("2023")].groupby("region_key").cond_pp_day.mean()
    now = idx[idx.month == MONTH].set_index("region_key").cond_pp_day
    db = decile_budgets(2023)
    H = REFERENCE_HOUSEHOLD
    rows = []
    for r in regions():
        if r == "NIR" or r not in now.index:
            continue
        f = food_table(r, MONTH)
        infl = now[r] / base23[r]
        for dec in (1, 2, 3):
            x = db[(db.region_key == r) & (db.decile == dec)].iloc[0]
            sh = {g: x[f"share_{g}"] for g in GROUPS}
            B = x.food_home_pc_day * len(H) * infl
            typ = typical_coverage(H, B, sh, f).clip(upper=1)
            p = solve(H, f, budget_day=B * tracked_share(sh))
            sap = p.coverage.clip(upper=1)
            for who, tab in (("typical", typ), ("sapat", sap)):
                row = dict(region=r, decile=dec, budget_pp_day=B / len(H), scenario=who, mar=float(tab.values.mean()),
                           mar_child3=float(tab.loc["Child (3)"].mean()), mar_mother=float(tab.loc["Mother"].mean()))
                for k in NUTRIENTS:
                    row[k] = float(tab[k].mean())
                rows.append(row)
    df = pd.DataFrame(rows)
    df.to_csv(os.path.join(ROOT, "outputs", "h1_results.csv"), index=False, float_format="%.4f")

    # Summary (decile 1, mean over regions)
    d1 = df[df.decile == 1].groupby("scenario")[NUTRIENTS + ["mar", "mar_child3", "mar_mother"]].mean()
    print("Decile 1, mean of 17 regions (share of needs met, capped at 100%):")
    print((d1 * 100).round(1).T.to_string())
    w = df.pivot_table(index=["region", "decile"], columns="scenario", values="mar")
    print(f"SAPAT MAR higher in {(w.sapat > w.typical).mean() * 100:.0f}% of region-decile cases; "
          f"mean gain {((w.sapat - w.typical) * 100).mean():.1f} points")
    print(f"Decile-1 budget, per person per day at {MONTH} prices: PHP {df[df.decile == 1].budget_pp_day.min():.0f}-{df[df.decile == 1].budget_pp_day.max():.0f}")

    # Figure 1: nutrient adequacy, decile 1
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=200)
    labels = [NUTRIENT_LABELS[k] for k in NUTRIENTS] + ["Average (MAR)"]
    typ = list(d1.loc["typical", NUTRIENTS]) + [d1.loc["typical", "mar"]]
    sap = list(d1.loc["sapat", NUTRIENTS]) + [d1.loc["sapat", "mar"]]
    xs = range(len(labels))
    ax.bar([i - 0.2 for i in xs], [v * 100 for v in typ], 0.38, color="#B8B2A7", label="Typical spending (FIES pattern)")
    ax.bar([i + 0.2 for i in xs], [v * 100 for v in sap], 0.38, color="#2E7D4F", label="SAPAT plan, same pesos")
    for i, (a, b) in enumerate(zip(typ, sap)):
        ax.text(i - 0.2, a * 100 + 1.5, f"{a * 100:.0f}", ha="center", fontsize=8, color="#555")
        ax.text(i + 0.2, b * 100 + 1.5, f"{b * 100:.0f}", ha="center", fontsize=8, color="#1d5236", fontweight="bold")
    ax.set_xticks(list(xs), labels, fontsize=9)
    ax.set_ylim(0, 105)
    ax.set_ylabel("Share of needs met (%)")
    ax.set_title("Poorest 10%: same budget, more of each family member's needs met", fontsize=11, loc="left")
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, fontsize=8, loc="upper right")
    fig.text(0.01, 0.01, "Reference family of five, 17 regions, Sept 2026 prices; FIES 2023 decile-1 food budget scaled with the SAPAT cost index. Coverage capped at 100%.", fontsize=6.5, color="#666")
    fig.tight_layout(rect=(0, 0.03, 1, 1))
    fig.savefig(os.path.join(ROOT, "docs", "figures", "h1_adequacy_decile1.png"))

    # Figure 2: cost index trend, national and a few regions
    fig, ax = plt.subplots(figsize=(8, 3.6), dpi=200)
    for r, col in (("PH", "#2E7D4F"), ("NCR", "#C0582B"), ("R08", "#3B6EA8"), ("BARMM", "#8A6D3B")):
        d = idx[idx.region_key == r]
        ax.plot(pd.to_datetime(d.month), d.cond_pp_day, color=col, lw=1.6, label={"PH": "Philippines", "R08": "Eastern Visayas"}.get(r, r))
    ph = idx[idx.region_key == "PH"]
    ax.plot(pd.to_datetime(ph.month), ph.cond_no_calcium_pp_day, color="#2E7D4F", lw=1, ls="--", label="Philippines, without calcium")
    ax.set_ylabel("PHP per person per day")
    ax.set_title("SAPAT cost of a nutritious diet, reference family of five", fontsize=11, loc="left")
    ax.spines[["top", "right"]].set_visible(False)
    ax.legend(frameon=False, fontsize=8, ncol=3)
    fig.tight_layout()
    fig.savefig(os.path.join(ROOT, "docs", "figures", "cond_index_trend.png"))
    print("figures written")


if __name__ == "__main__":
    main()
