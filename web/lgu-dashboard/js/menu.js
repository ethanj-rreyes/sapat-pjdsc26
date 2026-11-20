/* SAPAT LGU dashboard · Feeding program: a 5-day menu for school or community feeding at a region's prices, with the
 * supplier order for the week. Same model as before revision 7; only the look and the region names changed. */
"use strict";

const NUT = S.NUTRIENTS;
const NLW = { energy_kcal: "energy", protein_g: "prot", iron_mg: "iron", vit_a_ug: "vitA", calcium_mg: "calcium" };
const NIC = { energy_kcal: "bolt", protein_g: "grow", iron_mg: "drop", vit_a_ug: "eye", calcium_mg: "bone" };
const nutLabel = (k) => TU()[NLW[k]];
const GROUP_ICON = { cereals: "rice", roots: "root", pulses: "bean", meat: "meat", eggs: "egg", fish: "fish", vegetables: "leaf", condiments: "spice", fruits: "fruit", sugar: "sugar" };
const covStatus = (c) => (c >= 0.9 ? "ok" : c >= 0.6 ? "mid" : "low");
const COV_WORD = { ok: "Enough", mid: "A bit low", low: "Low" };

const mn = Object.assign({ region: "R08", month: lastMonth, age: 7, n: 40, budget: 30, share: 0.3333, halal: false }, store.get("menu", {}));
function setupMenu() {
  $("menuRegion").innerHTML = REGIONS.map((r) => `<option value="${r}">${esc(regionName(r))}</option>`).join("");
  $("menuMonth").innerHTML = MONTHS.slice().reverse().map((m) => `<option value="${m}">${monthLong(m)}</option>`).join("");
  syncMenuInputs();
  [["menuRegion", "region", (v) => v], ["menuMonth", "month", (v) => v], ["menuAge", "age", (v) => +v], ["menuN", "n", (v) => Math.max(1, Math.round(+v || 1))], ["menuBudget", "budget", (v) => Math.max(1, +v || 1)], ["menuShare", "share", (v) => +v]]
    .forEach(([id, key, cast]) => $(id).addEventListener("change", (e) => { mn[key] = cast(e.target.value); renderMenu(); }));
  $("menuHalal").addEventListener("change", (e) => { mn.halal = e.target.checked; renderMenu(); });
}
function syncMenuInputs() {
  if (!REGIONS.includes(mn.region)) mn.region = "R08";
  if (!MONTHS.includes(mn.month)) mn.month = lastMonth;
  $("menuRegion").value = mn.region; $("menuMonth").value = mn.month; $("menuAge").value = String(mn.age); $("menuN").value = mn.n;
  $("menuBudget").value = mn.budget; $("menuShare").value = String(mn.share); $("menuHalal").checked = mn.halal;
}
function renderMenu() {
  store.set("menu", mn);
  const foods = S.foodTable(mn.region, mn.month, false);
  const exclude = mn.halal ? foods.filter((f) => f.key.startsWith("pork")).map((f) => f.key) : [];
  let days;
  try { days = S.menuPlan({ name: "Learner", age: mn.age, sex: "X" }, foods, { share: mn.share, days: 5, budgetMeal: mn.budget, exclude }); }
  catch (err) { $("menuDays").textContent = "Could not make a menu: " + err.message; return; }
  const avgCost = days.reduce((a, d) => a + d.cost, 0) / days.length;
  const avgCov = days.reduce((a, d) => a + NUT.reduce((s, k) => s + Math.min(d.coverage[k], 1), 0) / 5, 0) / days.length;
  const full = S.menuPlan({ name: "Learner", age: mn.age, sex: "X" }, foods, { share: mn.share, days: 1, exclude })[0];
  const lv = avgCov >= 0.9 ? 0 : avgCov >= 0.75 ? 1 : 2;
  const shortK = NUT.filter((k) => days.reduce((a, d) => a + Math.min(d.coverage[k], 1), 0) / days.length < 0.85);
  $("menuBanner").className = "banner " + LEVELS[lv].k;
  $("menuBanner").innerHTML = `<span class="big-ic">${icon(lv === 0 ? "shield" : "warn")}</span><div><h2>${peso(mn.budget)} a meal covers about ${Math.round(avgCov * 10)} in 10 of what each child should get from it.</h2>
    <p>${shortK.length ? `Short on ${shortK.map((k) => nutLabel(k).toLowerCase()).join(" and ")}. A meal that meets every target costs about <b>${peso(full.cost, 0)}</b>.` : "Every target is met within the budget."} The week costs <b>${peso(avgCost * 5 * mn.n)}</b> for ${fmt(mn.n)} learners, at ${esc(regionName(mn.region))} prices for ${monthLong(mn.month)}.</p></div>`;
  const DAYN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  $("menuDays").innerHTML = days.map((d) => {
    const main = d.items.find((it) => ["fish", "meat", "eggs", "pulses"].includes(it.group));
    return `<div class="day"><p class="dname">${DAYN[d.day - 1]}</p>
    <div class="dh"><span class="gi">${icon(main ? GROUP_ICON[main.group] : "leaf")}</span><h3>${esc(d.dish)}</h3></div>
    <div class="dots">${NUT.map((k) => { const s = covStatus(d.coverage[k]); return `<i class="${s}" title="${nutLabel(k)}: ${COV_WORD[s]}" aria-label="${nutLabel(k)}: ${COV_WORD[s]}">${icon(NIC[k])}</i>`; }).join("")}</div>
    <ul>${d.items.filter((it) => it.grams >= 3).map((it) => `<li>${esc(it.name)}<span>${fmt(it.grams)} g</span></li>`).join("")}</ul></div>`;
  }).join("");
  const tot = {};
  days.forEach((d) => d.items.forEach((it) => { tot[it.key] = tot[it.key] || { name: it.name, group: it.group, g: 0, cost: 0 }; tot[it.key].g += it.grams * mn.n; tot[it.key].cost += it.cost * mn.n; }));
  const rows = Object.values(tot).sort((a, b) => b.cost - a.cost);
  $("menuList").innerHTML = `<thead><tr><th scope="col">Ingredient</th><th scope="col" class="n">Quantity</th><th scope="col" class="n">Cost (₱)</th></tr></thead><tbody>` +
    rows.map((r) => `<tr><td>${icon(GROUP_ICON[r.group])} ${esc(r.name)}</td><td class="n">${r.g >= 1000 ? fmt(r.g / 1000, 1) + " kg" : fmt(Math.round(r.g / 10) * 10) + " g"}</td><td class="n">${peso(r.cost)}</td></tr>`).join("") + `</tbody>`;
  $("menuListTitle").textContent = `Ingredients for the week, ${fmt(mn.n)} learners`;
}
