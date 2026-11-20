/* SAPAT family app · Linggo (Week). Its one job: this week's menu and budget. A one-line budget card (the typing box opens in a
 * sheet) with the week's cooking gas, a one-row weekly balance, and the 7-day menu with Palitan on each lunch and dinner;
 * usual-vs-SAPAT, price trend and local situation fold under "Higit pa".
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- WEEK (plan + money, calmly)
// Share of the family's needs the budget-limited plan meets (capped at 100% per nutrient), as in "Pinakamabuting kaya ng budget".
function bestShare() { const cov = S.coverage(plan); return cov.reduce((a, c) => a + CORE.reduce((x, k) => x + Math.min(c[k], 1), 0) / CORE.length, 0) / cov.length; }
let weekAll = false; // Linggo shows 3 days (today and the next two) until "Show the whole week" is tapped; not saved
const dayStart = () => Math.min(todayIdx, 4);
function renderWeek() {
  const tt = T();
  if (!plan) { $("v-week").innerHTML = `<div class="card"><p class="quiet">${tt.noPlan}</p></div>`; return; }
  const best = bestShare();
  const fullWeek = planFull ? planFull.cost_day * 7 / tracked : 0, gap = planFull ? planFull.cost_day * 7 - st.budget * tracked : 0;
  const s0 = dayStart(), shown = weekAll ? [0, 1, 2, 3, 4, 5, 6] : [s0, s0 + 1, s0 + 2];
  const d = shown.includes(st.day) ? st.day : Math.min(Math.max(st.day, s0), s0 + 2);
  const ix = D.index[st.loc.region], stt = D.stats[regKey(st.loc.region)];
  const li = ix ? ix.months.indexOf(lastMonth) : -1, series = ix ? ix.cond.slice(Math.max(0, li - 23), li + 1) : [];
  const lvl = ix ? ix.level[li] : "normal", yoy = ix ? ix.yoy[li] : null, lvW = { normal: "ok", watch: "mid", alert: "low" };
  const spark = (() => {
    if (series.length < 2) return "";
    const Wd = 320, H = 90, lo = Math.min(...series) * 0.97, hi = Math.max(...series) * 1.02, x = (k) => 6 + k / (series.length - 1) * (Wd - 12), y = (v) => H - 16 - (v - lo) / (hi - lo) * (H - 30);
    const pts = series.map((v, k) => `${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    return `<svg class="spark" viewBox="0 0 ${Wd} ${H}" role="img" aria-label="${tt.trendH}"><polygon points="6,${H - 16} ${pts} ${Wd - 6},${H - 16}" fill="var(--leaf-soft)"/><polyline points="${pts}" fill="none" stroke="var(--leaf)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(series.length - 1)}" cy="${y(series[series.length - 1])}" r="6" fill="var(--leaf)" stroke="var(--surface)" stroke-width="2"/><text x="6" y="${H - 1}" font-size="13" fill="var(--ink-2)" font-family="Nunito, sans-serif">${UI.monthName(ix.months[Math.max(0, li - 23)], st.lang)}</text><text x="${Wd - 6}" y="${H - 1}" font-size="13" fill="var(--ink-2)" text-anchor="end" font-family="Nunito, sans-serif">${UI.monthName(lastMonth, st.lang)}</text></svg>`;
  })();
  const trendCard = ix ? `<details class="card"><summary class="head"><span class="bubble">${icon("up")}</span><h2>${tt.trendH}</h2><span class="word ${lvW[lvl] || "ok"}">${icon(UI.SWI[lvW[lvl] || "ok"])}${tt.lv[lvl] || ""}</span>${chev()}</summary>
      <div class="stats"><div class="stat"><b>${peso(series[series.length - 1])}</b><small>${tt.perPerson}</small></div><div class="stat"><b>${yoy == null ? "–" : (yoy >= 0 ? "+" : "") + Math.round(yoy * 100) + "%"}</b><small>${tt.vsYear}</small></div></div>${spark}</details>` : "";
  const situCard = stt ? `<details class="card"><summary class="head"><span class="bubble">${icon("map")}</span><h2>${tt.situH(regionName(st.loc.region))}</h2>${chev()}</summary>
      <div class="stats"><div class="stat"><b>${Math.round(stt.food_share_income * 100)}%</b><small>${tt.s1}</small></div><div class="stat"><b>${Math.round(stt.below_ft * 10)} ${tt.in10}</b><small>${tt.s2}</small></div><div class="stat"><b>${Math.round(stt.cereal_share * 100)}%</b><small>${tt.s3}</small></div><div class="stat"><b>${stt.poverty_fam == null ? "–" : fmt(stt.poverty_fam, 0) + "%"}</b><small>${tt.s4}</small></div></div>
      <p class="quiet">${tt.fies}</p></details>` : "";
  $("v-week").innerHTML = `
    <div class="card budline">
      <div class="bl1"><span class="htx"><small>${tt.budgetCard}</small><b>${peso(st.budget)} <small>${tt.perWeek}</small></b><button class="gasln" type="button" id="gasBtn" aria-label="${tt.gasH}: ${tt.gasLine(pesoN(gasWeek()))} ${tt.perWeek}">${icon("flame")}<span>${tt.gasLine(pesoN(gasWeek()))}</span>${chev()}</button></span><button class="btn sm" type="button" id="budEdit">${icon("edit")}${tt.change}</button></div>
      <div class="budres" id="budRes">
      <div class="cmp"><div class="lab"><span>${tt.bestShort(pct(best))}</span>${needWord(best)}</div><div class="bar"><i style="width:${Math.min(best, 1) * 100}%;background:${ringCol(best)}"></i></div></div>
      ${gap > 50 ? `<details class="helpnote"><summary>${icon("heart")}<span><b>${tt.gapShort(pesoN(gap))}</b></span>${chev()}</summary><p>${tt.help}</p><p class="quiet left">${tt.fullCost(pesoN(fullWeek))}</p></details>` : `<div class="helpnote ok">${icon("check")}<span>${tt.covers}</span></div>`}
      </div>
    </div>
    <div class="card">
      ${balanceSummary()}
      <div class="days${weekAll ? "" : " three"}" role="tablist">${shown.map((k) => `<button type="button" role="tab" data-day="${k}" aria-selected="${k === d}">${k === todayIdx ? "●" + tt.days[k] : tt.days[k]}</button>`).join("")}</div>
      <button class="linkbtn daysmore" type="button" id="weekAll" aria-expanded="${weekAll}">${weekAll ? tt.show3 : tt.show7}${chev()}</button>
      <div class="meals plain">${[0, 1, 2, 3].filter((mi) => week.days[d][mi].length).map((mi) => mealCard(d, mi, { swapOnly: true })).join("")}</div>
      <label class="setrow variety"><span class="bubble">${icon("heart")}</span><span class="tx"><b>${tt.varietyH}</b><small>${tt.varietyS}</small></span><input type="checkbox" class="toggle" id="variety"${st.variety ? " checked" : ""}></label>
    </div>
    ${moreBox("week", [[tt.cmpShort, compareCard()], [tt.trendShort, trendCard], [tt.situShort, situCard]])}`;
  // budget: typed (per week or per day), re-planned only when they press I-apply; the old result dims until then
  $("budEdit").addEventListener("click", openBudget);
  $("gasBtn").addEventListener("click", openFuel);
  if ($("balBtn")) $("balBtn").addEventListener("click", openBalance);
  $("v-week").querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () => { st.day = +b.dataset.day; save(); render(); }));
  $("weekAll").addEventListener("click", () => { weekAll = !weekAll; render(); });
  $("variety").addEventListener("change", (e) => { st.variety = e.target.checked; save(); solve(); render(); toast((st.variety ? T().varietyOn : T().varietyOff)(plan ? pct(bestShare()) : "–")); });
  wireMeals($("v-week"));
}
// the typing box from revision 3, in a sheet: re-plans only on I-apply, then shows what the new budget buys
function openBudget() {
  const tt = T();
  openSheet(tt.budgetCard, `<div id="budSheet"></div>`);
  budgetEditor($("budSheet"), {
    value: st.budget, mode: st.bmode, region: st.loc.region, n: st.members.length,
    onMode: (m) => { st.bmode = m; save(); },
    onApply: (v) => { st.budget = v; st.preset = 0; save(); solve(); closeSheet(); render(); toast(T().applied(peso(v), plan ? pct(bestShare()) : "–", plan ? needTxt(bestShare()) : "")); },
  });
}
function openSwap(key) {
  const tt = T(), [d, mi] = key.split("-").map(Number);
  const opts = [];
  for (let dd = 0; dd < 7; dd++) [1, 3].forEach((mm) => { if ((dd !== d || mm !== mi) && week.days[dd][mm].length && !wk.eaten[dd + "-" + mm]) opts.push([dd, mm]); });
  openSheet(tt.swapHead, `<div class="optlist">${opts.map(([dd, mm]) => `<button class="opt" type="button" data-to="${dd}-${mm}"><span class="bubble">${icon(MI[mm])}</span><span class="tx"><b>${esc(mealName(week.days[dd][mm], mm, dd))}</b><small>${dd === todayIdx ? tt.today : tt.days[dd]} · ${tt.meals[mm]}</small></span></button>`).join("")}</div>`);
  $("sheet").querySelectorAll("[data-to]").forEach((b) => b.addEventListener("click", () => { (wk.swaps = wk.swaps || []).push([key, b.dataset.to]); save(); closeSheet(); solveWeekOnly(); render(); toast(tt.swapDone, () => { wk.swaps.pop(); save(); solveWeekOnly(); render(); }); }));
}
function solveWeekOnly() { week = plan ? buildWeek(plan) : null; }
