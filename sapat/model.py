"""SAPAT optimization engine (reference implementation, solved with HiGHS through scipy).

Decision variables
  x[m, j]  grams per day, as purchased, of food j planned for member m   (0 <= x <= cap_j * E_m / 1000)
  s[m, k]  shortfall of member m's need for nutrient k, as a fraction of the need (0 <= s <= 1),
           split into three tiers (0-15%, 15-40%, 40-100%) whose penalties rise 1 : 3 : 9, so gaps are
           spread across the household instead of falling entirely on one person
  v[m]     shortfall of member m's minimum vegetables, as a fraction (0 <= v <= 1), tiered the same way

Constraints, for every member m
  sum_j a[j,k] x[m,j] + R[m,k] s[m,k] >= R[m,k]          meet each nutrient need, or record the gap
  sum_j e[j]   x[m,j]                <= 1.10 E[m]          energy no more than 110% of need
  sum_{j in cereals} e[j] x[m,j]     <= 0.65 E[m]          rice and corn at most 65% of energy
  sum_{j in sugar}   e[j] x[m,j]     <= 0.05 E[m]          little added sugar
  sum_{j in QP} p[j] x[m,j] + 0.35 R[m,prot] s[m,prot] >= 0.35 R[m,prot]   protein quality
  sum_{j in veg} x[m,j] + V[m] v[m]  >= V[m]               Pinggang Pinoy vegetables
Household
  sum_m sum_j price[j] x[m,j]       <= budget             (budget mode only)

Objective
  "full"   : minimise cost + 500 PHP x weighted shortfall   (cheapest plan that meets every need)
  "budget" : minimise sum priority[m] x weight[k] x s[m,k]  (+ a tiny cost term to break ties):
             with a short budget, children under 5 and pregnant/lactating women are protected first.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.optimize import linprog
from scipy.sparse import lil_matrix

from .foods import QUALITY_PROTEIN_GROUPS, RULES
from .needs import NUTRIENTS, Member, member_needs

FULL_PENALTY = 500.0   # PHP per 100% of one member's need left unmet (full mode)
W_FLAGGED_IRON = 0.1   # PDRI says this iron need cannot be met by usual diet alone
W_VEG = 0.2
# Budget mode: nutrient weights. Energy gaps mean hunger, so they are closed first, then protein.
W_BUDGET = {"energy_kcal": 3.0, "protein_g": 2.0, "iron_mg": 1.0, "vit_a_ug": 1.0, "calcium_mg": 1.0}
TIERS = [(0.15, 1.0), (0.25, 3.0), (0.60, 9.0)]  # (tier width, penalty multiplier)


@dataclass
class Plan:
    status: str
    cost_day: float
    members: list
    needs: pd.DataFrame        # member x nutrient need
    supplied: pd.DataFrame     # member x nutrient supplied
    grams: pd.DataFrame        # member x food grams/day as purchased
    foods: pd.DataFrame
    solve_ms: float
    objective: float = 0.0

    @property
    def coverage(self) -> pd.DataFrame:
        return (self.supplied / self.needs).clip(upper=9.99)

    def market_list(self, days: int = 7) -> pd.DataFrame:
        g = self.grams.sum(axis=0)
        g = g[g > 0.5]
        f = self.foods.loc[g.index]
        out = pd.DataFrame({
            "food": f.name, "group": f.group, "grams_day": g,
            "cost_day": g * f.price_g, "source": f.source,
        })
        out["qty"] = np.where(f.unit == "pc", np.ceil(g * days / f.grams_per_unit), np.round(g * days / 1000, 2))
        out["unit"] = np.where(f.unit == "pc", "pcs", "kg")
        out["cost_week"] = out.cost_day * days
        return out.sort_values("cost_day", ascending=False)


def solve(members: list[Member], foods: pd.DataFrame, budget_day: float | None = None,
          exclude: set | None = None, rules: dict | None = None, ignore: set | None = None) -> Plan:
    """Plan for `members`. budget_day=None -> cheapest plan meeting all needs; otherwise the best plan
    within the budget. `exclude`: food keys to leave out. `ignore`: nutrients not planned for."""
    rules = {**RULES, **(rules or {})}
    foods = foods.drop(index=[k for k in (exclude or set()) if k in foods.index])
    J = list(foods.index)
    nJ, nM, nK = len(J), len(members), len(NUTRIENTS)
    needs = [member_needs(m) for m in members]
    E = np.array([n.values["energy_kcal"] for n in needs])

    nT = len(TIERS)
    nx = nM * nJ
    ns = nM * nK * nT
    nv = nM * nT
    nvar = nx + ns + nv
    ix = lambda m, j: m * nJ + j
    isv = lambda m, k, t: nx + (m * nK + k) * nT + t
    ivv = lambda m, t: nx + ns + m * nT + t

    A = {k: foods[k].to_numpy() for k in NUTRIENTS}
    price = foods.price_g.to_numpy()
    grp = foods.group.to_numpy()
    cereal = grp == "cereals"
    sugar = grp == "sugar"
    qp = np.isin(grp, list(QUALITY_PROTEIN_GROUPS))
    veg = grp == "vegetables"

    rows, b = [], []
    A_ub = lil_matrix((nM * (nK + 5) + 1, nvar))
    r = 0
    for m in range(nM):
        R = {k: (0.0 if k in (ignore or set()) else v) for k, v in needs[m].values.items()}
        for k, nut in enumerate(NUTRIENTS):
            for j in range(nJ):
                A_ub[r, ix(m, j)] = -A[nut][j]
            for t in range(nT):
                A_ub[r, isv(m, k, t)] = -R[nut]
            b.append(-R[nut]); r += 1
        for j in range(nJ):  # energy max
            A_ub[r, ix(m, j)] = A["energy_kcal"][j]
        b.append(rules["energy_max"] * E[m]); r += 1
        for j in np.where(cereal)[0]:
            A_ub[r, ix(m, j)] = A["energy_kcal"][j]
        b.append(rules["cereal_energy_share_max"] * E[m]); r += 1
        for j in np.where(sugar)[0]:
            A_ub[r, ix(m, j)] = A["energy_kcal"][j]
        b.append(rules["sugar_energy_share_max"] * E[m]); r += 1
        Rp = R["protein_g"] * rules["quality_protein_share_min"]
        for j in np.where(qp)[0]:
            A_ub[r, ix(m, j)] = -A["protein_g"][j]
        for t in range(nT):
            A_ub[r, isv(m, 1, t)] = -Rp
        b.append(-Rp); r += 1
        V = rules["veg_min_g_per_1000kcal"] * E[m] / 1000
        for j in np.where(veg)[0]:
            A_ub[r, ix(m, j)] = -1.0
        for t in range(nT):
            A_ub[r, ivv(m, t)] = -V
        b.append(-V); r += 1
    if budget_day is not None:
        for m in range(nM):
            for j in range(nJ):
                A_ub[r, ix(m, j)] = price[j]
        b.append(budget_day); r += 1
    A_ub = A_ub[:r].tocsr()

    # Bounds
    caps = foods.cap.to_numpy()
    bounds = [(0, caps[j] * E[m] / 1000) for m in range(nM) for j in range(nJ)]
    bounds += [(0, TIERS[t][0]) for _ in range(nM * nK) for t in range(nT)]
    bounds += [(0, TIERS[t][0]) for _ in range(nM) for t in range(nT)]

    # Objective
    c = np.zeros(nvar)
    wk = np.ones((nM, nK))
    if budget_day is not None:
        wk *= np.array([W_BUDGET[k] for k in NUTRIENTS])
    for m in range(nM):
        if needs[m].iron_flag:
            wk[m, NUTRIENTS.index("iron_mg")] *= W_FLAGGED_IRON
    if budget_day is None:
        for m in range(nM):
            for j in range(nJ):
                c[ix(m, j)] = price[j]
            for k in range(nK):
                for t in range(nT):
                    c[isv(m, k, t)] = FULL_PENALTY * wk[m, k] * TIERS[t][1]
            for t in range(nT):
                c[ivv(m, t)] = FULL_PENALTY * W_VEG * TIERS[t][1]
    else:
        for m in range(nM):
            p = needs[m].priority
            for j in range(nJ):
                c[ix(m, j)] = 1e-4 * price[j]
            for k in range(nK):
                for t in range(nT):
                    c[isv(m, k, t)] = p * wk[m, k] * TIERS[t][1]
            for t in range(nT):
                c[ivv(m, t)] = p * W_VEG * TIERS[t][1]

    t0 = time.perf_counter()
    res = linprog(c, A_ub=A_ub, b_ub=np.array(b), bounds=bounds, method="highs")
    ms = (time.perf_counter() - t0) * 1000
    if res.status != 0:
        raise RuntimeError(f"LP failed: {res.message}")
    x = res.x[:nx].reshape(nM, nJ)
    x[x < 1e-6] = 0
    names = [m.name for m in members]
    grams = pd.DataFrame(x, index=names, columns=J)
    sup = pd.DataFrame({k: x @ A[k] for k in NUTRIENTS}, index=names)
    nd = pd.DataFrame([n.values for n in needs], index=names)
    return Plan("optimal", float((x @ price).sum()), members, nd, sup, grams, foods, ms, float(res.fun))


def cheapest_sources(foods: pd.DataFrame, top: int = 5) -> dict:
    """Cheapest foods per unit of each nutrient (PHP per 10 g protein, per mg iron, ...)."""
    units = {"energy_kcal": 1000, "protein_g": 10, "iron_mg": 1, "vit_a_ug": 100, "calcium_mg": 100}
    out = {}
    for k, u in units.items():
        s = (foods.price_g / foods[k].replace(0, np.nan) * u).dropna().sort_values()
        out[k] = [(foods.loc[i, "name"], round(v, 2)) for i, v in s.head(top).items()]
    return out
