/* SAPAT family app · Palengke. Its one job: what to buy, and how much. Progress, where you shop and the list; best value,
 * the price list and the price-source note fold under "Higit pa".
 * Palengke (Market): the shopping list in selling units, prices paid, where you shop, and price editing.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- SHOP (palengke checklist)
let priceQ = "", priceOpen = false;
function renderShop() {
  const tt = T();
  if (!plan) { $("v-shop").innerHTML = `<div class="card"><p class="quiet">${tt.noPlan}</p></div>`; return; }
  const rows = S.marketList(plan, 7).filter((r) => r.cost_week >= 1 || r.unit === "pcs");
  const order = ["cereals", "fish", "meat", "eggs", "pulses", "vegetables", "roots", "fruits", "condiments", "sugar"];
  rows.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
  // swaps the family chose to try this week go on the list too
  (wk.tried || []).forEach((t) => { const f = priceBy[t.b] || FBY[t.b]; if (!f) return; const pc = f.unit === "pc";
    rows.push({ key: "sw:" + t.b, food: t.b, group: f.group, gw: t.g, swap: true }); });
  // round each item up to what a stall sells (pieces, bundles, quarter kilos) and price it as a range
  rows.forEach((r) => { const fk = r.food || r.key, gw = r.gw != null ? r.gw : r.grams_day * 7; r.buy = UI.buyQty(FBY[fk], gw); r.range = pRange(fk, r.buy.grams); r.cost_week = pTyp(fk, r.buy.grams); r.unit = "kg"; r.qty = r.buy.grams / 1000; });
  const n = rows.filter((r) => (wk.shop[r.key] || {}).done).length;
  const outSpent = Object.values(wk.out || {}).reduce((a, o) => a + (o.spent || 0), 0);
  const spent = outSpent + rows.reduce((a, r) => { const s = wk.shop[r.key] || {}; return a + (s.done ? (s.paid != null ? s.paid : r.cost_week) : 0); }, 0);
  const note = UI.placeNote(st.loc, P(), tt);
  const cs = S.cheapestSources(foodsNow.filter((f) => f.group !== "cereals"), 1);
  const sul = [["protein_g", "grow", tt.prot, "10 g"], ["iron_mg", "drop", tt.iron, "1 mg"], ["calcium_mg", "bone", tt.calcium, "100 mg"], ["vit_a_ug", "eye", tt.vitA, "100 µg"]]
    .map(([k, ic, l, ul]) => { const c = cs[k] && cs[k][0]; if (!c) return ""; const f = FBY[c.key]; return `<div><span class="t">${icon(ic)}${tt.bestFor(l)}</span>${pic(f.group, "sm")}<b>${esc(fname(f.key))}</b><small class="pl">${priceLine(f.key)}</small></div>`; }).join("");
  let list = foodsAll.slice().sort((a, b) => fname(a.key).localeCompare(fname(b.key)));
  if (priceQ) list = list.filter((f) => (f.name + " " + (UI.TL[f.key] || "")).toLowerCase().includes(priceQ));
  const mine = Object.keys(st.prices).length;
  $("v-shop").innerHTML = `
    <div class="hero shop">${bayong(rows.length ? n / rows.length : 0)}
      <h2>${tt.shopHead(n, rows.length)}</h2>
      <div class="cmp"><div class="lab"><span>${tt.bought(n, rows.length)}</span><b>${tt.spentOf(peso(spent), peso(st.budget))}</b></div><div class="bar"><i style="width:${Math.min(spent / st.budget, 1) * 100}%;background:var(--sun)"></i></div>${outSpent ? `<small class="quiet left">${tt.outSpentL(peso(outSpent))}</small>` : ""}</div>
      ${note && note[0] !== "ok" ? `<div class="nodata">${icon("info")}<span>${note[1]}</span></div>` : ""}
    </div>
    <div class="card checklist"><div class="chkhead">${estTip(tt.pricesEst)}</div>${rows.map((r) => { const s = wk.shop[r.key] || {}, fk = r.food || r.key; return `<div class="chk${s.done ? " done" : ""}"><button class="tick" type="button" data-tick="${r.key}" aria-pressed="${!!s.done}" aria-label="${esc(fname(fk))}">${icon("check")}</button>${pic(r.group, "sm")}<span class="tx"><b>${esc(fname(fk))}${r.swap ? ` <span class="tag">${tt.swap}</span>` : ""}${(priceBy[fk] || {}).level === "yours" ? ` <span class="lvl yours">${tt.lvl.yours}</span>` : ""}</b><small>${UI.gloss(fk, st.lang) ? esc(UI.gloss(fk, st.lang)) + " · " : ""}${UI.buyLabel(FBY[fk], r.buy, st.lang)}</small></span><button class="paid" type="button" data-paid="${r.key}"><b>${s.paid != null ? pesoN(s.paid) : pesoN(r.cost_week)}</b><small>${s.paid != null ? tt.paid : `<span class="rg">${pesoR(r.range)}</span>`}${calc(() => explainFood(fk, r.buy.grams, UI.buyLabel(FBY[fk], r.buy, st.lang)) + `<p class="quiet left">${icon("info")}${T().cRound(gtxt((r.gw != null ? r.gw : r.grams_day * 7)), UI.buyLabel(FBY[fk], r.buy, st.lang))}</p>`)}</small></button></div>`; }).join("")}</div>
    ${moreBox("shop", [[tt.whereShort(esc(placeName())), `<div class="card"><button class="prow" type="button" id="placeBtn"><span class="bubble">${icon("pin")}</span><span class="tx"><small>${tt.whereShop}</small><b>${esc(placeName())}</b></span>${chev()}</button></div>`], [tt.sulitShort, `<details class="card"><summary class="head"><span class="bubble sun">${icon("coins")}</span><h2>${tt.sulitH}</h2>${chev()}</summary><div class="sulit">${sul}</div></details>`], [tt.priceShort, `<details class="card" id="plistBox"${priceQ || priceOpen ? " open" : ""}><summary class="head"><span class="bubble">${icon("tag")}</span><h2>${tt.priceH}</h2><span class="meta">${foodsAll.length}</span>${chev()}</summary>
      ${UI.mixBar(foodsAll, tt)}
      ${mine ? `<button class="btn link" type="button" id="clrP">${tt.resetMine}</button>` : ""}
      <p class="quiet left">${icon("info")}${tt.rangeWhy}</p>
      <div class="search">${icon("search")}<input type="search" id="pq" placeholder="${tt.searchPrice}" aria-label="${tt.searchPrice}" value="${esc(priceQ)}"></div>
      <div id="plist">${list.map((f) => `<button class="row" type="button" data-k="${f.key}">${pic(f.group, "sm")}<span class="tx"><b>${esc(fname(f.key))}</b>${UI.gloss(f.key, st.lang) ? `<span class="gl">${esc(UI.gloss(f.key, st.lang))}</span>` : ""}<span class="lvl ${f.level}">${tt.lvl[f.level]}</span>${f.source === "estimated" && f.level === "region" ? ` <span class="lvl region">${estTip(st.lang === "tl" ? "tinatayang presyo" : "estimated")}</span>` : ""}</span><span class="r pl">${priceLine(f.key)}</span></button>`).join("")}</div>
    </details>`], [tt.srcShort, `<div class="card"><div class="srcline">${icon("tag")}<span>${tt.srcLine(esc(st.loc.city || st.loc.prov || regionName(st.loc.region)), UI.monthName(lastMonth, st.lang))} ${tt.srcAsk}${mine ? ` <b class="mine">${tt.yoursN(mine)}</b>` : ""}</span></div></div>`]])}`;
  $("placeBtn").addEventListener("click", openPlaces);
  $("v-shop").querySelectorAll("[data-tick]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.tick, r = b.getBoundingClientRect(); const s = wk.shop[k] = wk.shop[k] || {}; s.done = !s.done; save(); render();
    const left = rows.filter((x) => !(wk.shop[x.key] || {}).done).length; if (s.done && left === 0) { burst($("v-shop").querySelector(".bayong").getBoundingClientRect()); toast(T().allBought); } }));
  $("v-shop").querySelectorAll("[data-paid]").forEach((b) => b.addEventListener("click", () => editPaid(b.dataset.paid, rows.find((r) => r.key === b.dataset.paid))));
  $("plistBox").addEventListener("toggle", (e) => { priceOpen = e.target.open; });
  $("pq").addEventListener("input", (e) => { priceQ = e.target.value.toLowerCase(); const pos = e.target.selectionStart; renderShop(); const q = $("pq"); q.focus(); q.setSelectionRange(pos, pos); });
  if ($("clrP")) $("clrP").addEventListener("click", () => { st.prices = {}; reprice(); });
  $("plist").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => editPrice(b.dataset.k)));
}
function editPaid(key, r) {
  const tt = T(), s = wk.shop[key] || {}, fk = r.food || key;
  openSheet(esc(fname(fk)), `
    <div style="display:flex;gap:16px;align-items:center">${pic(r.group, "lg")}<div style="display:grid;gap:4px"><b>${UI.buyLabel(FBY[fk], r.buy, st.lang)}</b><span style="color:var(--ink-2)">${tt.planned}: ${pesoN(r.cost_week)} <small>(${pesoR(r.range)})</small></span><span class="pl">${priceLine(fk)}</span></div></div>
    <label class="f">${tt.whatPaid}<input type="number" id="paidIn" inputmode="decimal" min="0" step="1" placeholder="${Math.round(r.cost_week)}" value="${s.paid != null ? Math.round(s.paid) : ""}"></label>
    <p class="quiet left">${icon("heart")}${tt.srcAsk}</p>
    <button class="btn primary block" type="button" id="paidSave">${icon("check")}${tt.save}</button>`);
  $("paidSave").addEventListener("click", () => {
    const raw = $("paidIn").value.trim(), v = raw === "" ? null : +raw; wk.shop[key] = Object.assign({}, s, { done: true, paid: v != null && v >= 0 ? v : null });
    // learn this market's price per kilo, used the next time the plan is made
    const kg = r.buy.grams / 1000;
    let learned = false; if (v > 0 && kg > 0) { const perKg = Math.round(v / kg); const ref = priceBy[fk] ? priceBy[fk].price_g * 1000 : perKg; if (perKg > ref * 0.4 && perKg < ref * 2.5) { st.prices[fk] = perKg; learned = true; } }
    save(); closeSheet(); render(); toast(learned ? tt.learned : tt.saved);
  });
}
function openPlaces() {
  const tt = T(), p = P(), hasProvs = (PL[st.loc.region] || { provinces: [] }).provinces.length > 0;
  const prow = (lv, ic, val, ph) => `<button class="prow" type="button" data-lv="${lv}"><span class="bubble">${icon(ic)}</span><span class="tx"><small>${tt.lvName[lv]}</small>${val ? `<b>${esc(val)}</b>` : `<em>${ph}</em>`}</span>${chev()}</button>`;
  openSheet(tt.whereH, `<div class="place">${prow("region", "map", regionName(st.loc.region), "")}${hasProvs ? prow("province", "pin", st.loc.prov, tt.wholeRegion) : ""}${prow("city", "city", st.loc.city, tt.anyCity)}${prow("market", "store", st.loc.market ? UI.marketLabel(D, st.loc, tt) : null, tt.anyMarket)}</div>${UI.mixBar(foodsAll, tt)}`);
  $("sheet").querySelectorAll(".prow").forEach((b) => b.addEventListener("click", () => pickPlace(b.dataset.lv)));
}
function pickPlace(lv) {
  const tt = T(), o = UI.placeOptions(D, PL, st.loc, lv, tt);
  let q = "";
  const draw = () => {
    const shown = o.opts.filter((x) => !q || x.l.toLowerCase().includes(q));
    $("olist").innerHTML = (o.all && !q ? `<button class="opt" type="button" data-v="" aria-current="${!o.cur}"><span class="bubble">${icon("globe")}</span><span class="tx"><b>${o.all}</b></span>${!o.cur ? icon("check").replace('class="i"', 'class="i ck"') : ""}</button>` : "") +
      shown.map((x) => `<button class="opt" type="button" data-v="${esc(x.v)}" aria-current="${x.v === o.cur}"><span class="tx"><b>${esc(x.l)}</b>${x.ok === false ? `<small>${tt.noPriceYet}</small>` : x.ok ? `<small style="color:var(--good)">${tt.hasPrice}</small>` : ""}</span>${x.v === o.cur ? icon("check").replace('class="i"', 'class="i ck"') : ""}</button>`).join("");
    $("olist").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => choose(b.dataset.v || null)));
  };
  const choose = (v) => { st.loc = UI.setPlace(st.loc, lv, v); reprice(); openPlaces(); };
  openSheet(tt.lvName[lv], `${o.opts.length > 8 ? `<div class="search">${icon("search")}<input type="search" id="oq" aria-label="${tt.pick}" placeholder="${tt.pick}"></div>` : ""}<div class="optlist" id="olist"></div>
    ${lv === "market" ? `<label class="f">${tt.otherMarket}<input type="text" id="mk" placeholder="${tt.marketName}" autocomplete="off"></label><button class="btn primary block" type="button" id="mkSave">${tt.save}</button>` : ""}`, openPlaces);
  if ($("oq")) $("oq").addEventListener("input", (e) => { q = e.target.value.toLowerCase(); draw(); });
  if ($("mkSave")) $("mkSave").addEventListener("click", () => { const v = $("mk").value.trim(); if (v) choose(v); });
  draw();
}
function reprice() { save(); refreshPrices(); solve(); go(st.tab); }
function editPrice(key) {
  const tt = T(), f = priceBy[key], u = UI.buyUnits(FBY[key])[0], per = st.lang === "tl" ? "kada" : "per";
  openSheet(esc(fname(key)), `
    <div style="display:flex;gap:16px;align-items:center">${pic(f.group, "lg")}<div style="display:grid;gap:6px;justify-items:start"><span class="pl big">${priceLine(key)}</span><span class="lvl ${f.level}">${tt.lvl[f.level]}</span></div></div>
    <details class="nums"><summary>${tt.numbers}${chev()}</summary><p class="quiet left">${unit2Line(key)}</p></details>
    <label class="f">${tt.howMuchU(UI.ul(u, st.lang))}<input type="number" id="myP" inputmode="decimal" min="1" step="1" placeholder="${Math.round(f.price_g * u[2])}"></label>
    <button class="btn primary block" type="button" id="saveP">${icon("check")}${tt.save}</button>
    ${st.prices[key] ? `<button class="btn block" type="button" id="delP">${tt.useOfficial}</button>` : ""}`);
  $("saveP").addEventListener("click", () => { const v = +$("myP").value; if (v > 0) st.prices[key] = Math.round(v * 1000 / u[2]); closeSheet(); reprice(); toast(T().learned); });
  if ($("delP")) $("delP").addEventListener("click", () => { delete st.prices[key]; closeSheet(); reprice(); });
}
