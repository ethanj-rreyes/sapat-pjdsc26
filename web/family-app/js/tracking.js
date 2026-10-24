/* SAPAT family app · What each member ate today, what the plan expected by now, and the plain-word score (Sapat / Halos sapat / Kulang pa).
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- what each member ate, and what the plan expected by now
const MEAL_DONE_HOUR = [9, 13, 16, 20];
function memberDay(m, d) {
  const got = {}, exp = {}, full = {}; NUTS.forEach((n) => (got[n] = exp[n] = full[n] = 0));
  const items = [];
  if (week) week.days[d].forEach((meal, mi) => {
    const isPast = d < todayIdx || (d === todayIdx && now.getHours() >= MEAL_DONE_HOUR[mi]);
    const o = (wk.out || {})[d + "-" + mi], away = !!(o && o.who.includes(m));
    const eaten = !!wk.eaten[d + "-" + mi] && !away;
    meal.forEach((x) => {
      const g = x.g * week.share[x.j][m], n = nutr(x.key, g);
      NUTS.forEach((k) => { full[k] += n[k]; if (isPast || eaten || away) exp[k] += n[k]; if (eaten) got[k] += n[k]; });
      if (eaten && g > 1) items.push({ key: x.key, g, meal: mi });
    });
  });
  ((wk.extras[d] || {})[m] || []).forEach((x, idx) => { const n = nutr(x.key, x.g); NUTS.forEach((k) => (got[k] += n[k])); items.push({ key: x.key, g: x.g, meal: x.meal, extra: idx, p: x.p, lab: x.lab }); });
  return { got, exp, full, items };
}
function score(md) { // 0..1 versus what the plan expected by now (budget-best), 5 core nutrients
  const ks = CORE.filter((k) => md.exp[k] > 0); if (!ks.length) return null;
  return ks.reduce((a, k) => a + Math.min(md.got[k] / md.exp[k], 1), 0) / ks.length;
}
const scoreState = (s) => (s == null ? "none" : s >= 0.9 ? "ok" : s >= 0.6 ? "mid" : "low");
const ringCol = (s) => (s == null ? "var(--line)" : s >= 0.9 ? "var(--good)" : s >= 0.6 ? "var(--sun)" : "var(--peach)");
const scoreWord = (s) => { const tt = T(); return s == null ? tt.notyet : s >= 0.9 ? tt.good : s >= 0.6 ? tt.mid : tt.low; };
