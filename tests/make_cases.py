"""Generate random planning cases with the reference (HiGHS) engine; tests/parity_test.js re-solves them in JS."""
import json, os, random, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sapat.data import food_table, ROOT
from sapat.needs import Member
from sapat.model import solve

random.seed(7)
regions = ["PH", "NCR", "R08", "BARMM", "R07", "CAR", "R4A", "R12"]
months = ["2018-06", "2021-03", "2023-09", "2025-01", "2026-09"]
cases = []
for i in range(40):
    r, mo = random.choice(regions), random.choice(months)
    n = random.randint(1, 6)
    mem = []
    for k in range(n):
        age = random.choice([1, 2, 4, 7, 11, 14, 17, 25, 33, 45, 62, 75])
        sex = random.choice("MF")
        st = "none"
        if sex == "F" and 18 <= age <= 45 and random.random() < 0.3:
            st = random.choice(["pregnant", "lactating"])
        mem.append(dict(name=f"m{k}", age=age, sex=sex, status=st))
    members = [Member(**m) for m in mem]
    f = food_table(r, mo)
    budget = None if random.random() < 0.5 else round(random.uniform(25, 120) * n, 1)
    excl = random.sample(list(f.index), 3) if random.random() < 0.3 else []
    p = solve(members, f, budget_day=budget, exclude=set(excl))
    cases.append(dict(region=r, month=mo, members=mem, budget=budget, exclude=excl,
                      cost=p.cost_day, objective=p.objective, coverage=p.coverage.round(4).values.tolist()))
json.dump(cases, open(os.path.join(ROOT, "tests", "cases.json"), "w"))
print(len(cases), "cases")
