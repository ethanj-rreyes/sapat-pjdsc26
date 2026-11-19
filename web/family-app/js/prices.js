/* SAPAT family app · Prices: which price applies (yours, market, city, province, region), price ranges, selling units, and the
 * "Paano kinuwenta?" breakdown behind every price.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- places, prices, plan
const regionName = (k) => UI.regionName(D, k);
const P = () => UI.place(PL, st.loc);
const placeName = () => (st.loc.market ? UI.marketLabel(D, st.loc, T()) : null) || st.loc.city || st.loc.prov || regionName(st.loc.region);
let foodsAll = [], foodsNow = [], priceBy = {};
function refreshPrices() {
  SPR = {}; const p = P(); foodsAll = S.foodTable(st.loc.region, lastMonth, true, { province: p.provPsa, city: p.cityPsa, market: null, overrides: st.prices });
  priceBy = {}; foodsAll.forEach((f) => (priceBy[f.key] = f));
  foodsNow = foodsAll.filter((f) => f.source !== "estimated" || f.level !== "region"); // advice uses surveyed prices only
}
// ---------------------------------------------------------------- prices as ranges, in units people buy
// PSA prices are averages. The range comes from how much the same food's price differs between the provinces of the
// region this month (at least ±8%, at most ±25%). A price the family entered is shown as it is.
const LOCP = (window.SAPAT_LOCAL || { provinces: [] }).provinces;
let SPR = {};
function spreadOf(key) {
  if (SPR[key]) return SPR[key];
  const f = priceBy[key]; if (!f) return [1, 1]; if (f.level === "yours") return (SPR[key] = [1, 1]);
  const ref = f.price_g * 1000, ps = LOCP.filter((p) => p.region === st.loc.region).map((p) => (p.prices[lastMonth] || {})[key]).filter((v) => v > 0);
  let lo = 0.9, hi = 1.1; if (ps.length >= 2) { lo = Math.min(...ps) / ref; hi = Math.max(...ps) / ref; }
  const r = [Math.min(Math.max(lo, 0.75), 0.92), Math.max(Math.min(hi, 1.25), 1.08)];
  r.raw = { n: ps.length, min: ps.length ? Math.min(...ps) : null, max: ps.length ? Math.max(...ps) : null, ref };
  return (SPR[key] = r);
}
const pRange = (key, grams) => { const f = priceBy[key]; if (!f) return [0, 0]; const [lo, hi] = spreadOf(key), c = grams * f.price_g; return [c * lo, c * hi]; };
const sumR = (list) => list.reduce((a, [k, g]) => { const r = pRange(k, g); return [a[0] + r[0], a[1] + r[1]]; }, [0, 0]);
const rnd = (x, up) => { const sp = x < 100 ? 1 : x < 1000 ? 5 : 10; return (up ? Math.ceil(x / sp) : Math.floor(x / sp)) * sp; };
function pesoR(r) { const [lo, hi] = r; if (hi < 1) return st.lang === "tl" ? "wala pang ₱1" : "under ₱1"; const a = Math.max(1, Math.round(lo)), b = Math.max(a, Math.round(hi)); return a === b ? "₱" + fmt(a) : `₱${fmt(a)}–${fmt(b)}`; }
const mid = (r) => (r[0] + r[1]) / 2;
const about = (x) => (x < 0.5 ? (st.lang === "tl" ? "wala pang ₱1" : "under ₱1") : (st.lang === "tl" ? "mga " : "about ") + peso(Math.round(x)));
// ---------------------------------------------------------------- numbers people read at a glance
// Money is rounded to the nearest peso, percentages to whole numbers. A price shows one typical amount first (the PSA average for the
// place) with its range in small text under it. A % of need always comes with a word (Sapat / Halos sapat / Kulang pa) and a bar.
const pesoN = (x) => (x < 0.5 ? (st.lang === "tl" ? "wala pang ₱1" : "under ₱1") : peso(Math.round(x)));
const pTyp = (key, grams) => { const f = priceBy[key]; return f ? grams * f.price_g : 0; };
const sumT = (list) => list.reduce((a, [k, g]) => a + pTyp(k, g), 0);
const typR = (t, r) => `<span class="ptr"><b>${pesoN(t)}</b><small>${pesoR(r)}</small></span>`;
const needState = (r) => (r >= 0.9 ? "ok" : r >= 0.6 ? "mid" : "low");
const needTxt = (r) => { const tt = T(), s = needState(r); return s === "ok" ? tt.good : s === "mid" ? tt.mid : tt.low; };
const needWord = (r) => `<span class="word ${needState(r)}">${icon(UI.SWI[needState(r)])}${needTxt(r)}</span>`;
const pct = (r) => Math.round(r * 100) + "%";
// "Tantiya": one short explanation, in a bubble, of what an estimated price or nutrient means
const estTip = (label) => `<span class="esttip" role="button" tabindex="0" data-tip="est" aria-label="${T().estWhatL}">${label || T().planned}${icon("info")}</span>`;
function showTip(el) {
  document.querySelectorAll(".tipbub").forEach((b) => b.remove());
  const host = $("screen") || document.body, hr = host.getBoundingClientRect(), r = el.getBoundingClientRect();
  const b = document.createElement("div"); b.className = "tipbub"; b.setAttribute("role", "tooltip"); b.innerHTML = `<b>${T().estWhatH}</b><span>${T().estWhat}</span>`;
  host.appendChild(b);
  const w = b.offsetWidth, left = Math.min(Math.max(12, r.left - hr.left + r.width / 2 - w / 2), hr.width - w - 12);
  const below = r.bottom - hr.top + 8, top = below + b.offsetHeight > hr.height - 90 ? r.top - hr.top - b.offsetHeight - 8 : below;
  b.style.left = left + "px"; b.style.top = top + "px";
}
document.addEventListener("click", (e) => { const t = e.target.closest("[data-tip]"); if (t) { e.preventDefault(); e.stopPropagation(); showTip(t); return; } if (!e.target.closest(".tipbub")) document.querySelectorAll(".tipbub").forEach((b) => b.remove()); }, true);
document.addEventListener("keydown", (e) => { const t = e.target.closest && e.target.closest("[data-tip]"); if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); showTip(t); } if (e.key === "Escape") document.querySelectorAll(".tipbub").forEach((b) => b.remove()); });
// "₱52 kada kilo" with "₱48–56" under it: only the unit people buy in. The second unit (per cup, per piece) is in the breakdown.
function priceLine(key) {
  const f = FBY[key], u = UI.buyUnits(f), per = st.lang === "tl" ? "kada" : "per";
  return `<span>${pesoN(pTyp(key, u[0][2]))} ${per} ${UI.ul(u[0], st.lang)}${calc(() => explainFood(key, u[0][2], "1 " + UI.ul(u[0], st.lang)) + explainFood(key, u[1][2], "1 " + UI.ul(u[1], st.lang)))}</span><small>${pesoR(pRange(key, u[0][2]))}</small>`;
}
const unit2Line = (key) => { const u = UI.buyUnits(FBY[key]); return `${about(pTyp(key, u[1][2]))} ${st.lang === "tl" ? "kada" : "per"} ${UI.ul(u[1], st.lang)}`; };

// ---------------------------------------------------------------- "Paano kinuwenta?": a small icon beside every price opens its breakdown
let CALC = {}, calcN = 0;
const calc = (fn) => { const id = "c" + ++calcN; CALC[id] = fn; return `<span class="calc" role="button" tabindex="0" data-calc="${id}" aria-label="${T().calcH}">${icon("calc")}</span>`; };
const php = (x) => (x < 0.5 ? "<₱1" : "₱" + fmt(Math.round(x))); // whole pesos, even in the breakdown
const gtxt = (g) => (g >= 1000 ? fmt(g / 1000, 2).replace(/\.?0+$/, "") + " kg" : fmt(g) + " g");
function srcLine(key) {
  const tt = T(), f = priceBy[key], kg = f.price_g * 1000, mo = UI.monthName(lastMonth, st.lang);
  if (f.level === "yours") return tt.cY(php(kg, 0));
  const where = f.level === "region" ? regionName(st.loc.region) : f.level === "province" ? (st.loc.prov || regionName(st.loc.region)) : (st.loc.city || st.loc.prov);
  return tt.cSrc(php(kg, 0), esc(where), mo, f.source === "estimated" ? tt.cEst : "");
}
function rangeLine(key) {
  const tt = T(), f = priceBy[key], R = spreadOf(key), raw = R.raw || {};
  if (f.level === "yours") return tt.cYR;
  const base = raw.n >= 2 ? tt.cProv(raw.n, esc(regionName(st.loc.region)), php(raw.min, 0), php(raw.max, 0)) : tt.cNoProv;
  return `${base} ${tt.cClamp(Math.round((1 - R[0]) * 100), Math.round((R[1] - 1) * 100))}`;
}
// one food, one amount
function explainFood(key, grams, label) {
  const tt = T(), f = priceBy[key], R = spreadOf(key), c = grams * f.price_g;
  return `<div class="cx"><div class="cxh">${pic(FBY[key].group, "sm")}<b>${esc(fname(key))}</b>${label ? `<small>${esc(label)}</small>` : ""}</div>
    <ol class="steps">
      <li><span>${tt.cS1}</span><b>${srcLine(key)}</b></li>
      <li><span>${tt.cS2}</span><b>${label ? esc(label) + " ≈ " : ""}${gtxt(grams)}</b>${FBY[key].ep_pct && FBY[key].ep_pct < 100 ? `<small>${tt.cEp(FBY[key].ep_pct)}</small>` : ""}</li>
      <li><span>${tt.cS3}</span><b class="mono">${fmt(grams)} g × ${php(f.price_g * 1000, 0)} ÷ 1,000 g = ${php(c)}</b></li>
      <li><span>${tt.cS4}</span><small>${rangeLine(key)}</small><b class="mono">${php(c)} × ${R[0].toFixed(2)} = ${php(c * R[0])}</b><b class="mono">${php(c)} × ${R[1].toFixed(2)} = ${php(c * R[1])}</b><b>${T().cShown} ${pesoR([c * R[0], c * R[1]])}</b></li>
    </ol></div>`;
}
// a list of foods (a meal or a swap side)
function explainList(list, title, per) {
  const tt = T(); let lo = 0, hi = 0;
  const rows = list.filter(([k]) => priceBy[k]).map(([k, g]) => { const r = pRange(k, g); lo += r[0]; hi += r[1];
    return `<tr><td>${esc(fname(k))}</td><td class="n">${gtxt(g)}</td><td class="n">${php(priceBy[k].price_g * 1000, 0)}</td><td class="n">${pesoR(r)}</td></tr>`; }).join("");
  return `<div class="cx">${title ? `<div class="cxh"><b>${title}</b></div>` : ""}
    <table class="ctab"><thead><tr><th>${tt.cFood}</th><th class="n">${tt.cAmt}</th><th class="n">${tt.cPerKg}</th><th class="n">${tt.cCost}</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3">${tt.cTotal}</td><td class="n">${pesoR([lo, hi])}</td></tr>${per ? `<tr><td colspan="3">÷ ${per} ${tt.cPeople}</td><td class="n">${pesoR([lo / per, hi / per])}</td></tr>` : ""}</tfoot></table>
    <p class="quiet left">${icon("info")}${tt.cListNote}</p></div>`;
}
function openCalc(id) { const fn = CALC[id]; if (!fn) return; openSheet(T().calcH, fn() + `<p class="quiet left">${icon("tag")}${T().cWhy}</p>`); }
document.addEventListener("click", (e) => { const b = e.target.closest("[data-calc]"); if (!b) return; e.preventDefault(); e.stopPropagation(); openCalc(b.dataset.calc); }, true);
document.addEventListener("keydown", (e) => { const b = e.target.closest && e.target.closest("[data-calc]"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openCalc(b.dataset.calc); } });
