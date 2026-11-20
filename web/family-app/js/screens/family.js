/* SAPAT family app · Pamilya (Family). Its one job: who eats, and how they're doing. Profile and members (three to a row);
 * settings and data sources fold under "Higit pa". Also one member's day (Lakas, Paglaki, Dugo, Mata, Buto).
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- FAMILY + one member's day
function renderFamily() {
  const tt = T();
  // SAFETY LINE (keep): the BNS / health-center note under the members when the family has a mother or a child under 5 (bnsFam)
  $("v-family").innerHTML = `
    <div class="card full"><button class="setrow" type="button" id="profBtn"><span class="bubble sun">${icon("users")}</span><span class="tx"><b>${esc(profileName(pid))}${isSample() ? ` <span class="sbadge">${tt.sample}</span>` : ""}</b><small>${isSample() ? tt.sampleNote : tt.profileS}</small></span>${chev()}</button></div>
    <div class="card full"><div class="head"><span class="bubble">${icon("users")}</span><h2>${tt.famH}</h2><span class="meta">${tt.ofBudget}</span></div>
      <div class="members">${st.members.map((m, i) => { const s = score(memberDay(i, todayIdx)); return `<button class="mcard" type="button" data-who="${i}">${figure(m, ringCol(s), true)}<span class="nm">${esc(m.name)}</span><small>${tt.ageL(m.age)}${m.status === "pregnant" ? " · " + tt.preg : m.status === "lactating" ? " · " + tt.lact : ""}</small><span class="word ${scoreState(s)}">${scoreWord(s)}</span>${(m.diet || "regular") !== "regular" ? `<span class="dietchip">${icon(UI.dietOf(m).icon)}${UI.dietOf(m)[st.lang]}</span>` : ""}</button>`; }).join("")}
        <button class="mcard addcard" type="button" id="addM"><span class="plus">${icon("plus")}</span><span>${tt.add}</span></button></div>${st.members.some((m) => m.status === "pregnant" || m.status === "lactating" || m.age < 5) ? `<p class="quiet left">${icon("shield")}${tt.bnsFam}</p>` : ""}</div>
    ${moreBox("family", [[tt.setShort, `<div class="card">
      <div class="setrow"><span class="bubble">${icon("globe")}</span><span class="tx"><b>${tt.langH}</b><small>${tt.langS}</small></span><span class="seg" style="width:120px" id="langSeg"><button type="button" data-l="tl" aria-pressed="${st.lang === "tl"}">TL</button><button type="button" data-l="en" aria-pressed="${st.lang === "en"}">EN</button></span></div>
      <label class="setrow"><span class="bubble">${icon("heart")}</span><span class="tx"><b>${tt.halal}</b><small>${tt.halalS}</small></span><input type="checkbox" class="toggle" id="halal"${st.halal ? " checked" : ""}></label>
      <button class="setrow" type="button" id="guideRow"><span class="bubble">${icon("heart")}</span><span class="tx"><b>${tt.guideH}</b><small>${tt.guideS}</small></span>${chev()}</button>
      <button class="setrow" type="button" id="againW"><span class="bubble sun">${icon("heart")}</span><span class="tx"><b>${tt.again}</b><small>${tt.againS}</small></span>${chev()}</button>
      <label class="setrow"><span class="bubble">${icon("moon")}</span><span class="tx"><b>${tt.theme}</b><small>${tt.themeS}</small></span><input type="checkbox" class="toggle" id="dark"${isDark() ? " checked" : ""}></label>
    </div>`], [tt.dataShort, `<details class="card"><summary class="head"><span class="bubble">${icon("db")}</span><h2>${tt.dataH}</h2>${chev()}</summary>
      <div class="src">${tt.src.map((s, k) => `<div>${icon(["tag", "pot", "shield", "info"][k])}<span>${s}</span></div>`).join("")}</div></details>`]])}`;
  $("v-family").querySelectorAll("[data-who]").forEach((b) => b.addEventListener("click", () => { st.who = +b.dataset.who; go("person"); }));
  $("addM").addEventListener("click", addMember);
  $("profBtn").addEventListener("click", openProfiles);
  $("againW").addEventListener("click", showWelcome);
  $("guideRow").addEventListener("click", () => openGuide(null));
  $("langSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.l)));
  $("halal").addEventListener("change", (e) => { st.halal = e.target.checked; save(); solve(); });
  $("dark").addEventListener("change", (e) => { setTheme(e.target.checked ? "dark" : "light"); render(); });
}
function miniRing(r, col, label, val) {
  const C = 2 * Math.PI * 30;
  return `<div class="mini"><div class="mr"><svg viewBox="0 0 72 72"><circle cx="36" cy="36" r="30" stroke="var(--soft)" stroke-width="9" fill="none"/><circle cx="36" cy="36" r="30" stroke="${col}" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(r, 1))}"/></svg><span>${Math.round(Math.min(r, 9.99) * 100)}%</span></div><b>${label}</b><small>${val}</small></div>`;
}
function renderPerson() {
  const tt = T(), i = st.who, m = st.members[i], Tg = targets(m), md = memberDay(i, todayIdx), s = score(md);
  const g = md.got, e = md.exp;
  const rel = (k) => (e[k] > 0 ? g[k] / e[k] : 0);
  const C = 2 * Math.PI * 52, eR = rel("energy_kcal");
  const vit = (k, ic, l) => { const r = g[k] / Tg[k]; return `<div class="vit">${icon(ic)}<div class="nm">${l}<div class="bar"><i style="width:${Math.min(r, 1) * 100}%;background:${UI.ringCol(r)}"></i></div></div><span class="pc">${Math.round(Math.min(r, 9.99) * 100)}%</span></div>`; };
  const dayCost = md.items.reduce((a, x) => a + x.g * (priceBy[x.key] ? priceBy[x.key].price_g : 0), 0);
  // cheapest fix for the biggest gap against full needs, respecting this member's diet
  const gaps = [["iron_mg", tt.body[2]], ["calcium_mg", tt.body[4]], ["vit_a_ug", tt.body[3]], ["protein_g", tt.body[1]]].map(([k, l]) => [k, l, md.full[k] / Tg[k]]).sort((a, b) => a[2] - b[2]);
  let tip = "", tipItem = null;
  if (gaps[0][2] < 0.9) {
    const gk = gaps[0][0];
    const c = foodsNow.filter((f) => FBY[f.key][gk] > 0 && !["sugar", "condiments", "cereals"].includes(f.group) && !(st.halal && f.key.startsWith("pork")) && !UI.dietOf(m).ex(f))
      .map((f) => { const ps = UI.portions(FBY[f.key]); const p = ps.find((x) => FBY[f.key][gk] * x[3] >= 0.08 * Tg[gk]) || ps[ps.length - 1]; const add = FBY[f.key][gk] * p[3]; return { f, p, add, cost: p[3] * f.price_g, per: p[3] * f.price_g / add }; })
      .filter((c) => c.add / Tg[gk] >= 0.05).sort((a, b) => a.per - b.per)[0];
    if (c) { tipItem = c; tip = `<button class="tipcard" type="button" id="tipAdd">${pic(c.f.group, "sm")}<span class="tx"><b>${tt.tipLine(gaps[0][1].toLowerCase(), UI.plabel(c.p, st.lang), esc(fname(c.f.key).toLowerCase()))}</b><span>${tt.tipAdds(needTxt(Math.min(g[gk] / Tg[gk], 1)), needTxt(Math.min((g[gk] + c.add) / Tg[gk], 1)), about(c.cost)) + calc(() => explainFood(c.f.key, c.p[3], UI.plabel(c.p, st.lang)))}</span></span><span class="add">${icon("plus")}</span></button>`; }
  }
  const coreFull = CORE.reduce((a, k) => a + Math.min(g[k] / Tg[k], 1), 0) / CORE.length;
  const BODY = [["energy_kcal", "bolt"], ["protein_g", "grow"], ["iron_mg", "drop"], ["vit_a_ug", "eye"], ["calcium_mg", "bone"]];
  const bodyRows = BODY.map(([k, ic], n) => { const r = e[k] > 0 ? Math.min(g[k] / e[k], 1) : null, w = r == null ? "none" : r >= 0.9 ? "ok" : r >= 0.6 ? "mid" : "low";
    return `<div class="brow ${w}"><span class="bico">${icon(ic)}</span><span class="bn">${tt.body[n]}</span><span class="bbar"><i class="grow" style="--w:${(r || 0) * 100}%"></i></span><span class="bw">${tt.bw[w]}</span></div>`; }).join("");
  // SAFETY LINE (keep): the BNS / health-center note for pregnant or breastfeeding mothers (bnsMom) and under-5s (bnsKid)
  $("v-person").innerHTML = `
    <div class="who">${figure(m, ringCol(s), true)}<div class="tx"><h2>${esc(tt.bodyH(m.name))}</h2><p>${tt.ageL(m.age)}${m.status === "pregnant" ? " · " + tt.preg : m.status === "lactating" ? " · " + tt.lact : ""}${(m.diet || "regular") !== "regular" ? " · " + UI.dietOf(m)[st.lang] : ""}</p></div><button class="iconbtn" type="button" id="editM" aria-label="${tt.editM}">${icon("edit")}</button></div>
    ${m.status === "pregnant" || m.status === "lactating" ? `<p class="quiet left">${icon("shield")}${tt.bnsMom}</p>` : m.age < 5 ? `<p class="quiet left">${icon("shield")}${tt.bnsKid}</p>` : ""}
    <div class="card"><div class="head"><span class="bubble">${icon("heart")}</span><span class="htx"><h2>${s == null ? tt.notyet : scoreWord(s)}</h2><small>${tt.bodyS}</small></span></div><div class="body5">${bodyRows}</div></div>
    ${tip}
    <div class="card"><div class="head"><span class="bubble">${icon("bowl")}</span><h2>${tt.eatenToday}</h2><button class="iconbtn" type="button" id="addX" aria-label="${tt.other}">${icon("plus")}</button></div>
      ${md.items.length ? md.items.map((x) => `<div class="item">${pic(FBY[x.key].group, "sm")}<div class="tx"><b>${esc(x.lab || fname(x.key))}</b><small>${x.lab ? estTip(tt.estTag) + " · " : ""}${x.extra != null ? tt.extra + (x.p ? " · " + UI.plabel(x.p, st.lang) : "") : tt.fromMeal + " " + tt.meals[x.meal].toLowerCase()}</small></div>${x.extra != null ? `<button class="x" type="button" data-delx="${x.extra}" aria-label="${tt.remove}">${icon("x")}</button>` : ""}</div>`).join("") : `<p class="quiet">${tt.mealEmpty}</p>`}
    </div>
    <details class="card"><summary class="head"><span class="bubble">${icon("chart")}</span><h2>${tt.numbers}</h2>${chev()}</summary>
      <div class="energy">
        <div class="ring"><svg viewBox="0 0 124 124"><circle cx="62" cy="62" r="52" stroke="var(--soft)" stroke-width="14" fill="none"/><circle cx="62" cy="62" r="52" stroke="${ringCol(eR)}" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - Math.min(eR, 1))}"/></svg><div class="c"><b>${fmt(g.energy_kcal)}</b><small>/ ${fmt(e.energy_kcal)} kcal</small></div></div>
        <div class="kv"><div><span class="bubble">${icon("flame")}</span><span><b>${fmt(md.full.energy_kcal)}</b><small>kcal ${tt.fullDay}</small></span></div><div><span class="bubble sun">${icon("coins")}</span><span><b>${about(dayCost)}</b><small>${tt.spent}</small></span></div></div>
      </div>
      <div class="minis">${miniRing(rel("protein_g"), ringCol(rel("protein_g")), tt.prot, `${fmt(g.protein_g)} / ${fmt(e.protein_g)} g`)}${miniRing(rel("carb_g"), ringCol(rel("carb_g")), tt.carb, `${fmt(g.carb_g)} / ${fmt(e.carb_g)} g`)}${miniRing(rel("fat_g"), ringCol(rel("fat_g")), tt.fat, `${fmt(g.fat_g)} / ${fmt(e.fat_g)} g`)}</div>
      <div class="vits">${vit("fiber_g", "fiber", tt.fiber)}${vit("iron_mg", "drop", tt.iron)}${vit("vit_a_ug", "eye", tt.vitA)}${vit("vit_c_mg", "citrus", tt.vitC)}${vit("calcium_mg", "bone", tt.calcium)}</div>
      <p class="quiet left">${tt.vsNeed(Math.round(coreFull * 100) + "%")}</p>
    </details>`;
  $("editM").addEventListener("click", () => editMember(i));
  $("addX").addEventListener("click", () => openOther(nowMeal(), i));
  $("v-person").querySelectorAll("[data-delx]").forEach((b) => b.addEventListener("click", () => { const arr = wk.extras[todayIdx][i], idx = +b.dataset.delx, it = arr[idx]; arr.splice(idx, 1); save(); render(); toast(tt.removed(fname(it.key)), () => { arr.splice(idx, 0, it); save(); render(); }); }));
  const ta = $("tipAdd"); if (ta && tipItem) ta.addEventListener("click", () => addExtra([i], tipItem.f.key, tipItem.p[3], nowMeal(), tipItem.p.slice(0, 3)));
}
const nowMeal = () => { const h = new Date().getHours(); return h < 10 ? 0 : h < 14 ? 1 : h < 17 ? 2 : 3; };
function addExtra(whoList, key, g, meal, p) {
  const d = todayIdx; wk.extras[d] = wk.extras[d] || {};
  whoList.forEach((i) => (wk.extras[d][i] = wk.extras[d][i] || []).push({ key, g, meal, p }));
  save(); render();
  toast(T().added(fname(key)), () => { whoList.forEach((i) => wk.extras[d][i].pop()); save(); render(); });
}
