/* SAPAT family app · Cooking time and gas (revision 6, the mentors' point). Rough minutes on the stove for each dish, and the LPG it burns.
 * Rough on purpose: the dish style decides the minutes (dried monggo and pork take long; torta and ginisang gulay are quick).
 * The gas is shown next to the food cost on Linggo but is not taken out of the food budget, so it never changes the plan.
 * One of several ordered scripts; see js/README.md. */
"use strict";

const LPG_DEFAULT = 1300; // ₱ per 11-kg tank. Daily Tribune, 22 Oct 2026: "about ₱1,300 to ₱1,400 per cylinder". Editable in the gas sheet.
const LPG_KG = 11;
const BURN_KG_H = 0.15; // kg of LPG an hour on one household burner, mixing high heat and simmering
const RICE_MIN = 20, CORN_MIN = 30; // pagsaing: rice is cooked at breakfast (enough for lunch) and again at dinner
const lpgPrice = () => (st.lpg > 0 ? st.lpg : LPG_DEFAULT);
const gasPerMin = () => lpgPrice() / LPG_KG * BURN_KG_H / 60;

// minutes for the ulam, following the same dish rules as mealName() in planner.js
function ulamMin(items, mi, d) {
  const prot = items.filter((x) => ["fish", "meat", "pulses", "eggs"].includes(FBY[x.key].group)).sort((a, b) => b.g - a.g)[0];
  if (!prot) return items.some((x) => FBY[x.key].group === "vegetables") ? 15 : 0; // ginisang gulay
  const k = prot.key, g = FBY[k].group;
  if (k === "monggo") return 60; // dried monggo, boiled soft
  if (k.startsWith("peanut")) return (d * 2 + (mi === 3 ? 1 : 0)) % 2 ? 30 : 45; // ginataang gulay na may mani / kare-kareng gulay
  if (g === "eggs") return 15; // torta
  if (k === "chicken") return 45; // tinola
  if (k.startsWith("beef")) return 90; // sinigang na baka
  if (g === "meat") return 60; // sinigang na baboy
  return 25; // paksiw na isda, ginataang hipon or alimango
}
// { min, gas }: minutes on the stove (one burner, so the rice and the ulam add up) and the gas that burns, in pesos
function cookOf(items, mi, d) {
  if (!items || !items.length) return { min: 0, gas: 0 };
  const cer = items.find((x) => FBY[x.key].group === "cereals");
  const saing = cer && (mi === 0 || mi === 3) ? (cer.key.startsWith("corn") ? CORN_MIN : RICE_MIN) : 0;
  let m;
  if (mi === 0) m = saing + (items.some((x) => FBY[x.key].group === "eggs") ? 5 : 0);
  else if (mi === 2) m = items.some((x) => FBY[x.key].group === "roots" || x.key === "saba") ? 25 : 0; // nilaga; fruit needs no stove
  else m = ulamMin(items, mi, d) + saing;
  m = Math.round(m / 5) * 5;
  return { min: m, gas: m * gasPerMin() };
}
const cookTxt = (items, mi, d) => { const c = cookOf(items, mi, d); return c.min ? T().cookLine(c.min) : ""; };
// one line for the dish's "Paano kinuwenta?" breakdown: minutes × gas per minute
const gasExplain = (items, mi, d) => { const c = cookOf(items, mi, d); return c.min ? `<p class="quiet left">${icon("flame")}${T().gasCalc(c.min, php(gasPerMin() * 60), php(c.gas), peso(lpgPrice()))}</p>` : ""; };
// the whole planned week (every meal of the 7 days)
function gasWeek() {
  if (!week) return 0;
  let g = 0;
  for (let d = 0; d < 7; d++) week.days[d].forEach((items, mi) => (g += cookOf(items, mi, d).gas));
  return g;
}
function foodWeek() {
  if (!week) return 0;
  let f = 0;
  for (let d = 0; d < 7; d++) week.days[d].forEach((items) => (f += sumT(items.map((x) => [x.key, x.g]))));
  return f;
}
// the sheet behind the gas line on Linggo: how it's estimated, and the family's own tank price
function openFuel() {
  const tt = T(), f = foodWeek(), g = gasWeek();
  $("toast").hidden = true; // keep the sheet's buttons clear
  openSheet(tt.gasH, `
    <div class="gastab"><div><span>${tt.gasFood}</span><b>${pesoN(f)}</b></div><div><span>${icon("flame")}${tt.gasGas}</span><b>${pesoN(g)}</b></div><div class="tot"><span>${tt.gasTot}</span><b>${pesoN(f + g)}</b></div></div>
    <p class="quiet left">${icon("info")}${tt.gasS(php(gasPerMin() * 60))}</p>
    <label class="f">${tt.lpgL}<input type="number" id="lpgIn" inputmode="numeric" min="100" step="10" value="${Math.round(lpgPrice())}"></label>
    <p class="quiet left">${tt.lpgNote(peso(LPG_DEFAULT))}</p>
    <button class="btn primary block" type="button" id="lpgSave">${icon("check")}${tt.save}</button>
    <p class="quiet left">${tt.gasSep} ${tt.gasNo}</p>`);
  $("lpgSave").addEventListener("click", () => { const v = Math.round(+$("lpgIn").value); if (v >= 100 && v <= 10000) st.lpg = v === LPG_DEFAULT ? undefined : v; save(); closeSheet(); render(); toast(T().saved); });
}
