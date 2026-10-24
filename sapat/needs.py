"""Person-specific nutrient needs from the Philippine Dietary Reference Intakes 2015 (DOST-FNRI, rev. 2018).

Values are Recommended Energy Intakes (REI) and Recommended Nutrient Intakes (RNI) per day,
transcribed from the PDRI 2015 Summary Tables (pp. 1-4). Infants under 12 months are not
covered: they should be breastfed, and complementary feeding needs clinical guidance.
"""
from __future__ import annotations

from dataclasses import dataclass, field

NUTRIENTS = ["energy_kcal", "protein_g", "iron_mg", "vit_a_ug", "calcium_mg"]
NUTRIENT_LABELS = {
    "energy_kcal": "Energy",
    "protein_g": "Protein",
    "iron_mg": "Iron",
    "vit_a_ug": "Vitamin A",
    "calcium_mg": "Calcium",
}

# (age_lo, age_hi_inclusive): {sex: (energy, protein, iron, vitA_ugRE, calcium)}
# Iron values in parentheses in the PDRI ("cannot be met by usual diet alone") are flagged below.
_PDRI = [
    ((1, 2),   {"M": (1000, 18, 8, 400, 500),   "F": (920, 17, 8, 400, 500)}),
    ((3, 5),   {"M": (1350, 22, 9, 400, 550),   "F": (1260, 21, 9, 400, 550)}),
    ((6, 9),   {"M": (1600, 30, 10, 400, 700),  "F": (1470, 29, 9, 400, 700)}),
    ((10, 12), {"M": (2060, 43, 12, 500, 1000), "F": (1980, 46, 20, 500, 1000)}),
    ((13, 15), {"M": (2700, 62, 19, 700, 1000), "F": (2170, 57, 28, 500, 1000)}),
    ((16, 18), {"M": (3010, 72, 14, 800, 1000), "F": (2280, 61, 28, 600, 1000)}),
    ((19, 29), {"M": (2530, 71, 12, 700, 750),  "F": (1930, 62, 28, 600, 750)}),
    ((30, 49), {"M": (2420, 71, 12, 700, 750),  "F": (1870, 62, 28, 600, 750)}),
    ((50, 59), {"M": (2420, 71, 12, 700, 750),  "F": (1870, 62, 10, 600, 800)}),
    ((60, 69), {"M": (2140, 71, 12, 700, 800),  "F": (1610, 62, 10, 600, 800)}),
    ((70, 120), {"M": (1960, 71, 12, 700, 800), "F": (1540, 62, 10, 600, 800)}),
]
# Female iron RNIs shown in parentheses in the PDRI (13-49 y): need iron-rich/fortified foods or supplements.
_IRON_FLAG_F = {(13, 15), (16, 18), (19, 29), (30, 49)}

# Additions for pregnancy (2nd/3rd trimester) and lactation, PDRI 2015.
PREGNANT_ADD = (300, 27, 10, 300, 50)   # iron +10 is also in parentheses; calcium +50 is 3rd trimester only
LACTATING_ADD = (500, 27, 2, 400, 0)


@dataclass
class Member:
    name: str
    age: int
    sex: str  # "M" or "F"
    status: str = "none"  # "none", "pregnant", "lactating"

    def __post_init__(self):
        if self.age < 1:
            raise ValueError("SAPAT plans for members aged 1 year and older; infants should be breastfed.")
        if self.sex not in ("M", "F"):
            raise ValueError("sex must be 'M' or 'F'")
        if self.status != "none" and (self.sex != "F" or not 13 <= self.age <= 55):
            raise ValueError("pregnant/lactating status applies to women aged 13-55")


@dataclass
class Needs:
    values: dict = field(default_factory=dict)
    iron_flag: bool = False      # PDRI: iron need cannot be met by usual diet alone
    priority: float = 1.0        # weight used when the budget is short
    life_stage: str = ""


def life_stage(m: Member) -> tuple[int, int]:
    for (lo, hi), _ in _PDRI:
        if lo <= m.age <= hi:
            return (lo, hi)
    raise ValueError(f"age {m.age} out of range")


def member_needs(m: Member) -> Needs:
    stage = life_stage(m)
    base = dict(_PDRI)[stage][m.sex]
    vals = list(base)
    flag = m.sex == "F" and stage in _IRON_FLAG_F
    if m.status == "pregnant":
        vals = [v + a for v, a in zip(vals, PREGNANT_ADD)]
        flag = True
    elif m.status == "lactating":
        vals = [v + a for v, a in zip(vals, LACTATING_ADD)]
    # Priority: children under 5 and pregnant/lactating women are protected first when money is short,
    # then school-age children and adolescents, then other adults.
    if m.age < 5 or m.status in ("pregnant", "lactating"):
        prio = 3.0
    elif m.age < 19:
        prio = 2.0
    else:
        prio = 1.0
    label = f"{stage[0]}-{stage[1]} y" if stage[1] < 120 else "70+ y"
    if m.status != "none":
        label += f", {m.status}"
    return Needs(dict(zip(NUTRIENTS, vals)), flag, prio, label)


def household_needs(members: list[Member]) -> dict:
    tot = {k: 0.0 for k in NUTRIENTS}
    for m in members:
        for k, v in member_needs(m).values.items():
            tot[k] += v
    return tot


# Reference household used for the regional Cost of Nutritious Diet index (a family of five,
# matching the household size PSA uses for its food threshold).
REFERENCE_HOUSEHOLD = [
    Member("Father", 35, "M"),
    Member("Mother", 32, "F"),
    Member("Child (10)", 10, "F"),
    Member("Child (7)", 7, "M"),
    Member("Child (3)", 3, "F"),
]
