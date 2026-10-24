// node tests/parity_test.js  -> re-solves tests/cases.json with the JS engine and compares with HiGHS results
const fs = require("fs"), path = require("path");
globalThis.window = globalThis;
eval(fs.readFileSync(path.join(__dirname, "../web/shared/data/sapat_data.js"), "utf8"));
const S = require("../web/shared/sapat-engine.js");
S.setData(window.SAPAT_DATA);
const cases = JSON.parse(fs.readFileSync(path.join(__dirname, "cases.json"), "utf8"));
let worstObj = 0, worstCost = 0, worstCov = 0, fail = 0, totalMs = 0;
cases.forEach((c, i) => {
  const foods = S.foodTable(c.region, c.month, false);
  const p = S.solvePlan(c.members, foods, { budgetDay: c.budget, exclude: c.exclude });
  totalMs += p.ms;
  const cov = S.coverage(p);
  const dc = Math.abs(p.cost_day - c.cost) / Math.max(c.cost, 1);
  let dv = 0; cov.forEach((row, m) => S.NUTRIENTS.forEach((k, j) => (dv = Math.max(dv, Math.abs(Math.min(row[k], 9.99) - c.coverage[m][j])))));
  // In budget mode, plans can differ in cost slightly when several plans have the same nutrition score; compare coverage there.
  const dobj = Math.abs(p.objective - c.objective) / Math.max(Math.abs(c.objective), 1e-6);
  worstObj = Math.max(worstObj, dobj);
  const ok = dobj < 1e-4 && (c.budget != null || dc < 0.005);
  if (!ok) { fail++; console.log("MISMATCH", i, c.region, c.month, c.budget, "cost", c.cost.toFixed(2), p.cost_day.toFixed(2), "maxCovDiff", dv.toFixed(3), "obj", c.objective, p.objective); }
  if (c.budget == null) worstCost = Math.max(worstCost, dc);
  worstCov = Math.max(worstCov, dv);
});
console.log(`${cases.length} cases, ${fail} mismatches; worst objective diff ${(worstObj * 100).toExponential(2)}%; worst full-mode cost diff ${(worstCost * 100).toFixed(3)}%, worst coverage diff ${(worstCov * 100).toFixed(2)} pts; mean JS solve ${(totalMs / cases.length).toFixed(1)} ms`);
process.exit(fail ? 1 : 0);
