"""Charts for the mentor follow-up analyses (slide-ready PNGs, 16:9-friendly).

Usage: python scripts/mentor_charts.py -> outputs/mentor/fig_*.png
"""
import os
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sapat.data import ROOT  # noqa: E402

OUT = os.path.join(ROOT, "outputs", "mentor")
INK, MUTED, GRID, SURF = "#1d2a22", "#5f6b63", "#e4e7e2", "#fcfcfb"
GREEN, AMBER = "#2E7D4F", "#C48A2C"
SEQ = LinearSegmentedColormap.from_list("seq", ["#eef5ef", "#b9d9c0", "#6fae82", "#2E7D4F", "#174a2d"])
NUT = ["energy_kcal", "protein_g", "iron_mg", "vit_a_ug", "calcium_mg"]
NUT_L = ["Energy\n(Lakas)", "Protein\n(Paglaki)", "Iron\n(Dugo)", "Vitamin A\n(Mata)", "Calcium\n(Buto)"]
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11, "axes.edgecolor": GRID, "text.color": INK,
                     "axes.labelcolor": MUTED, "xtick.color": MUTED, "ytick.color": MUTED, "figure.facecolor": SURF,
                     "axes.facecolor": SURF})


def heat(ax, M, rows, title):
    ax.imshow(M, cmap=SEQ, vmin=0, vmax=100, aspect="auto")
    for i in range(M.shape[0]):
        for j in range(M.shape[1]):
            v = M[i, j]
            ax.text(j, i, f"{v:.0f}%", ha="center", va="center", fontsize=12, fontweight="bold" if v < 50 else "normal",
                    color="white" if v >= 62 else INK)
            if v < 50:
                ax.add_patch(plt.Rectangle((j - .47, i - .47), .94, .94, fill=False, ec="#b5452f", lw=1.6, ls=(0, (3, 2))))
    ax.set_xticks(range(5), NUT_L, fontsize=10)
    ax.set_yticks(range(len(rows)), rows, fontsize=11)
    ax.tick_params(length=0)
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xticks(np.arange(-.5, 5), minor=True)
    ax.set_yticks(np.arange(-.5, len(rows)), minor=True)
    ax.grid(which="minor", color=SURF, lw=3)
    ax.set_title(title, loc="left", fontsize=13, color=INK, pad=10)


def fig_titababy():
    t = pd.read_csv(os.path.join(OUT, "a_member_nutrient_titababy.csv"))
    rows = ["Jun (38, tatay)", "Baby (34, buntis)", "Mika (8)", "Paolo (4)", "Ana (1)"]
    fig, axs = plt.subplots(1, 2, figsize=(13, 4.6), dpi=200, sharey=True)
    for ax, sc, ttl in zip(axs, ["typical", "sapat"], ["Usual way of spending", "SAPAT plan, same ₱1,290"]):
        M = t[t.scenario == sc].pivot(index="member", columns="nutrient", values="adequacy").loc[rows, NUT].to_numpy() * 100
        heat(ax, M, rows, ttl)
    fig.suptitle("Tita Baby's family, Leyte: share of each person's needs met (capped at 100%)", x=.01, ha="left",
                 fontsize=14, fontweight="bold")
    fig.text(.01, .01, "Dashed box = below half of need. PSA Leyte prices, Sep 2026; PDRI 2015 needs; team computation. "
             "Baby's iron need (38 mg in pregnancy) is one PDRI says food alone cannot meet.", fontsize=8.5, color=MUTED)
    fig.tight_layout(rect=(0, .04, 1, .93))
    fig.savefig(os.path.join(OUT, "fig_a_titababy_per_person.png"))


def fig_reference():
    d = pd.read_csv(os.path.join(OUT, "a_member_nutrient_h1.csv"))
    d = d[d.decile == 1]
    rows = ["Father", "Mother", "Child (10)", "Child (7)", "Child (3)"]
    fig, axs = plt.subplots(1, 2, figsize=(13, 4.6), dpi=200, sharey=True)
    for ax, sc, ttl in zip(axs, ["typical", "sapat"], ["Usual way of spending", "SAPAT plan, same pesos"]):
        M = d[d.scenario == sc].groupby(["member", "nutrient"]).adequacy.mean().unstack().loc[rows, NUT].to_numpy() * 100
        heat(ax, M, rows, ttl)
    fig.suptitle("Poorest 10%, reference family of five: share of needs met, average of 17 regions", x=.01, ha="left",
                 fontsize=14, fontweight="bold")
    fig.text(.01, .01, "Dashed box = below half of need. FIES 2023 decile-1 food budget at Sep 2026 PSA prices; capped at 100%; team computation.",
             fontsize=8.5, color=MUTED)
    fig.tight_layout(rect=(0, .04, 1, .93))
    fig.savefig(os.path.join(OUT, "fig_a_reference_per_person.png"))


def fig_sensitivity():
    d = pd.read_csv(os.path.join(OUT, "b_price_sensitivity.csv"))
    d = d[d.case != "TitaBaby_R08"].copy()
    d["kind"] = d.scenario.str.replace(r"random_\d+", "random", regex=True)
    rows = [("Prices as PSA reports", d[d.kind == "baseline"]),
            ("Each price off by a random\nPSA-vs-WFP gap (3,400 runs)", d[d.kind == "random"]),
            ("All prices 10% higher", d[d.kind == "all+10%"]),
            ("All prices 20% higher\n(sari-sari / supermarket)", d[d.kind == "all+20%"]),
            ("All prices 10% lower", d[d.kind == "all-10%"])]
    fig, ax = plt.subplots(figsize=(12, 4.8), dpi=200)
    for i, (lab, x) in enumerate(rows):
        y = len(rows) - 1 - i
        t, s = x.mar_typical * 100, x.mar_sapat * 100
        if lab.startswith("Each"):
            ax.plot([t.quantile(.05), t.quantile(.95)], [y, y], color=AMBER, lw=6, alpha=.35, solid_capstyle="round")
            ax.plot([s.quantile(.05), s.quantile(.95)], [y, y], color=GREEN, lw=6, alpha=.35, solid_capstyle="round")
        tm, sm = t.median(), s.median()
        ax.plot([tm, sm], [y, y], color=GRID, lw=2, zorder=1)
        ax.scatter([tm], [y], s=90, color=AMBER, zorder=3, ec=SURF, lw=2)
        ax.scatter([sm], [y], s=90, color=GREEN, zorder=3, ec=SURF, lw=2)
        ax.text(tm - 1, y + .22, f"{tm:.0f}%", ha="right", fontsize=10, color=INK)
        ax.text(sm + 1, y + .22, f"{sm:.0f}%", ha="left", fontsize=10, color=INK, fontweight="bold")
    ax.set_yticks(range(len(rows)), [r[0] for r in rows][::-1], fontsize=10.5)
    ax.set_xlim(25, 80)
    ax.set_xlabel("Average share of nutrient needs met (capped at 100%)")
    ax.xaxis.grid(True, color=GRID)
    ax.set_axisbelow(True)
    for s in ["top", "right", "left"]:
        ax.spines[s].set_visible(False)
    ax.tick_params(length=0)
    ax.scatter([], [], s=70, color=AMBER, label="Usual way of spending")
    ax.scatter([], [], s=70, color=GREEN, label="SAPAT plan")
    ax.legend(frameon=False, loc="lower left", bbox_to_anchor=(0, 1.0), ncol=2, fontsize=10)
    fig.suptitle("SAPAT beats usual spending in all 3,400 price-error runs", x=.01, ha="left", fontsize=14, fontweight="bold")
    fig.text(.01, .01, "Poorest-10% budget, reference family of five, 17 regions, Sep 2026. Dots = median; bands = middle 90% of runs. "
             "Errors drawn from 28,937 PSA-vs-WFP price pairs (MAPE 10.7%).", fontsize=8.5, color=MUTED)
    fig.tight_layout(rect=(0, .04, 1, .9))
    fig.savefig(os.path.join(OUT, "fig_b_price_sensitivity.png"))


def fig_alerts():
    r = pd.read_csv(os.path.join(OUT, "c_alert_false_alarms.csv"))
    r = r[(r.geography == "province") & r.level.str.startswith("sweep")]
    th = r.rule.str.extract(r">= ([\d.]+)%")[0].astype(float)
    fig, axs = plt.subplots(1, 2, figsize=(12, 4.4), dpi=200, sharex=True)
    cur = th.isin([5, 10])
    for ax, col, ttl, fmt in ((axs[0], r.false_alarms_per_region_year, "False alarms per province per year", "{:.2f}"),
                              (axs[1], r["Rice spike, Aug-Sep 2023"], "Provinces flagged in the 2023 rice spike (of 83)", "{:.0f}")):
        ax.bar(range(len(th)), col, width=.62, color=np.where(cur, GREEN, "#b9d9c0"), ec=SURF, lw=2)
        for i, v in enumerate(col):
            ax.text(i, v, fmt.format(v), ha="center", va="bottom", fontsize=10, color=INK)
        ax.set_xticks(range(len(th)), [f"{t:g}%" for t in th])
        ax.set_title(ttl, loc="left", fontsize=12)
        ax.yaxis.grid(True, color=GRID)
        ax.set_axisbelow(True)
        for s in ["top", "right", "left"]:
            ax.spines[s].set_visible(False)
        ax.tick_params(length=0)
        ax.set_yticklabels([])
    fig.text(.5, .075, "Threshold: cost of a nutritious diet vs its average over the past 3 months (dark = current Watch 5% and Alert 10%)",
             ha="center", fontsize=10, color=MUTED)
    fig.suptitle("Lower thresholds catch more of a crisis but raise more false alarms", x=.01, ha="left", fontsize=14, fontweight="bold")
    fig.text(.01, .005, "False alarm = the rise had reversed within 2 months (cost no longer 5% above the pre-alert average). "
             "83 province series from the LGU dashboard, Jan 2018–Sep 2026.", fontsize=8.5, color=MUTED)
    fig.tight_layout(rect=(0, .1, 1, .93))
    fig.savefig(os.path.join(OUT, "fig_c_alert_thresholds.png"))


if __name__ == "__main__":
    fig_titababy()
    fig_reference()
    fig_sensitivity()
    fig_alerts()
    print("done")
