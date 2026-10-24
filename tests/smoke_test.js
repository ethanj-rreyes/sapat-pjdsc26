// node tests/smoke_test.js
// End-to-end check of the shared web engine and data, without a browser:
//   1. every data bundle loads and is internally consistent
//   2. the headline result for the demo family (Tita Baby, Leyte, PHP 1,290/week) is reproduced
//   3. province prices only cover foods and regions the core bundle knows
const path = require("path");
globalThis.window = globalThis;
const D = (f) => path.join(__dirname, "..", "web", "shared", "data", f);
require(D("sapat_data.js")); require(D("local_prices.js")); require(D("places.js")); require(D("extra_nutrients.js"));
require(path.join(__dirname, "..", "web", "shared", "sapat-ui.js"));
const S = require(path.join(__dirname, "..", "web", "shared", "sapat-engine.js"));
const DATA = window.SAPAT_DATA, LOCAL = window.SAPAT_LOCAL, UI = window.SAPAT_UI;
let failed = 0;
const check = (ok, msg) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) failed++; };

// 1. data bundles
const keys = new Set(DATA.foods.map((f) => f.key)), regions = new Set(DATA.regions.map((r) => r.key));
check(DATA.foods.length === 61, `61 foods in sapat_data.js (found ${DATA.foods.length})`);
check(Object.values(DATA.prices).every((p) => p.length === DATA.months.length * DATA.foods.length), "every region has one price slot per food and month");
check(Object.keys(window.SAPAT_EXTRA.foods).every((k) => keys.has(k)), "extra_nutrients.js only uses known food keys");
check(LOCAL.provinces.every((p) => regions.has(p.region)), "every province in local_prices.js belongs to a known region");
check(LOCAL.provinces.every((p) => Object.values(p.prices).every((m) => Object.keys(m).every((k) => keys.has(k)))), "local_prices.js only uses known food keys");

// 2. headline result
S.setData(DATA); S.setLocal(LOCAL);
const month = DATA.months[DATA.months.length - 1];
const loc = UI.place(window.SAPAT_PLACES, { region: "R08", prov: "Leyte" });
const foods = S.foodTable("R08", month, true, { province: loc.provPsa }).filter((f) => f.source !== "estimated" || f.level !== "region");
const fam = UI.EXAMPLE_FAMILY, dec = DATA.deciles.R08[1], tracked = S.trackedShare(dec), budget = 1290;
const plan = S.solvePlan(fam, foods, { budgetDay: budget / 7 * tracked });
const CORE = ["energy_kcal", "protein_g", "iron_mg", "vit_a_ug", "calcium_mg"];
const mean = (cov) => cov.reduce((a, c) => a + CORE.reduce((x, k) => x + Math.min(c[k], 1), 0) / CORE.length, 0) / cov.length;
const sapat = mean(S.coverage(plan)), usual = mean(S.typicalPlan(fam, budget / 7, dec, foods).coverage);
check(Math.round(sapat * 100) === 63, `SAPAT plan meets 63% of the demo family's needs (got ${(sapat * 100).toFixed(1)}%)`);
check(Math.round(usual * 100) === 46, `usual spending meets 46% (got ${(usual * 100).toFixed(1)}%)`);
check(plan.cost_day <= budget / 7 * tracked + 0.01, `plan stays within the budget (PHP ${plan.cost_day.toFixed(2)}/day)`);
check(plan.ms < 2000, `solved in ${plan.ms.toFixed(0)} ms`);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
