/* SAPAT engine for the browser (mirrors sapat/model.py; tests/parity_test.js checks both give the same plans).
 * - PDRI 2015 needs per member
 * - Bounded-variable primal simplex (no external solver needed)
 * - Household planner (full or budget mode), typical-spending comparison, feeding-program menu optimizer
 */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------- PDRI 2015 (DOST-FNRI, rev. 2018)
  const NUTRIENTS = ["energy_kcal", "protein_g", "iron_mg", "vit_a_ug", "calcium_mg"];
  const NUTRIENT_LABELS = { energy_kcal: "Energy", protein_g: "Protein", iron_mg: "Iron", vit_a_ug: "Vitamin A", calcium_mg: "Calcium" };
  const NUTRIENT_UNITS = { energy_kcal: "kcal", protein_g: "g", iron_mg: "mg", vit_a_ug: "µg", calcium_mg: "mg" };
  const PDRI = [
    [[1, 2], { M: [1000, 18, 8, 400, 500], F: [920, 17, 8, 400, 500] }],
    [[3, 5], { M: [1350, 22, 9, 400, 550], F: [1260, 21, 9, 400, 550] }],
    [[6, 9], { M: [1600, 30, 10, 400, 700], F: [1470, 29, 9, 400, 700] }],
    [[10, 12], { M: [2060, 43, 12, 500, 1000], F: [1980, 46, 20, 500, 1000] }],
    [[13, 15], { M: [2700, 62, 19, 700, 1000], F: [2170, 57, 28, 500, 1000] }],
    [[16, 18], { M: [3010, 72, 14, 800, 1000], F: [2280, 61, 28, 600, 1000] }],
    [[19, 29], { M: [2530, 71, 12, 700, 750], F: [1930, 62, 28, 600, 750] }],
    [[30, 49], { M: [2420, 71, 12, 700, 750], F: [1870, 62, 28, 600, 750] }],
    [[50, 59], { M: [2420, 71, 12, 700, 750], F: [1870, 62, 10, 600, 800] }],
    [[60, 69], { M: [2140, 71, 12, 700, 800], F: [1610, 62, 10, 600, 800] }],
    [[70, 120], { M: [1960, 71, 12, 700, 800], F: [1540, 62, 10, 600, 800] }],
  ];
  const IRON_FLAG_F = ["13-15", "16-18", "19-29", "30-49"];
  const PREGNANT_ADD = [300, 27, 10, 300, 50];
  const LACTATING_ADD = [500, 27, 2, 400, 0];

  function memberNeeds(m) {
    const age = Math.floor(+m.age);
    if (!(age >= 1)) throw new Error("SAPAT plans for members aged 1 year and older.");
    const row = PDRI.find(([[lo, hi]]) => age >= lo && age <= hi);
    if (!row) throw new Error("Age out of range");
    const [[lo, hi], bySex] = row;
    // sex "X" = average of boys and girls (used for groups of learners)
    let v = m.sex === "X" ? bySex.M.map((x, i) => (x + bySex.F[i]) / 2) : bySex[m.sex].slice();
    let flag = m.sex === "F" && IRON_FLAG_F.includes(`${lo}-${hi}`);
    const status = m.status || "none";
    if (status === "pregnant") { v = v.map((x, i) => x + PREGNANT_ADD[i]); flag = true; }
    else if (status === "lactating") v = v.map((x, i) => x + LACTATING_ADD[i]);
    const priority = (age < 5 || status === "pregnant" || status === "lactating") ? 3 : age < 19 ? 2 : 1;
    let stage = hi < 120 ? `${lo}–${hi} y` : "70+ y";
    if (status !== "none") stage += `, ${status}`;
    const values = {}; NUTRIENTS.forEach((k, i) => (values[k] = v[i]));
    return { values, ironFlag: flag, priority, stage };
  }

  // ---------------------------------------------------------------- Diet rules (same as sapat/foods.py)
  const RULES = {
    energy_max: 1.10, cereal_energy_share_max: 0.65, sugar_energy_share_max: 0.05,
    quality_protein_share_min: 0.35, veg_min_g_per_1000kcal: 100,
  };
  const QP_GROUPS = ["pulses", "meat", "eggs", "fish"];
  const FULL_PENALTY = 500, W_FLAGGED_IRON = 0.1, W_VEG = 0.2;
  const W_BUDGET = { energy_kcal: 3, protein_g: 2, iron_mg: 1, vit_a_ug: 1, calcium_mg: 1 };
  const TIERS = [[0.15, 1], [0.25, 3], [0.60, 9]];

  // ---------------------------------------------------------------- Bounded-variable primal simplex
  /* minimise c.x  s.t.  A x <= b,  0 <= x <= u.   `x0upper[j]` marks variables that start at their upper
     bound; the starting point must satisfy A x0 <= b (true for SAPAT: shortfalls start at 100%). */
  function simplex(c, A, b, u, x0upper, opts) {
    const n = c.length, m = b.length, N = n + m;
    const maxIter = (opts && opts.maxIter) || 20000;
    const EPS = 1e-9, PIV = 1e-9;
    const T = new Array(m);
    for (let i = 0; i < m; i++) { const r = new Float64Array(N); const Ai = A[i]; for (let j = 0; j < n; j++) r[j] = Ai[j]; r[n + i] = 1; T[i] = r; }
    const ub = new Float64Array(N); for (let j = 0; j < n; j++) ub[j] = u[j]; for (let j = n; j < N; j++) ub[j] = Infinity;
    const cost = new Float64Array(N); for (let j = 0; j < n; j++) cost[j] = c[j];
    const atUpper = new Uint8Array(N); const isBasic = new Uint8Array(N); const basis = new Int32Array(m);
    for (let j = 0; j < n; j++) if (x0upper && x0upper[j]) atUpper[j] = 1;
    const xB = new Float64Array(m);
    for (let i = 0; i < m; i++) {
      let s = b[i]; const Ai = A[i];
      for (let j = 0; j < n; j++) if (atUpper[j]) s -= Ai[j] * ub[j];
      if (s < -1e-7) throw new Error("Starting point infeasible in row " + i);
      xB[i] = Math.max(0, s); basis[i] = n + i; isBasic[n + i] = 1;
    }
    const d = new Float64Array(N); for (let j = 0; j < N; j++) d[j] = cost[j];
    let iter = 0, degenerate = 0;
    while (iter++ < maxIter) {
      const bland = degenerate > 50;
      let q = -1, best = 0, dir = 0;
      for (let j = 0; j < N; j++) {
        if (isBasic[j]) continue;
        const dj = d[j];
        let cand = 0, dd = 0;
        if (!atUpper[j] && dj < -EPS && ub[j] > 0) { cand = -dj; dd = 1; }
        else if (atUpper[j] && dj > EPS) { cand = dj; dd = -1; }
        if (dd) {
          if (bland) { q = j; dir = dd; break; }
          if (cand > best) { best = cand; q = j; dir = dd; }
        }
      }
      if (q < 0) break; // optimal
      let theta = ub[q], r = -1, leaveToUpper = false;
      for (let i = 0; i < m; i++) {
        const a = T[i][q] * dir; // xB_i decreases by a*theta
        if (a > PIV) { const t = xB[i] / a; if (t < theta - 1e-12 || (r >= 0 && Math.abs(t - theta) <= 1e-12 && basis[i] < basis[r])) { theta = t; r = i; leaveToUpper = false; } }
        else if (a < -PIV) { const uB = ub[basis[i]]; if (uB < Infinity) { const t = (uB - xB[i]) / (-a); if (t < theta - 1e-12) { theta = t; r = i; leaveToUpper = true; } } }
      }
      if (theta === Infinity) throw new Error("Unbounded LP");
      degenerate = theta < 1e-10 ? degenerate + 1 : 0;
      for (let i = 0; i < m; i++) xB[i] -= T[i][q] * dir * theta;
      if (r < 0) { atUpper[q] = atUpper[q] ? 0 : 1; continue; } // bound flip
      const enterVal = (atUpper[q] ? ub[q] : 0) + dir * theta;
      const leaving = basis[r];
      const Tr = T[r], piv = Tr[q];
      for (let j = 0; j < N; j++) Tr[j] /= piv;
      for (let i = 0; i < m; i++) {
        if (i === r) continue; const Ti = T[i], f = Ti[q];
        if (f !== 0) for (let j = 0; j < N; j++) Ti[j] -= f * Tr[j];
      }
      const fd = d[q]; if (fd !== 0) for (let j = 0; j < N; j++) d[j] -= fd * Tr[j];
      basis[r] = q; isBasic[q] = 1; isBasic[leaving] = 0; atUpper[leaving] = leaveToUpper ? 1 : 0; atUpper[q] = 0;
      xB[r] = enterVal;
    }
    if (iter >= maxIter) throw new Error("Simplex iteration limit");
    const x = new Float64Array(n);
    for (let j = 0; j < n; j++) x[j] = atUpper[j] ? ub[j] : 0;
    for (let i = 0; i < m; i++) if (basis[i] < n) x[basis[i]] = Math.min(Math.max(xB[i], 0), ub[basis[i]]);
    let obj = 0; for (let j = 0; j < n; j++) obj += c[j] * x[j];
    return { x, obj, iterations: iter };
  }

  // ---------------------------------------------------------------- Data access
  let DATA = null;
  function setData(d) {
    DATA = d;
    DATA.monthIndex = {}; d.months.forEach((mo, i) => (DATA.monthIndex[mo] = i));
  }
  /* Local price layers (optional file data/local_prices.js -> window.SAPAT_LOCAL):
     { provinces: [{ key, name, region, prices: { "YYYY-MM": { foodKey: php_per_kg } } }],
       markets:   [{ key, name, city, region, date: "YYYY-MM-DD", prices: { foodKey: [low, high] } }] }
     The regional PSA price is always the base; finer layers replace it only for the foods they price. */
  let LOCAL = { provinces: [], markets: [] };
  function setLocal(l) { LOCAL = { provinces: (l && l.provinces) || [], markets: (l && l.markets) || [] }; }
  function provincesIn(region) { return LOCAL.provinces.filter((p) => p.region === region); }
  function marketsIn(region) { return LOCAL.markets.filter((m) => m.region === region); }
  const LEVELS = { yours: "Your price", market: "Market", city: "City/town", province: "Province", region: "Region" };
  const marketMid = (v) => (Array.isArray(v) ? (v[0] + v[1]) / 2 : v);

  /* foods available in a region-month: [{...food, price_g, source, level}]
     loc = { province, city, market, overrides: { foodKey: php_per_kg } }  (all optional; province and city are PSA series keys) */
  function foodTable(region, month, includeEstimated, loc) {
    loc = loc || {};
    const mi = DATA.monthIndex[month]; const nF = DATA.foods.length;
    const P = DATA.prices[region], S = DATA.sources[region];
    const prov = loc.province ? LOCAL.provinces.find((p) => p.key === loc.province && p.region === region) : null;
    const provP = prov && prov.prices[month] ? prov.prices[month] : {};
    const cit = loc.city ? LOCAL.provinces.find((p) => p.key === loc.city) : null;
    const citP = cit && cit.prices[month] ? cit.prices[month] : {};
    // a market reading counts for its own month; readings newer than the last PSA month count for that last month
    const mkt = loc.market ? LOCAL.markets.find((m) => m.key === loc.market && m.region === region) : null;
    const lastM = DATA.months[DATA.months.length - 1];
    const mktOk = !!(mkt && mkt.date && (mkt.date.slice(0, 7) === month || (month === lastM && mkt.date.slice(0, 7) > lastM)));
    const mktP = mktOk ? mkt.prices : {};
    const ov = loc.overrides || {};
    const out = [];
    DATA.foods.forEach((f, j) => {
      const k = mi * nF + j; let p = P[k], s = S[k];
      let price = null, level = null, source = "";
      if (p != null && p > 0 && s !== 0 && (s !== 3 || includeEstimated)) { price = p; level = "region"; source = ["", "observed", "recent", "estimated"][s]; }
      if (provP[f.key] > 0) { price = provP[f.key]; level = "province"; source = "observed"; }
      if (citP[f.key] > 0) { price = citP[f.key]; level = "city"; source = "observed"; }
      if (mktP[f.key] != null && marketMid(mktP[f.key]) > 0) { price = marketMid(mktP[f.key]); level = "market"; source = mkt.date; }
      if (ov[f.key] > 0) { price = +ov[f.key]; level = "yours"; source = "entered"; }
      if (price == null) return;
      out.push(Object.assign({}, f, { price_g: price / 1000, source, level, region_price: p > 0 ? p : null }));
    });
    return out;
  }

  // ---------------------------------------------------------------- Household model
  function solvePlan(members, foodsIn, opt) {
    opt = opt || {};
    const ignore = new Set(opt.ignore || []);
    const exclude = new Set(opt.exclude || []);
    const foods = foodsIn.filter((f) => !exclude.has(f.key));
    const budget = opt.budgetDay == null || opt.budgetDay === "" ? null : +opt.budgetDay;
    const rules = Object.assign({}, RULES, opt.rules || {});
    const nJ = foods.length, nM = members.length, nK = NUTRIENTS.length, nT = TIERS.length;
    const needs = members.map((m) => opt.needs ? opt.needs(m) : memberNeeds(m));
    const E = needs.map((n) => n.values.energy_kcal);
    const nx = nM * nJ, ns = nM * nK * nT, nv = nM * nT, nvar = nx + ns + nv;
    const ix = (m, j) => m * nJ + j, isv = (m, k, t) => nx + (m * nK + k) * nT + t, ivv = (m, t) => nx + ns + m * nT + t;
    const A = [], b = [];
    const row = () => new Float64Array(nvar);
    for (let m = 0; m < nM; m++) {
      const R = {}; NUTRIENTS.forEach((k) => (R[k] = ignore.has(k) ? 0 : needs[m].values[k]));
      NUTRIENTS.forEach((nut, k) => {
        const r = row(); for (let j = 0; j < nJ; j++) r[ix(m, j)] = -foods[j][nut];
        for (let t = 0; t < nT; t++) r[isv(m, k, t)] = -R[nut]; A.push(r); b.push(-R[nut]);
      });
      let r = row(); for (let j = 0; j < nJ; j++) r[ix(m, j)] = foods[j].energy_kcal; A.push(r); b.push(rules.energy_max * E[m]);
      r = row(); for (let j = 0; j < nJ; j++) if (foods[j].group === "cereals") r[ix(m, j)] = foods[j].energy_kcal; A.push(r); b.push(rules.cereal_energy_share_max * E[m]);
      r = row(); for (let j = 0; j < nJ; j++) if (foods[j].group === "sugar") r[ix(m, j)] = foods[j].energy_kcal; A.push(r); b.push(rules.sugar_energy_share_max * E[m]);
      const Rp = R.protein_g * rules.quality_protein_share_min;
      r = row(); for (let j = 0; j < nJ; j++) if (QP_GROUPS.includes(foods[j].group)) r[ix(m, j)] = -foods[j].protein_g;
      for (let t = 0; t < nT; t++) r[isv(m, 1, t)] = -Rp; A.push(r); b.push(-Rp);
      const V = rules.veg_min_g_per_1000kcal * E[m] / 1000;
      r = row(); for (let j = 0; j < nJ; j++) if (foods[j].group === "vegetables") r[ix(m, j)] = -1;
      for (let t = 0; t < nT; t++) r[ivv(m, t)] = -V; A.push(r); b.push(-V);
    }
    if (budget != null) { const r = row(); for (let m = 0; m < nM; m++) for (let j = 0; j < nJ; j++) r[ix(m, j)] = foods[j].price_g; A.push(r); b.push(budget); }
    const u = new Float64Array(nvar), up = new Uint8Array(nvar), c = new Float64Array(nvar);
    const capScale = opt.capScale || 1;
    for (let m = 0; m < nM; m++) for (let j = 0; j < nJ; j++) u[ix(m, j)] = foods[j].cap * capScale * E[m] / 1000;
    // per-member diets: opt.excludeFor[m] = [foodKey, ...] that member does not eat
    if (opt.excludeFor) for (let m = 0; m < nM; m++) { const ex = opt.excludeFor[m]; if (ex && ex.length) for (let j = 0; j < nJ; j++) if (ex.includes(foods[j].key)) u[ix(m, j)] = 0; }
    for (let i = nx; i < nvar; i++) { const t = (i - nx) % nT; u[i] = TIERS[t][0]; up[i] = 1; }
    for (let m = 0; m < nM; m++) {
      const wk = NUTRIENTS.map((k) => (budget != null ? W_BUDGET[k] : 1));
      if (needs[m].ironFlag) wk[2] *= W_FLAGGED_IRON;
      const scale = budget == null ? FULL_PENALTY : needs[m].priority;
      for (let j = 0; j < nJ; j++) c[ix(m, j)] = budget == null ? foods[j].price_g : 1e-4 * foods[j].price_g;
      for (let k = 0; k < nK; k++) for (let t = 0; t < nT; t++) c[isv(m, k, t)] = scale * wk[k] * TIERS[t][1];
      for (let t = 0; t < nT; t++) c[ivv(m, t)] = scale * W_VEG * TIERS[t][1];
    }
    const t0 = (typeof performance !== "undefined" ? performance : Date).now();
    const res = simplex(c, A, b, u, up);
    const ms = (typeof performance !== "undefined" ? performance : Date).now() - t0;
    const grams = members.map((_, m) => foods.map((_, j) => (res.x[ix(m, j)] > 1e-6 ? res.x[ix(m, j)] : 0)));
    const supplied = grams.map((g) => { const s = {}; NUTRIENTS.forEach((k) => (s[k] = g.reduce((a, x, j) => a + x * foods[j][k], 0))); return s; });
    const cost = grams.reduce((a, g) => a + g.reduce((s, x, j) => s + x * foods[j].price_g, 0), 0);
    return { cost_day: cost, objective: res.obj, members, needs, supplied, grams, foods, ms, iterations: res.iterations };
  }

  function coverage(plan) {
    return plan.members.map((_, m) => { const c = {}; NUTRIENTS.forEach((k) => (c[k] = plan.needs[m].values[k] > 0 ? plan.supplied[m][k] / plan.needs[m].values[k] : 1)); return c; });
  }

  function marketList(plan, days) {
    days = days || 7;
    const tot = plan.foods.map((_, j) => plan.grams.reduce((a, g) => a + g[j], 0));
    return plan.foods.map((f, j) => ({
      key: f.key, name: f.name, group: f.group, grams_day: tot[j], cost_day: tot[j] * f.price_g, source: f.source, level: f.level, price_kg: f.price_g * 1000, region_price: f.region_price,
      qty: f.unit === "pc" ? Math.ceil(tot[j] * days / f.grams_per_unit) : Math.round(tot[j] * days / 10) / 100,
      unit: f.unit === "pc" ? "pcs" : "kg", cost_week: tot[j] * f.price_g * days,
    })).filter((r) => r.grams_day > 0.5).sort((a, b) => b.cost_day - a.cost_day);
  }

  // ---------------------------------------------------------------- Typical spending (FIES pattern)
  const TYPICAL_MIX = {
    bread: { rice_rm: 1.0 }, meat: { chicken: 0.5, pork_kasim: 0.5 }, fish: { galunggong: 0.5, tilapia: 0.5 },
    milk: { egg: 1.0 }, fruit: { latundan: 0.6, saba: 0.4 },
    veg: { monggo: 0.15, repolyo: 0.2, talong: 0.2, sitaw: 0.15, kalabasa: 0.15, tomato: 0.15 }, sugar: { sugar_w: 1.0 },
  };
  const FALLBACK = { rice_rm: "rice_wm", tilapia: "bangus", latundan: "lakatan", saba: "lakatan", sitaw: "baguio" };
  const UNTRACKED = ["oil", "food_nec"];
  function trackedShare(sh) {
    const tr = Object.keys(TYPICAL_MIX).reduce((a, g) => a + sh[g], 0);
    return tr / (tr + UNTRACKED.reduce((a, g) => a + sh[g], 0));
  }
  function typicalPlan(members, budgetDay, sh, foods) {
    const byKey = {}; foods.forEach((f) => (byKey[f.key] = f));
    const tot = Object.keys(TYPICAL_MIX).reduce((a, g) => a + sh[g], 0) + UNTRACKED.reduce((a, g) => a + sh[g], 0);
    const grams = {};
    Object.entries(TYPICAL_MIX).forEach(([g, mix]) => {
      const pesos = budgetDay * sh[g] / tot; const avail = {};
      Object.entries(mix).forEach(([k, w]) => { const k2 = byKey[k] ? k : FALLBACK[k]; if (k2 && byKey[k2]) avail[k2] = (avail[k2] || 0) + w; });
      const W = Object.values(avail).reduce((a, x) => a + x, 0);
      Object.entries(avail).forEach(([k, w]) => (grams[k] = (grams[k] || 0) + pesos * w / W / byKey[k].price_g));
    });
    const supply = {}; NUTRIENTS.forEach((k) => (supply[k] = Object.entries(grams).reduce((a, [f, g]) => a + g * byKey[f][k], 0)));
    const needs = members.map(memberNeeds); const Etot = needs.reduce((a, n) => a + n.values.energy_kcal, 0);
    const cov = needs.map((n) => { const c = {}; NUTRIENTS.forEach((k) => (c[k] = supply[k] * n.values.energy_kcal / Etot / n.values[k])); return c; });
    return { grams, supply, coverage: cov, spentTracked: budgetDay * trackedShare(sh) };
  }

  // ---------------------------------------------------------------- Cheapest sources
  const SOURCE_UNITS = { energy_kcal: [1000, "1,000 kcal"], protein_g: [10, "10 g protein"], iron_mg: [1, "1 mg iron"], vit_a_ug: [100, "100 µg vitamin A"], calcium_mg: [100, "100 mg calcium"] };
  function cheapestSources(foods, top) {
    const out = {};
    Object.entries(SOURCE_UNITS).forEach(([k, [u]]) => {
      out[k] = foods.filter((f) => f[k] > 0 && f.group !== "condiments" && f.group !== "sugar")
        .map((f) => ({ name: f.name, key: f.key, php: f.price_g / f[k] * u })).sort((a, b) => a.php - b.php).slice(0, top || 5);
    });
    return out;
  }

  // ---------------------------------------------------------------- Feeding-program menu optimizer
  /* One meal per child per day for `days` days. Targets = share of a child's daily needs (default 1/3).
     Each protein food (meat, fish, eggs, beans) is used on at most one day of the cycle when alternatives
     remain, so the week has variety. Budget is per child per meal. */
  function menuPlan(child, foodsIn, opt) {
    opt = opt || {};
    const share = opt.share || 1 / 3, days = opt.days || 5;
    const used = new Set(opt.exclude || []);
    const base = memberNeeds(child);
    const needsFn = () => { const v = {}; NUTRIENTS.forEach((k) => (v[k] = base.values[k] * share)); return { values: v, ironFlag: base.ironFlag, priority: 1, stage: base.stage }; };
    const out = [];
    const proteinUsed = new Set();
    for (let d = 0; d < days; d++) {
      const avail = foodsIn.filter((f) => !used.has(f.key) && f.group !== "sugar");
      const protLeft = avail.filter((f) => QP_GROUPS.includes(f.group) && !proteinUsed.has(f.key));
      const excl = protLeft.length >= 3 ? [...proteinUsed] : [];
      const plan = solvePlan([child], avail, { needs: needsFn, budgetDay: opt.budgetMeal, exclude: excl, capScale: 1 / share * 0.5 });
      const g = plan.grams[0];
      const items = plan.foods.map((f, j) => ({ key: f.key, name: f.name, group: f.group, grams: g[j], cost: g[j] * f.price_g })).filter((x) => x.grams >= 1).sort((a, b) => b.grams - a.grams);
      items.filter((x) => QP_GROUPS.includes(x.group) && x.grams >= 10).forEach((x) => proteinUsed.add(x.key));
      out.push({ day: d + 1, items, cost: plan.cost_day, coverage: coverage(plan)[0], dish: dishName(items) });
    }
    return out;
  }
  function dishName(items) {
    const prot = items.filter((x) => QP_GROUPS.includes(x.group)).sort((a, b) => b.grams - a.grams)[0];
    const veg = items.filter((x) => x.group === "vegetables").sort((a, b) => b.grams - a.grams).map((x) => x.name.split(" (")[0].replace(/,.*/, "")).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);
    const vs = veg.length ? ` with ${veg.join(" and ").toLowerCase()}` : "";
    if (!prot) return `Gulay${vs}`;
    const k = prot.key;
    if (k === "monggo") return `Ginisang monggo${vs}`;
    if (k.startsWith("peanut")) return `Kare-kare style gulay with peanut sauce${vs}`;
    if (k.startsWith("egg")) return `Torta (egg)${vs}`;
    if (k === "chicken") return `Tinolang manok${vs}`;
    if (prot.group === "meat") return `Sinigang na ${prot.name.split(",")[0].toLowerCase()}${vs}`;
    if (["suahe", "sugpo", "alimango"].includes(k)) return `Ginataang ${prot.name.split(", ")[1] || prot.name}${vs}`;
    if (prot.group === "fish") return `Paksiw na ${prot.name.split(" (")[0].toLowerCase()}${vs}`;
    return prot.name + vs;
  }

  const api = { NUTRIENTS, NUTRIENT_LABELS, NUTRIENT_UNITS, RULES, TIERS, SOURCE_UNITS, memberNeeds, simplex, setData, setLocal, provincesIn, marketsIn, LEVELS, foodTable, solvePlan, coverage, marketList, typicalPlan, trackedShare, cheapestSources, menuPlan, dishName };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.SAPAT = api;
})(typeof window !== "undefined" ? window : globalThis);
