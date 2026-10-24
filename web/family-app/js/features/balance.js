/* SAPAT family app · Weekly balance per person (eggs, red meat, fish, vegetables, sugar, variety) and the one health note on Ngayon.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- balance this week (Mon–Sun): what was eaten + what is still planned
// Simple weekly guides per person: eggs up to about 1 a day (AHA 2019 advisory for healthy people); red meat up to about
// 500 g cooked a week (WCRF); fish at least 2 days a week; vegetables every day; free sugar under 5% of energy (WHO);
// and the same main dish at most 3 times a week, for variety.
const RED = ["beef", "beef_b", "pork_kasim", "pork_liempo", "pork_b", "pork_pata"];
function weekBalance() {
  const nM = st.members.length, per = st.members.map(() => ({ eggs: 0, red: 0, sugar: 0, fishD: new Set(), vegD: new Set() }));
  const add = (m, d, key, g) => { const f = FBY[key]; if (!f) return; const P = per[m];
    if (f.group === "eggs") P.eggs += g / (f.grams_per_unit || 55); if (RED.includes(key)) P.red += g * (f.ep_pct || 100) / 100 * 0.7;
    if (f.group === "sugar") P.sugar += g; if (f.group === "fish" && g > 20) P.fishD.add(d); if (f.group === "vegetables" && g > 15) P.vegD.add(d); };
  const dishes = {};
  if (week) for (let d = 0; d < 7; d++) week.days[d].forEach((meal, mi) => {
    const k = d + "-" + mi, o = (wk.out || {})[k], done = !!wk.eaten[k];
    const ahead = d > todayIdx || (d === todayIdx && !done && !o);
    st.members.forEach((_, m) => { const away = o && o.who.includes(m); if ((done && !away) || (ahead && !away)) meal.forEach((x) => add(m, d, x.key, x.g * week.share[x.j][m])); });
    if ((mi === 1 || mi === 3) && meal.length && !(o && o.who.length >= nM)) { const n = mealName(meal, mi, d).split(/ na may | with /)[0]; dishes[n] = (dishes[n] || 0) + 1; }
  });
  Object.entries(wk.extras || {}).forEach(([d, byM]) => Object.entries(byM).forEach(([m, arr]) => arr.forEach((x) => per[m] && add(+m, +d, x.key, x.g))));
  (wk.tried || []).forEach((t) => st.members.forEach((_, m) => add(m, 6, t.b, t.g / nM)));
  const top = Object.entries(dishes).sort((a, b) => b[1] - a[1])[0] || ["", 0];
  return { per, top };
}
const sugarCap = (m) => targets(m).energy_kcal * 0.05 / 4 * 7; // grams a week
const kiloTxt = (g) => (g < 60 ? (st.lang === "tl" ? "halos wala" : "almost none") : UI.buyLabel({ key: "" }, { n: Math.round(g / 250) / 4 || 0.25, unit: ["kilo", "kilo", 1000] }, st.lang));
function balanceRows() {
  if (!week) return [];
  const tt = T(), B = weekBalance(), P = B.per, nM = st.members.length, avg = (f) => P.reduce((a, x) => a + f(x), 0) / nM;
  const maxEggs = Math.max(...P.map((x) => x.eggs)), eggW = P.findIndex((x) => x.eggs === maxEggs);
  const redHi = P.map((x, i) => [x.red, i]).filter(([r]) => r > 500), fishMin = Math.min(...P.map((x) => x.fishD.size)), vegMin = Math.min(...P.map((x) => x.vegD.size));
  const sugHi = P.map((x, i) => [x.sugar / sugarCap(st.members[i]), i]).filter(([r]) => r > 1);
  return [
    { ok: maxEggs <= 7.5, ic: "egg", lab: tt.bal.egg, val: tt.balEggV(Math.round(avg((x) => x.eggs))), note: maxEggs <= 7.5 ? tt.balEggOk : tt.balEggHi(esc(st.members[eggW].name), Math.round(maxEggs)) },
    { ok: !redHi.length, ic: "meat", lab: tt.bal.red, val: kiloTxt(avg((x) => x.red)), note: redHi.length ? tt.balRedHi(redHi.map(([, i]) => esc(st.members[i].name)).join(", ")) : tt.balRedOk },
    { ok: fishMin >= 2, ic: "fish", lab: tt.bal.fish, val: tt.balDays(fishMin), note: fishMin >= 2 ? tt.balFishOk : tt.balFishLo },
    { ok: vegMin >= 6, ic: "leaf", lab: tt.bal.veg, val: tt.balDays(vegMin), note: vegMin >= 6 ? tt.balVegOk : tt.balVegLo },
    { ok: !sugHi.length, ic: "cup", lab: tt.bal.sugar, val: sugHi.length ? tt.balHigh : tt.balOkW, note: sugHi.length ? tt.balSugHi(sugHi.map(([, i]) => esc(st.members[i].name)).join(", ")) : tt.balSugOk },
    { ok: B.top[1] <= 3, ic: "bowl", lab: tt.bal.vary, val: tt.balTimes(B.top[1]), note: B.top[1] <= 3 ? tt.balVaryOk : tt.balVaryHi(esc(B.top[0])) },
  ];
}
function balanceCard() {
  const tt = T(), R = balanceRows(); if (!R.length) return "";
  const n = R.filter((r) => !r.ok).length;
  return `<details class="card balc"><summary class="head"><span class="bubble ${n ? "sun" : ""}">${icon("shield")}</span><span class="htx"><h2>${tt.balH}</h2><small>${n ? tt.balN(n) : tt.balAllOk}</small></span>${chev()}</summary>
    ${R.map((r) => `<div class="balrow ${r.ok ? "ok" : "mid"}"><span class="bico">${icon(r.ic)}</span><span class="tx"><b>${r.lab}</b><small>${r.note}</small></span><span class="bv">${r.val}</span></div>`).join("")}
    <p class="quiet left">${icon("info")}${tt.balS} · ${tt.balSrc}</p></details>`;
}
// one health note for the home screen: the first thing worth acting on, or else a food tip
function healthNudge() {
  const tt = T(), r = balanceRows().find((x) => !x.ok);
  if (r) return `<div class="card nudge health"><div class="nhead"><span class="bubble tomato">${icon(r.ic)}</span><span class="htx"><small>${tt.nudgeH}</small><h2>${r.lab}: ${r.val}</h2></span></div><p class="sub">${r.note}</p>
    <div class="mact"><button class="btn link" type="button" data-go="week">${tt.seeBalance}</button><button class="btn link" type="button" data-guide="1">${tt.guideAll}</button></div></div>`;
  const g = guideFor(); if (!g) return ""; const x = g[st.lang] || g.tl;
  return `<div class="card nudge health"><div class="nhead"><span class="bubble">${icon(g.ic)}</span><span class="htx"><small>${tt.guideH} · ${x[1]}</small><h2>${x[0]}</h2></span></div><p class="sub">${x[2]}</p>
    <div class="mact"><button class="btn link" type="button" data-guide="${g.id}">${tt.guideMore}</button><button class="btn link" type="button" data-guide="1">${tt.guideAll}</button></div></div>`;
}
