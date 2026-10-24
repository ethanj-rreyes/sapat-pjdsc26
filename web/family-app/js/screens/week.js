/* SAPAT family app · Linggo (Week): budget, the 7-day menu, weekly balance, usual-vs-SAPAT, price trend and local situation.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- WEEK (plan + money, calmly)
function renderWeek() {
  const tt = T();
  if (!plan) { $("v-week").innerHTML = `<div class="card"><p class="quiet">${tt.noPlan}</p></div>`; return; }
  const cov = S.coverage(plan), best = cov.reduce((a, c) => a + CORE.reduce((x, k) => x + Math.min(c[k], 1), 0) / CORE.length, 0) / cov.length;
  const fullWeek = planFull ? planFull.cost_day * 7 / tracked : 0, gap = planFull ? planFull.cost_day * 7 - st.budget * tracked : 0;
  const d = st.day;
  const ix = D.index[st.loc.region], stt = D.stats[regKey(st.loc.region)];
  const li = ix ? ix.months.indexOf(lastMonth) : -1, series = ix ? ix.cond.slice(Math.max(0, li - 23), li + 1) : [];
  const lvl = ix ? ix.level[li] : "normal", yoy = ix ? ix.yoy[li] : null, lvW = { normal: "ok", watch: "mid", alert: "low" };
  const spark = (() => {
    if (series.length < 2) return "";
    const Wd = 320, H = 90, lo = Math.min(...series) * 0.97, hi = Math.max(...series) * 1.02, x = (k) => 6 + k / (series.length - 1) * (Wd - 12), y = (v) => H - 16 - (v - lo) / (hi - lo) * (H - 30);
    const pts = series.map((v, k) => `${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 ${Wd} ${H}" role="img" aria-label="${tt.trendH}"><polygon points="6,${H - 16} ${pts} ${Wd - 6},${H - 16}" fill="var(--leaf-soft)"/><polyline points="${pts}" fill="none" stroke="var(--leaf)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(series.length - 1)}" cy="${y(series[series.length - 1])}" r="6" fill="var(--leaf)" stroke="var(--surface)" stroke-width="2"/><text x="6" y="${H - 1}" font-size="13" fill="var(--ink-2)" font-family="Nunito, sans-serif">${UI.monthName(ix.months[Math.max(0, li - 23)], st.lang)}</text><text x="${Wd - 6}" y="${H - 1}" font-size="13" fill="var(--ink-2)" text-anchor="end" font-family="Nunito, sans-serif">${UI.monthName(lastMonth, st.lang)}</text></svg>`;
  })();
  $("v-week").innerHTML = `
    <div class="hello full"><h2>${tt.weekHead(peso(st.budget))}</h2></div>
    <div class="card">
      <div class="budget"><button class="step" type="button" id="bm" aria-label="−">${icon("minus")}</button><output>${peso(st.budget)}<small>${tt.perWeek} · ${peso(st.budget / 7)} ${tt.perDay}</small></output><button class="step" type="button" id="bp" aria-label="+">${icon("plus")}</button></div>
      <div class="seg" id="presetSeg">${[1, 3, 5].map((dd, k) => `<button type="button" data-d="${dd}" aria-pressed="${st.preset === dd}">${tt.presets[k]}</button>`).join("")}</div>
      <div class="cmp"><div class="lab"><span>${tt.bestCan(Math.round(best * 100) + "%")}</span></div><div class="bar"><i style="width:${Math.min(best, 1) * 100}%;background:var(--leaf)"></i></div></div>
      ${gap > 50 ? `<details class="helpnote"><summary>${icon("heart")}<span><b>${tt.gapShort(peso(gap))}</b><small>${tt.fullCost(peso(fullWeek))}</small></span>${chev()}</summary><p>${tt.help(peso(gap))}</p></details>` : `<div class="helpnote ok">${icon("check")}<span>${tt.covers}</span></div>`}
    </div>
    <div class="card">
      <div class="days" role="tablist">${tt.days.map((n, k) => `<button type="button" role="tab" data-day="${k}" aria-selected="${k === d}">${k === todayIdx ? "●" + n : n}</button>`).join("")}</div>
      <div class="meals plain">${[0, 1, 2, 3].filter((mi) => week.days[d][mi].length).map((mi) => mealCard(d, mi, { swapOnly: true })).join("")}</div>
    </div>
    ${balanceCard()}
    ${compareCard()}
    ${ix ? `<details class="card"><summary class="head"><span class="bubble">${icon("up")}</span><h2>${tt.trendH}</h2><span class="word ${lvW[lvl] || "ok"}">${icon(UI.SWI[lvW[lvl] || "ok"])}${tt.lv[lvl] || ""}</span>${chev()}</summary>
      <div class="stats"><div class="stat"><b>${peso(series[series.length - 1])}</b><small>${tt.perPerson}</small></div><div class="stat"><b>${yoy == null ? "–" : (yoy >= 0 ? "+" : "") + Math.round(yoy * 100) + "%"}</b><small>${tt.vsYear}</small></div></div>${spark}</details>` : ""}
    ${stt ? `<details class="card"><summary class="head"><span class="bubble">${icon("map")}</span><h2>${tt.situH(regionName(st.loc.region))}</h2>${chev()}</summary>
      <div class="stats"><div class="stat"><b>${Math.round(stt.food_share_income * 100)}%</b><small>${tt.s1}</small></div><div class="stat"><b>${Math.round(stt.below_ft * 10)} ${tt.in10}</b><small>${tt.s2}</small></div><div class="stat"><b>${Math.round(stt.cereal_share * 100)}%</b><small>${tt.s3}</small></div><div class="stat"><b>${stt.poverty_fam == null ? "–" : fmt(stt.poverty_fam, 0) + "%"}</b><small>${tt.s4}</small></div></div>
      <p class="quiet">${tt.fies}</p></details>` : ""}`;
  const setB = (v) => { st.budget = Math.max(200, Math.round(v / 50) * 50); st.preset = 0; save(); solve(); render(); };
  $("bm").addEventListener("click", () => setB(st.budget - 100));
  $("bp").addEventListener("click", () => setB(st.budget + 100));
  $("presetSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { st.preset = +b.dataset.d; save(); solve(); render(); }));
  $("v-week").querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () => { st.day = +b.dataset.day; save(); render(); }));
  wireMeals($("v-week"));
}
function openSwap(key) {
  const tt = T(), [d, mi] = key.split("-").map(Number);
  const opts = [];
  for (let dd = 0; dd < 7; dd++) [1, 3].forEach((mm) => { if ((dd !== d || mm !== mi) && week.days[dd][mm].length && !wk.eaten[dd + "-" + mm]) opts.push([dd, mm]); });
  openSheet(tt.swapHead, `<div class="optlist">${opts.map(([dd, mm]) => `<button class="opt" type="button" data-to="${dd}-${mm}"><span class="bubble">${icon(MI[mm])}</span><span class="tx"><b>${esc(mealName(week.days[dd][mm], mm, dd))}</b><small>${dd === todayIdx ? tt.today : tt.days[dd]} · ${tt.meals[mm]}</small></span></button>`).join("")}</div>`);
  $("sheet").querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", () => { (wk.swaps = wk.swaps || []).push([key, b.dataset.to]); save(); closeSheet(); solveWeekOnly(); render(); toast(tt.swapDone, () => { wk.swaps.pop(); save(); solveWeekOnly(); render(); }); }));
}
function solveWeekOnly() { week = plan ? buildWeek(plan) : null; }
