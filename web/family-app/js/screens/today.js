/* SAPAT family app · Ngayon (Today). Its one job: what we eat today, and logging it. Tonight's ulam with "Kinain namin" first,
 * then the other meals; the family row (that's Pamilya's job), the weekly swap and the health note fold under "Higit pa".
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- TODAY: "Ano'ng ulam natin?"
function renderToday() {
  const tt = T();
  if (!week) { $("v-today").innerHTML = `<div class="card"><p class="quiet">${tt.noPlan}</p></div>`; return; }
  const meals = [0, 1, 2, 3].filter((mi) => week.days[todayIdx][mi].length);
  const outOf = (mi) => (wk.out || {})[todayIdx + "-" + mi];
  const eaten = (mi) => !!wk.eaten[todayIdx + "-" + mi] || !!(outOf(mi) && outOf(mi).who.length >= st.members.length);
  const mains = meals.filter((mi) => mi % 2 === 1);
  const h = now.getHours();
  let hero = mains.find((mi) => !eaten(mi)); if (hero == null) hero = meals.find((mi) => !eaten(mi));
  if (hero == null) hero = -1;
  if (hero === 0 && h >= 11 && mains.some((mi) => !eaten(mi))) hero = mains.find((mi) => !eaten(mi));
  let heroHtml;
  if (hero < 0) heroHtml = `<div class="hero fed">${POT.replace('class="pot"', 'class="pot calm"')}<h2>${tt.allFed}</h2><p>${tt.allFedS}</p></div>`;
  else {
    const items = week.days[todayIdx][hero], cr = mealRange(items), n = st.members.length;
    const chips = items.filter((x) => !["condiments", "sugar"].includes(FBY[x.key].group) && (hero === 0 || FBY[x.key].group !== "cereals")).map((x) => `<span class="ing">${pic(FBY[x.key].group, "xs")}${esc(fname(x.key))}</span>`).join("");
    heroHtml = `<div class="hero">
      ${POT}
      <small class="kick">${tt.ulamNow[hero]}</small>
      <h2 class="dish">${esc(mealName(items, hero, todayIdx))}</h2>
      <p class="cost">${tt.forAll(pesoN(sumT(items.map((x) => [x.key, x.g]))))}${calc(() => explainList(items.map((x) => [x.key, x.g]), esc(mealName(items, hero, todayIdx)), n))}</p>
      <p class="crange">${tt.rangeS(pesoR(cr))}</p>
      ${(() => { const c = cookOf(items, hero, todayIdx); return c.min ? `<p class="cookh">${icon("flame")}${tt.cookHero(c.min, php(c.gas))}</p>` : ""; })()}
      <div class="bens">${benefits(items, 1)}</div>
      <div class="ings">${chips}</div>
      <div class="mact"><button class="btn primary big" type="button" data-eat="${todayIdx}-${hero}">${icon("check")}${tt.ate}</button>${hero % 2 ? `<button class="btn" type="button" data-swap="${todayIdx}-${hero}">${icon("swap")}${tt.swap}</button>` : ""}</div>
      <button class="btn link" type="button" data-other="${hero}">${tt.other}</button>
    </div>`;
  }
  const rest = meals.filter((mi) => mi !== hero);
  $("v-today").innerHTML = `
    ${heroHtml}
    ${rest.length ? `<div class="strip" role="list">${rest.map((mi) => { const e = eaten(mi), o = outOf(mi);
      return `<button class="mchip m${mi}${e ? " done" : ""}" type="button" role="listitem" data-other="${mi}"><span class="mi">${icon(e ? "check" : MI[mi])}</span><span><small>${tt.meals[mi]}</small><b>${o ? tt.kind[o.kind][2] : e ? tt.eaten : tt.notyetAte}</b></span></button>`; }).join("")}</div>` : ""}
    ${moreBox("today", [[tt.famRow, `<div class="card famcard"><div class="famrow">${st.members.map((m, i) => famBubble(m, i, todayIdx)).join("")}</div></div>`], [tt.moreSwap, swapCard()], [tt.moreHealth, healthNudge()]])}
    ${st.example ? `<p class="quiet full">${icon("info")}${tt.example}<button class="btn link" type="button" id="clearEx">${tt.clear}</button></p>` : ""}`;
  $("v-today").querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
  wireMeals($("v-today")); wireSwap($("v-today"));
  $("v-today").querySelectorAll("[data-guide]").forEach((b) => b.addEventListener("click", () => openGuide(b.dataset.guide === "1" ? null : b.dataset.guide)));
  const ce = $("clearEx"); if (ce) ce.addEventListener("click", () => { const old = wk; wk = { eaten: {}, extras: {}, shop: {}, swaps: old.swaps || [], tried: old.tried || [] }; st.example = false; save(); render(); toast(T().cleared, () => { wk = old; st.example = true; save(); render(); }); });
}
