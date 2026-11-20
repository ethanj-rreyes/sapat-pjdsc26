/* SAPAT LGU dashboard · Areas and measures. One list of "areas" (84 provinces, or 18 regions) that every view reads from:
 * the answer list, the map, the table, the exports and the one-page summary all use the same numbers and the same sentences.
 * The alert rule and its back-test live here too, so the page explains exactly what it computes. */
"use strict";

const MI = {}; D.months.forEach((m, i) => (MI[m] = i)); // province and region series share D.months (checked at build)
const NF = D.foods.length, FOOD_IX = {}; D.foods.forEach((f, j) => (FOOD_IX[f.key] = j));
const KEY_FOODS = [ // the four foods PSA prices in every province; used to say which food pushed the cost up
  { k: "rice_rm", name: "rice", label: "Rice, regular-milled", unit: "₱ per kg" },
  { k: "galunggong", name: "galunggong", label: "Galunggong", unit: "₱ per kg" },
  { k: "egg", name: "eggs", label: "Egg, chicken", unit: "₱ per piece" },
  { k: "monggo", name: "monggo", label: "Monggo", unit: "₱ per kg" },
];

// ---------------------------------------------------------------- areas
const LV_NUM = { normal: 0, watch: 1, alert: 2 };
const AREAS_PROV = (PROV ? PROV.provinces : []).map((p) => ({
  key: p.key, name: p.name, region: p.region, kind: "prov", d: p.d, psa: p.psa,
  cond: p.cond, vs3: p.vs3, yoy: p.yoy, level: p.level,
  food: (k, i) => (p.kf[k] ? p.kf[k][i] : null),
}));
const AREAS_REG = REGIONS.map((r) => {
  const x = D.index[r], P = D.prices[r], Sx = D.sources[r];
  return {
    key: r, name: regionName(r), region: r, kind: "region", d: MAP.paths[r] || null, psa: true,
    cond: x.cond, vs3: x.vs_prev3, yoy: x.yoy, level: x.level.map((l) => LV_NUM[l]),
    food: (k, i) => { const q = i * NF + FOOD_IX[k]; return P[q] > 0 && (Sx[q] === 1 || Sx[q] === 2) ? P[q] : null; },
  };
});
const areaList = (level) => (level === "region" || !PROV ? AREAS_REG : AREAS_PROV);
const areaBy = (key) => AREAS_PROV.find((a) => a.key === key) || AREAS_REG.find((a) => a.key === key);
const lvOf = (a, i) => { const v = a.level[i]; return v == null ? null : v; };
const afford = (a, i, m) => { const d = D.deciles[regKey(a.region)]; const c = a.cond[i]; return d && c ? d[1].food_home_pc_day * inflator(a.region, m) / c : null; };

// ---------------------------------------------------------------- measures (3 up front, the rest one click away)
const MEASURES = [
  { k: "cost", name: "Cost of a healthy day", unit: "₱ per person per day", short: "₱/person/day", kind: "seq", timed: true, main: true,
    src: "SAPAT, from PSA retail prices", get: (a, i) => a.cond[i], fmt: (v) => peso(v), csv: (v) => +v.toFixed(2) },
  { k: "chg3", name: "Change vs past 3 months", unit: "% vs the average of the 3 months before", short: "% vs 3-month avg", kind: "div", span: 0.10, timed: true, main: true,
    src: "SAPAT, from PSA retail prices", get: (a, i) => a.vs3[i], fmt: pctSigned, csv: (v) => +(v * 100).toFixed(1) },
  { k: "level", name: "Alert level", unit: "Steady, Watch or Alert", short: "level", kind: "status", timed: true, main: true,
    src: "SAPAT early-warning rule", get: (a, i) => lvOf(a, i), fmt: (v) => LEVELS[v].word, csv: (v) => LEVELS[v].word },
  { k: "yoy", name: "Change vs same month last year", unit: "% vs 12 months before", short: "% vs last year", kind: "div", span: 0.20, timed: true,
    src: "SAPAT, from PSA retail prices", get: (a, i) => a.yoy[i], fmt: pctSigned, csv: (v) => +(v * 100).toFixed(1) },
  { k: "afford", name: "What the poorest 10% can afford", unit: "% of a healthy day their food spending covers", short: "% covered", kind: "seq", rev: true, timed: true,
    src: "PSA FIES 2023 (regional), moved to this month's prices", get: (a, i, m) => afford(a, i, m), fmt: (v) => Math.round(v * 100) + "%", csv: (v) => +(v * 100).toFixed(1) },
  { k: "rice", name: "Rice price", unit: "₱ per kg, regular-milled", short: "₱/kg", kind: "seq", timed: true,
    src: "PSA retail prices", get: (a, i) => a.food("rice_rm", i), fmt: (v) => peso(v, 2), csv: (v) => +v.toFixed(2) },
  { k: "fish", name: "Galunggong price", unit: "₱ per kg", short: "₱/kg", kind: "seq", timed: true,
    src: "PSA retail prices", get: (a, i) => a.food("galunggong", i), fmt: (v) => peso(v), csv: (v) => +v.toFixed(2) },
  { k: "below", name: "People eating below the food line", unit: "% of people, 2023 (regional figure)", short: "% of people", kind: "seq", timed: false,
    src: "PSA FIES 2023", get: (a) => (D.stats[a.region] ? D.stats[a.region].below_ft : null), fmt: (v) => Math.round(v * 100) + "%", csv: (v) => +(v * 100).toFixed(1) },
  { k: "pov", name: "Families in poverty", unit: "% of families, 2023 (regional figure)", short: "% of families", kind: "seq", timed: false,
    src: "PSA 2023 poverty statistics", get: (a) => (D.stats[a.region] && D.stats[a.region].poverty_fam != null ? D.stats[a.region].poverty_fam / 100 : null), fmt: (v) => fmt(v * 100, 1) + "%", csv: (v) => +(v * 100).toFixed(1) },
];
const measureBy = (k) => MEASURES.find((x) => x.k === k) || MEASURES[0];
const valOf = (M, a, m) => { const i = MI[m]; if (i == null) return null; const v = M.get(a, i, m); return v == null || !isFinite(v) ? null : v; };

// ---------------------------------------------------------------- the alert rule (same as the data pipeline; checked against its levels)
const RULE = { watch3: 0.05, alert3: 0.10, alertYoy: 0.15 };
// which part of the rule fired: "3m" (vs the past 3 months) or "yoy" (vs last year)
function trigger(a, i) {
  const lv = lvOf(a, i), c3 = a.vs3[i], y = a.yoy[i];
  if (lv === 2) return c3 != null && c3 >= RULE.alert3 ? "3m" : "yoy";
  return "3m";
}
// key foods ranked by how much they rose, on the same basis as the trigger
function drivers(a, i, basis) {
  const out = [];
  KEY_FOODS.forEach((f) => {
    const now = a.food(f.k, i); if (now == null) return;
    let base = null;
    if (basis === "yoy") base = i >= 12 ? a.food(f.k, i - 12) : null;
    else { const prev = [1, 2, 3].map((d) => (i - d >= 0 ? a.food(f.k, i - d) : null)).filter((v) => v != null); base = prev.length === 3 ? prev.reduce((s, v) => s + v, 0) / 3 : null; }
    if (base) out.push({ f, chg: now / base - 1, now });
  });
  return out.sort((x, y) => y.chg - x.chg);
}
// the one-sentence answer for an area: what's happening
function sentence(a, m) {
  const i = MI[m], lv = lvOf(a, i);
  if (lv == null || a.cond[i] == null) return `${a.name}: no price data for ${monthLong(m)}.`;
  const c3 = a.vs3[i], y = a.yoy[i];
  if (lv === 2 && trigger(a, i) === "yoy") return `${a.name}: healthy food costs ${pctAbs(y)} more than a year ago.`;
  if (lv >= 1) return `${a.name}: healthy food costs ${pctAbs(c3)} more than in the past 3 months.`;
  if (c3 == null) return `${a.name}: steady at ${peso(a.cond[i])} a person a day.`;
  const dir = Math.abs(c3) < 0.01 ? "about the same as" : c3 > 0 ? `${pctAbs(c3)} more than` : `${pctAbs(c3)} less than`;
  return `${a.name}: steady. Healthy food costs ${dir} in the past 3 months.`;
}
// why: the key food that rose most (or that the rise is elsewhere)
function why(a, m) {
  const i = MI[m], lv = lvOf(a, i); if (lv == null) return "";
  const basis = trigger(a, i), dr = drivers(a, i, basis), since = basis === "yoy" ? " since last year" : "";
  const up = dr.filter((d) => d.chg >= 0.03).slice(0, 2);
  if (up.length) return `Biggest ${up.length > 1 ? "rises" : "rise"}${since}: ${up.map((d) => `${d.f.name} +${Math.round(d.chg * 100)}%`).join(", ")}.`;
  if (!dr.length) return lv ? "No province price for rice, eggs, galunggong or monggo this month; the rise comes from the full basket." : "";
  return lv ? "Rice, eggs, galunggong and monggo held steady, so the rise is in other foods (vegetables, meat, fruit)." : "";
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// the same sentence without the area's name, for places where the name is already the heading
const sentenceBare = (a, m) => { const s = sentence(a, m), p = a.name + ": "; return s.startsWith(p) ? cap(s.slice(p.length)) : s; };

// what to do, by level (short line for the answer list, full list for the panel and the summary)
const ACTIONS = {
  2: { short: "Act this month: re-cost feeding menus and put pregnant mothers and children under 5 first.",
    list: [
      ["pot", "Re-cost feeding-program menus at this month's prices before the next delivery. Swap to cheaper protein (eggs, monggo, dilis) rather than cutting portions."],
      ["basket", "Coordinate with the DA provincial office and local price monitoring on the foods that rose; ask about price caps, Kadiwa outlets or rolling stores."],
      ["users", "Prioritize families with pregnant or breastfeeding mothers and children under 5: check the BNS master list, 4Ps and Walang Gutom households first."],
      ["doc", "Report it to the Local Nutrition Committee and note it in the Local Nutrition Action Plan, with the province summary attached."],
    ] },
  1: { short: "Check again next month and ask suppliers for new quotes.",
    list: [
      ["cal", "Look again when next month's prices come out. Two Watch months in a row, or a jump to Alert, means act."],
      ["coins", "Ask feeding-program suppliers for updated quotes before the next cycle, so a price rise doesn't cut portions."],
      ["users", "Ask BNS to watch for families cutting back on fish, eggs and vegetables."],
    ] },
  0: { short: "No action needed beyond the monthly check.",
    list: [
      ["check", "Keep the usual monthly check."],
      ["coins", "Use this month's cost as the reference for feeding-program budgets."],
    ] },
};

// ---------------------------------------------------------------- back-test: how often did an Alert turn out to be a false alarm?
// An alert counts as confirmed when the cost stays at least 5% above the 3 months before it for the next two months; otherwise it is a false alert.
const BACKTEST = (() => {
  let alerts = 0, falseA = 0, months = 0;
  AREAS_PROV.forEach((a) => {
    const n = a.cond.length; months += n - 3;
    for (let i = 3; i < n - 2; i++) {
      if (a.level[i] === 2 && a.level[i - 1] !== 2) {
        alerts++;
        const base = (a.cond[i - 1] + a.cond[i - 2] + a.cond[i - 3]) / 3;
        if (!(a.cond[i + 1] >= base * 1.05 && a.cond[i + 2] >= base * 1.05)) falseA++;
      }
    }
  });
  const provYears = months / 12;
  return { alerts, falseA, confirmed: alerts - falseA, provinces: AREAS_PROV.length, years: provYears / Math.max(1, AREAS_PROV.length), yearsPerFalse: falseA ? provYears / falseA : null,
    from: D.months[3], to: D.months[D.months.length - 3] };
})();
const PAST_SHOCKS = [["2021-02", "Pork prices (ASF), Feb 2021"], ["2022-12", "Onions, Dec 2022"], ["2023-09", "Rice, Sep 2023"]];
