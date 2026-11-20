/* SAPAT family app · The weekly plan: budget presets, solving the plan with the shared engine, and turning it into 7 days of named Filipino dishes.
 * One of several ordered scripts; see js/README.md. */
"use strict";

const regKey = (r) => (r === "NIR" ? "R06" : r);
function inflator(region) { const ix = D.index[region]; if (!ix) return 1; const i = ix.months.indexOf(lastMonth); const b = D.base2023[region]; return i >= 0 && b ? ix.cond[i] / b : 1; }
const decilesOf = (region) => D.deciles[regKey(region)] || D.deciles.PH;
const deciles = () => decilesOf(st.loc.region);
// Weekly food budget of FIES decile d for a family of n in a region, at this month's prices (rounded to ₱10).
const budgetFor = (d, region, n) => Math.round(decilesOf(region)[d].food_home_pc_day * n * 7 * inflator(region) / 10) * 10;
const presetBudget = (d) => budgetFor(d, st.loc.region, st.members.length);
let plan = null, planFull = null, tracked = 1, week = null, lastDec = 1;
const nearestDecile = () => lastDec;
function solve() {
  if (st.preset) st.budget = presetBudget(st.preset);
  if (!st.budget) st.budget = presetBudget(1); // safety net only: Tita Baby has her preset and every new profile enters its own budget in setup
  const exclude = st.halal ? foodsNow.filter((f) => f.key.startsWith("pork")).map((f) => f.key) : [];
  const excludeFor = UI.dietExclude(st.members, foodsNow);
  const pp = st.budget / 7 / st.members.length / inflator(st.loc.region);
  let dec = 1, bd = Infinity; Object.entries(deciles()).forEach(([d, v]) => { const x = Math.abs(v.food_home_pc_day - pp); if (x < bd) { bd = x; dec = +d; } });
  tracked = S.trackedShare(deciles()[dec]); lastDec = dec;
  try { plan = S.solvePlan(st.members, foodsNow, { budgetDay: st.budget / 7 * tracked, exclude, excludeFor }); planFull = S.solvePlan(st.members, foodsNow, { exclude, excludeFor }); } catch (e) { plan = null; planFull = null; }
  week = plan ? buildWeek(plan) : null;
}

// Turn the plan's daily amounts into a 7-day menu: protein foods and vegetables rotate over lunches and dinners.
function spread(units, weights) { // largest-remainder split of `units` slots by weight
  const tot = weights.reduce((a, w) => a + w[1], 0); if (!tot) return [];
  const raw = weights.map(([j, w]) => [j, w / tot * units]);
  const base = raw.map(([j, x]) => [j, Math.floor(x), x - Math.floor(x)]);
  let left = units - base.reduce((a, b) => a + b[1], 0);
  base.slice().sort((a, b) => b[2] - a[2]).forEach((b) => { if (left > 0) { b[1]++; left--; } });
  return base.filter((b) => b[1] > 0).map((b) => [b[0], b[1]]);
}
function interleave(counts) { // spread repeats of each food evenly along the slots
  const items = []; counts.forEach(([j, c]) => { for (let k = 0; k < c; k++) items.push([j, (k + 0.5) / c + j * 1e-6]); });
  return items.sort((a, b) => a[1] - b[1]).map((x) => x[0]);
}
function buildWeek(pl) {
  const F = pl.foods, nM = pl.members.length;
  const hh = F.map((_, j) => pl.grams.reduce((a, g) => a + g[j], 0));
  const days = Array.from({ length: 7 }, () => [[], [], [], []]);
  const add = (d, m, j, g) => { if (g > 0.5) days[d][m].push({ j, key: F[j].key, g }); };
  const by = (grp) => F.map((f, j) => [j, hh[j]]).filter(([j, g]) => g > 0.5 && grp.includes(F[j].group));
  for (let d = 0; d < 7; d++) {
    by(["cereals"]).forEach(([j, g]) => { add(d, 0, j, g * 0.3); add(d, 1, j, g * 0.35); add(d, 3, j, g * 0.35); });
    by(["eggs"]).forEach(([j, g]) => add(d, 0, j, g));
    by(["sugar"]).forEach(([j, g]) => add(d, 0, j, g));
    by(["condiments"]).forEach(([j, g]) => { add(d, 1, j, g / 2); add(d, 3, j, g / 2); });
    by(["fruits", "roots"]).filter(([j]) => F[j].key !== "coconut").forEach(([j, g]) => add(d, 2, j, g));
    by(["fruits"]).filter(([j]) => F[j].key === "coconut").forEach(([j, g]) => { add(d, 1, j, g / 2); add(d, 3, j, g / 2); }); // gata goes into the ulam
  }
  // 14 main-meal slots: lunch and dinner of each day
  const slot = (k) => [Math.floor(k / 2), k % 2 ? 3 : 1];
  const prot = by(["fish", "meat", "pulses"]);
  if (prot.length) { const order = interleave(spread(14, prot.map(([j, g]) => [j, g]))); const cnt = {}; order.forEach((j) => (cnt[j] = (cnt[j] || 0) + 1)); order.forEach((j, k) => { const [d, m] = slot(k); add(d, m, j, hh[j] * 7 / cnt[j]); }); }
  const veg = by(["vegetables"]);
  if (veg.length) {
    const units = Math.min(28, veg.length * 7);
    const order = interleave(spread(units, veg.map(([j, g]) => [j, g]))); const cnt = {}; order.forEach((j) => (cnt[j] = (cnt[j] || 0) + 1));
    order.forEach((j, k) => { let s = k % 14; let [d, m] = slot(s); let tries = 0; while (days[d][m].some((x) => x.j === j) && tries < 14) { s = (s + 1) % 14; [d, m] = slot(s); tries++; } add(d, m, j, hh[j] * 7 / cnt[j]); });
  }
  // swaps the family made this week
  (wk.swaps || []).forEach(([a, b]) => { const [da, ma] = a.split("-").map(Number), [db, mb] = b.split("-").map(Number); if (days[da] && days[db]) { const t = days[da][ma]; days[da][ma] = days[db][mb]; days[db][mb] = t; } });
  // each member's share of a food follows the plan's split between members
  const share = F.map((_, j) => pl.grams.map((g) => (hh[j] > 0 ? g[j] / hh[j] : 1 / nM)));
  return { days, share, hh, F };
}
// Dish names stay Filipino in both languages: they are what families actually call their food.
function mealName(items, mi, d) {
  d = d || 0;
  const tt = T(), en = st.lang === "en";
  if (!items.length) return tt.noMeal;
  const low = (k) => fname(k).replace(/ \(.*\)$/, "").toLowerCase();
  if (mi === 0) { const egg = items.find((x) => FBY[x.key].group === "eggs"); const cer = items.find((x) => FBY[x.key].group === "cereals"); const base = cer ? (cer.key.startsWith("corn") ? "Mais" : "Kanin") : fname(items[0].key);
    const sug = items.find((x) => FBY[x.key].group === "sugar"); return egg ? `${base} at ${low(egg.key)}` : base; }
  if (mi === 2) return items.map((x) => fname(x.key).replace(/ \(.*\)$/, "")).slice(0, 2).join(" at ") || tt.snackName("");
  const prot = items.filter((x) => ["fish", "meat", "pulses", "eggs"].includes(FBY[x.key].group)).sort((a, b) => b.g - a.g)[0];
  const veg = items.filter((x) => FBY[x.key].group === "vegetables").sort((a, b) => b.g - a.g).map((x) => low(x.key)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);
  const vs = veg.length ? (en ? " with " : " na may ") + veg.join(en ? " and " : " at ") : "";
  if (!prot) return `Ginisang ${veg.join(" at ") || "gulay"}`;
  const k = prot.key, g = FBY[k].group, nm = low(k);
  let base;
  // the same food cooked different ways across the week, the way families already do
  const hasGata = items.some((x) => x.key === "coconut");
  if (k === "monggo") base = (hasGata ? ["Ginisang monggo", "Ginataang monggo", "Monggo na may sabaw"] : ["Ginisang monggo", "Monggo na may sabaw", "Monggo guisado na may talbos"])[(d * 2 + (mi === 3 ? 1 : 0)) % 3];
  else if (k.startsWith("peanut")) { if ((d * 2 + (mi === 3 ? 1 : 0)) % 2) return `Ginataang ${veg.join(" at ") || "gulay"} na may mani`; base = "Kare-kareng gulay"; }
  else if (g === "eggs") base = "Tortang itlog";
  else if (k === "chicken") base = "Tinolang manok";
  else if (g === "meat") base = `Sinigang na ${nm.replace("baboy (kasim)", "baboy")}`;
  else if (["suahe", "sugpo", "alimango"].includes(k)) base = `Ginataang ${nm}`;
  else base = `Paksiw na ${nm}`;
  return base + vs;
}
const mealCost = (items) => items.reduce((a, x) => a + x.g * (priceBy[x.key] ? priceBy[x.key].price_g : 0), 0);
const mealRange = (items) => sumR(items.map((x) => [x.key, x.g]));
