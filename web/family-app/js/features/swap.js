/* SAPAT family app · Money and health nudges: what a dish does and for whom, the weekly swap, and usual-vs-SAPAT comparison.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// what a dish does for the body, in plain words, and for whom
const BEN_NUT = ["iron_mg", "vit_a_ug", "calcium_mg", "protein_g"];
const BEN_ICON = { protein_g: "grow", iron_mg: "drop", vit_a_ug: "eye", calcium_mg: "bone", energy_kcal: "bolt" };
const benefitFor = (m, k) => { const a = +m.age, mom = m.status === "pregnant" || m.status === "lactating";
  if (k === "iron_mg") return mom || a < 5 || (m.sex === "F" && a >= 13 && a <= 49);
  if (k === "vit_a_ug") return mom || a < 6; if (k === "calcium_mg") return mom || a < 19; return mom || a < 13; };
function benefits(items) {
  const need = {}; BEN_NUT.forEach((k) => (need[k] = st.members.reduce((a, m) => a + (targets(m)[k] || 0), 0)));
  const got = {}; BEN_NUT.forEach((k) => (got[k] = items.reduce((a, x) => a + (FBY[x.key][k] || 0) * x.g, 0)));
  return BEN_NUT.map((k) => [k, need[k] ? got[k] / need[k] : 0]).filter(([, r]) => r >= 0.1).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => {
    const tt = T(), ms = st.members.filter((m) => benefitFor(m, k)), kids = ms.filter((m) => m.age < 13), grown = ms.filter((m) => m.age >= 13).map((m) => m.name);
    const w = ms.length === 0 || ms.length >= st.members.length ? tt.forFam : kids.length >= 2 ? tt.forKids(grown) : ms.length === 1 ? tt.forWho(ms[0].name) : tt.forWho2(ms.slice(0, -1).map((m) => m.name).join(", "), ms[ms.length - 1].name);
    return `<span class="ben">${icon(BEN_ICON[k])}<span><b>${tt.ben[k]}</b> ${esc(w)}</span></span>`;
  }).join("");
}

// one swap a week: the same protein from a cheaper food, at this month's surveyed prices
const SWAPS = [["pork_kasim", "monggo"], ["chicken", "monggo"], ["pork_liempo", "egg"], ["pork_kasim", "egg"], ["beef", "chicken"], ["pork_liempo", "galunggong"], ["chicken", "egg"], ["pork_liempo", "tilapia"]];
function swapOptions() {
  const by = {}; foodsNow.forEach((f) => (by[f.key] = f));
  const eatsAll = (k) => !(st.halal && k.startsWith("pork")) && st.members.every((m) => !UI.dietOf(m).ex(FBY[k]));
  const anyEats = (k) => !(st.halal && k.startsWith("pork")) && st.members.some((m) => !UI.dietOf(m).ex(FBY[k]));
  return SWAPS.filter(([a, b]) => by[a] && by[b] && anyEats(a) && eatsAll(b)).map(([a, b]) => {
    const A = by[a], B = by[b], ga = 500, gb0 = ga * A.protein_g / B.protein_g;
    const bq = UI.buyQty(B, gb0), piece = B.unit === "pc", pcs = piece ? bq.n : 0, gb = bq.grams;
    const ca = ga * A.price_g, cb = gb * B.price_g;
    return { a, b, ga, gb, pcs, ca, cb, save: ca - cb, iron: gb * B.iron_mg > ga * A.iron_mg * 1.15 };
  }).filter((o) => o.save >= 10).filter((o) => {
    if (FBY[o.b].group !== "eggs") return true;
    const B = weekBalance(), worst = Math.max(...B.per.map((x) => x.eggs)); return worst + o.pcs / st.members.length <= 7.5;
  }).sort((x, y) => y.save - x.save);
}
const qtyTxt = (g, pcs) => { if (!pcs) return UI.buyLabel({ key: "" }, { n: g / 1000, unit: ["kilo", "kilo", 1000] }, st.lang); return qtyTxt0(g, pcs); };
const qtyTxt0 = (g, pcs) => { const tl = st.lang === "tl"; if (pcs) return `${pcs} ${tl ? "piraso" : pcs > 1 ? "pieces" : "piece"}`; return g >= 1000 ? `${String(Math.round(g / 250) / 4).replace(".25", "¼").replace(".5", "½").replace(".75", "¾")} ${tl ? "kilo" : "kg"}` : g === 500 ? (tl ? "½ kilo" : "½ kg") : g === 250 ? (tl ? "¼ kilo" : "¼ kg") : `${g} g`; };
function swapCard() {
  const tt = T(), opts = swapOptions(); if (!opts.length) return "";
  const tried = wk.tried || [], i = (wk.swapPick || 0) % opts.length, o = opts[i], done = tried.some((t) => t.a === o.a && t.b === o.b);
  const nm = (k) => fname(k).replace(/ \(.*\)$/, "");
  return `<div class="card nudge swapc">
    <div class="nhead"><span class="bubble sun">${icon("coins")}</span><span class="htx"><small>${tt.swapH}</small><h2>${tt.swapSave(about(o.save))}${calc(() => explainFood(o.a, o.ga, qtyTxt(o.ga, 0)) + explainFood(o.b, o.gb, qtyTxt(o.gb, o.pcs)) + `<div class="cx"><ol class="steps"><li><span>${T().cSave}</span><b class="mono">${php(o.ca)} − ${php(o.cb)} = ${php(o.save)}</b><small>${T().cProt(fmt(o.ga * FBY[o.a].protein_g), fmt(o.gb * FBY[o.b].protein_g))}</small></li></ol></div>`)}</h2></span></div>
    <div class="swaprow">${pic(FBY[o.a].group, "sm")}<span><b>${esc(nm(o.a))}</b><small>${qtyTxt(o.ga, 0)}</small><small>${about(o.ca)}</small></span><span class="arrow">${icon("chev")}</span>${pic(FBY[o.b].group, "sm")}<span><b>${esc(nm(o.b))}</b><small>${qtyTxt(o.gb, o.pcs)}</small><small>${about(o.cb)}</small></span></div>
    <p class="sub">${tt.swapWhy2(o.iron)}${o.pcs ? " " + tt.perHead(o.pcs, Math.round(o.pcs / st.members.length * 10) / 10) : ""}</p>
    <div class="mact">${done ? `<span class="btn done">${icon("check")}${tt.swapTried}</span>` : `<button class="btn primary" type="button" id="swTry">${icon("heart")}${tt.swapTry}</button>`}${opts.length > 1 ? `<button class="btn link" type="button" id="swNext">${tt.swapNext}</button>` : ""}</div>
    ${st.saved > 0 ? `<p class="quiet left">${icon("coins")}${tt.tipidH(peso(st.saved))}</p>` : ""}
  </div>`;
}
function wireSwap(root) {
  const n = root.querySelector("#swNext"); if (n) n.addEventListener("click", () => { wk.swapPick = (wk.swapPick || 0) + 1; save(); render(); });
  const t = root.querySelector("#swTry"); if (t) t.addEventListener("click", () => { const r = t.getBoundingClientRect(), opts = swapOptions(), o = opts[(wk.swapPick || 0) % opts.length];
    (wk.tried = wk.tried || []).push({ a: o.a, b: o.b, g: o.gb, save: Math.round(o.save) }); st.saved += Math.round(o.save); save(); render(); burst(r); toast(T().swapTried); });
}
// the same money, the usual way vs the plan (FIES spending pattern vs the optimizer)
const meanCore = (cov) => cov.reduce((a, c) => a + CORE.reduce((x, k) => x + Math.min(c[k], 1), 0) / CORE.length, 0) / cov.length;
function compareCard() {
  if (!plan) return "";
  const tt = T(); let usual = null;
  try { usual = meanCore(S.typicalPlan(st.members, st.budget / 7, deciles()[nearestDecile()], foodsNow).coverage); } catch (e) { return ""; }
  const best = meanCore(S.coverage(plan)), pc = (x) => Math.round(x * 100) + "%";
  return `<div class="card cmpc"><div class="head"><span class="bubble">${icon("heart")}</span><h2>${tt.cmpH(peso(st.budget))}</h2></div>
    <div class="vs"><div><span>${tt.cmpUsual}</span><div class="bar"><i class="grow" style="--w:${Math.min(usual, 1) * 100}%;background:var(--ghost)"></i></div><b>${pc(usual)}</b></div>
    <div><span>${tt.cmpSapat}</span><div class="bar"><i class="grow" style="--w:${Math.min(best, 1) * 100}%;background:var(--leaf)"></i></div><b>${pc(best)}</b></div></div>
    <p class="quiet left">${tt.cmpS}</p></div>`;
}
