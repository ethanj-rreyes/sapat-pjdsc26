/* SAPAT LGU dashboard · Visual summaries. Price alerts: the status split (click a part to filter), Alert and Watch counts over
 * the last 24 months (click a month to open it), and which key foods moved. Province close-up: where the area's cost sits among
 * all areas. Colours are the dashboard's own status and blue scales (docs/REVISION7.md); every mark has a hover/focus tooltip,
 * and the same numbers are in the table. */
"use strict";

// ---------------------------------------------------------------- one tooltip for every chart mark ([data-tip])
const ctip = document.createElement("div"); ctip.className = "ctip"; ctip.setAttribute("role", "tooltip"); ctip.hidden = true; document.body.appendChild(ctip);
function tipAt(el, x, y) {
  ctip.innerHTML = el.dataset.tip; ctip.hidden = false;
  const w = ctip.offsetWidth, h = ctip.offsetHeight, vw = document.documentElement.clientWidth;
  ctip.style.left = Math.min(Math.max(8, x - w / 2), vw - w - 8) + "px";
  ctip.style.top = (y - h - 12 < 8 ? y + 18 : y - h - 12) + "px";
}
document.addEventListener("pointermove", (e) => { const el = e.target.closest && e.target.closest("[data-tip]"); if (el) tipAt(el, e.clientX, e.clientY); else ctip.hidden = true; });
document.addEventListener("focusin", (e) => { const el = e.target.closest && e.target.closest("[data-tip]"); if (el) { const r = el.getBoundingClientRect(); tipAt(el, r.left + r.width / 2, r.top); } else ctip.hidden = true; });
document.addEventListener("scroll", () => (ctip.hidden = true), { passive: true });

const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
const FOOD_IC = { rice_rm: "rice", galunggong: "fish", egg: "egg", monggo: "bean" };
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const foodChg = (a, k, i) => { const now = a.food(k, i); if (now == null || i < 3) return null; const p = [1, 2, 3].map((d) => a.food(k, i - d)).filter((v) => v != null); return p.length ? now / (p.reduce((x, y) => x + y, 0) / p.length) - 1 : null; };

// ---------------------------------------------------------------- Price alerts: three visual summaries
function renderVisuals() {
  const m = sit.month, i = MI[m], rows = rowsNow(), c = countsOf(rows, i), n = rows.length || 1, U = unitWord(2);
  // 1. status split: one whole, three parts
  const parts = [["alert", 2], ["watch", 1], ["steady", 0]].filter(([k]) => c[k] > 0);
  $("vSplit").innerHTML = `<div class="vhead"><h3>How many need attention</h3><p>${monthLong(m)}, ${n} ${U}. Click a part to show only those.</p></div>
    <div class="segbar" role="group" aria-label="Status of ${n} ${U}">${parts.map(([k, lv]) => `<button type="button" class="sb ${k}${sit.status === k ? " on" : ""}" style="flex:${c[k]}" data-st="${k}" aria-pressed="${sit.status === k}" aria-label="${c[k]} on ${LEVELS[lv].word}" data-tip="<b>${c[k]} ${LEVELS[lv].word}</b>${Math.round(c[k] / n * 100)}% of ${U}"></button>`).join("")}</div>
    <div class="seglegend">${[["alert", 2], ["watch", 1], ["steady", 0]].map(([k, lv]) => `<span><i class="sw ${k}"></i>${icon(LEVELS[lv].icon)}<b>${c[k]}</b> ${LEVELS[lv].word} <small>${Math.round(c[k] / n * 100)}%</small></span>`).join("")}</div>
    ${(() => { const withC = rows.filter((a) => a.cond[i] != null); if (!withC.length) return ""; const top = withC.reduce((p, q) => (q.cond[i] > p.cond[i] ? q : p));
      return `<div class="vstats"><div><small>Typical cost</small><b>${peso(median(withC.map((a) => a.cond[i])))}</b><small>per person a day</small></div><div><small>Highest</small><b>${peso(top.cond[i])}</b><small>${esc(top.name)}</small></div></div>`; })()}`;
  $("vSplit").querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => { sit.status = sit.status === b.dataset.st ? "all" : b.dataset.st; renderSituation(); }));

  // 2. Alert and Watch counts, last 24 months (stacked columns from one baseline)
  const i0 = Math.max(MI[MONTHS[0]], i - 23), idx = []; for (let k = i0; k <= i; k++) idx.push(k);
  const cnt = idx.map((k) => ({ k, a: rows.filter((r) => r.level[k] === 2).length, w: rows.filter((r) => r.level[k] === 1).length }));
  const W = 480, H = 168, L = 30, R = 6, T = 10, B = 24, peak = Math.max(4, ...cnt.map((x) => x.a + x.w));
  const step = peak > 40 ? 20 : peak > 16 ? 10 : peak > 8 ? 4 : 2, top = Math.ceil(peak / step) * step;
  const slot = (W - L - R) / idx.length, bw = Math.min(14, slot - 4), y = (v) => T + (H - T - B) * (1 - v / top), base = y(0);
  let g = "";
  for (let v = 0; v <= top; v += step) g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const col = (x, y1, y2, cls, roundTop) => { const h = y1 - y2; if (h <= 0.5) return ""; const r = roundTop ? Math.min(3, h / 2) : 0;
    return `<path class="${cls}" d="M${x} ${y1}V${y2 + r}${r ? `Q${x} ${y2} ${x + r} ${y2}H${x + bw - r}Q${x + bw} ${y2} ${x + bw} ${y2 + r}` : `H${x + bw}`}V${y1}Z"/>`; };
  const bars = cnt.map((d, j) => {
    const x = L + j * slot + (slot - bw) / 2, ya = y(d.a), yw = y(d.a + d.w), cur = d.k === i;
    const tip = `<b>${monthName(D.months[d.k])}</b>${d.a} on Alert, ${d.w} on Watch`;
    return `<g class="mcol${cur ? " cur" : ""}" tabindex="0" role="button" data-m="${D.months[d.k]}" data-tip="${esc(tip)}" aria-label="${esc(monthName(D.months[d.k]))}: ${d.a} on Alert, ${d.w} on Watch">
      <rect class="hit" x="${L + j * slot}" y="${T}" width="${slot}" height="${H - T - B + 6}"/>
      ${col(x, base, ya, "b2", !d.w)}${col(x, ya - (d.a && d.w ? 2 : 0), yw, "b1", true)}
      ${cur ? `<path class="curmk" d="M${x + bw / 2 - 5} ${H - 4}L${x + bw / 2} ${H - 11}L${x + bw / 2 + 5} ${H - 4}Z"/>` : ""}</g>`;
  }).join("");
  const yrs = idx.map((k, j) => D.months[k].endsWith("-01") ? `<text x="${L + j * slot + slot / 2}" y="${H - 6}" text-anchor="middle">${D.months[k].slice(0, 4)}</text>` : "").join("");
  const last = cnt[cnt.length - 1], prev = cnt.length > 1 ? cnt[cnt.length - 2] : null;
  const delta = prev ? last.a + last.w - (prev.a + prev.w) : 0;
  $("vTrend").innerHTML = `<div class="vhead"><h3>Is it getting worse?</h3><p>${U.charAt(0).toUpperCase() + U.slice(1)} on Alert or Watch each month. ${prev ? (delta > 0 ? `<b>${delta} more</b> than ${monthName(D.months[prev.k])}.` : delta < 0 ? `<b>${-delta} fewer</b> than ${monthName(D.months[prev.k])}.` : `Same as ${monthName(D.months[prev.k])}.`) : ""} Click a month to open it.</p></div>
    <svg class="vchart" viewBox="0 0 ${W} ${H}" role="group" aria-label="Alert and Watch counts, ${monthName(D.months[i0])} to ${monthName(m)}">${g}${bars}${yrs}</svg>
    <div class="vlegend"><span><i class="sw alert"></i>Alert</span><span><i class="sw watch"></i>Watch</span><span><svg viewBox="0 0 12 10" aria-hidden="true"><path class="curmk" d="M1 9L6 2L11 9Z"/></svg>month shown</span></div>`;
  $("vTrend").querySelectorAll("[data-m]").forEach((g2) => { const go = () => setSitMonth(g2.dataset.m); g2.addEventListener("click", go); g2.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }); });

  // 3. key foods: median change vs the 3 months before, across the areas in view (diverging bars from zero)
  const kf = KEY_FOODS.map((f) => { const ch = rows.map((a) => foodChg(a, f.k, i)).filter((v) => v != null); return { f, med: median(ch), up: ch.filter((v) => v >= 0.05).length, n: ch.length }; });
  const span = Math.max(0.06, ...kf.map((x) => Math.abs(x.med || 0))) * 1.15;
  $("vFoods").innerHTML = `<div class="vhead"><h3>Which foods moved</h3><p>Typical price change vs the 3 months before, across the ${U} in view.</p></div>
    <div class="fbars">${kf.map(({ f, med, up, n: nn }) => { const w = med == null ? 0 : Math.abs(med) / span * 50, pos = (med || 0) >= 0;
      return `<div class="fbar" data-tip="<b>${esc(f.label)}</b>Typical change ${pctSigned(med)}; up 5% or more in ${up} of ${nn} ${U}" tabindex="0">
        <span class="fic">${icon(FOOD_IC[f.k])}</span><span class="fname">${esc(cap(f.name))}<small>up 5%+ in ${up} of ${nn}</small></span>
        <span class="ftrack"><i class="zero"></i>${med == null ? "" : `<i class="fb ${pos ? "pos" : "neg"}" style="${pos ? "left:50%" : `right:50%`};width:${w}%"></i>`}</span>
        <b class="fval">${med == null ? "–" : pctSigned(med)}</b></div>`; }).join("")}</div>
    <div class="vlegend"><span><i class="sw neg"></i>cheaper</span><span><i class="sw pos"></i>pricier</span></div>`;
}

// ---------------------------------------------------------------- Province close-up: where this area's cost sits
function rankStrip(a, i) {
  const all = areaList(a.kind === "prov" ? "prov" : "region").filter((x) => x.cond[i] != null), v = a.cond[i]; if (v == null || all.length < 3) return "";
  const lo = Math.min(...all.map((x) => x.cond[i])), hi = Math.max(...all.map((x) => x.cond[i]));
  const W = 640, H = 78, L = 14, R = 14, x = (c) => L + (W - L - R) * (hi > lo ? (c - lo) / (hi - lo) : 0.5), yc = 34;
  const rank = all.slice().sort((p, q) => q.cond[i] - p.cond[i]).findIndex((x2) => x2.key === a.key) + 1;
  const peers = a.kind === "prov" ? all.filter((x2) => x2.region === a.region && x2.key !== a.key) : [];
  const others = all.filter((x2) => x2.key !== a.key && !peers.includes(x2));
  const dot = (p, cls, r) => `<circle class="${cls}" cx="${x(p.cond[i]).toFixed(1)}" cy="${yc + ((p.key.length * 7) % 13) - 6}" r="${r}" tabindex="-1" data-tip="<b>${esc(p.name)}</b>${peso(p.cond[i])} a day, ${p.level[i] == null ? "no data" : LEVELS[p.level[i]].word}"/>`;
  const tx = Math.min(Math.max(x(v), 60), W - 60);
  const word = a.kind === "prov" ? "provinces" : "regions";
  return `<figure class="rankfig"><figcaption><b>Where ${esc(a.name)} sits</b><span>Cost of a healthy day in all ${all.length} ${word}, ${monthName(D.months[i])}. ${rank === 1 ? "The highest" : `${ordinal(rank)} highest`} of ${all.length}.</span></figcaption>
    <svg class="vchart rank" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(a.name)} costs ${peso(v)} a day, ${rank} highest of ${all.length} ${word}; range ${peso(lo)} to ${peso(hi)}.">
      <line class="grid" x1="${L}" x2="${W - R}" y1="${yc}" y2="${yc}"/>
      ${others.map((p) => dot(p, "d0", 4)).join("")}${peers.map((p) => dot(p, "d1", 4.5)).join("")}
      <circle class="me" cx="${x(v)}" cy="${yc}" r="7"/><text class="lab" x="${tx}" y="${yc - 14}" text-anchor="middle">${peso(v)}</text>
      <text x="${L}" y="${H - 6}">${peso(lo)} lowest</text><text x="${W - R}" y="${H - 6}" text-anchor="end">${peso(hi)} highest</text></svg>
    <div class="vlegend"><span><i class="sw me"></i>${esc(a.name)}</span>${peers.length ? `<span><i class="sw d1"></i>Others in ${esc(regionName(a.region))}</span>` : ""}<span><i class="sw d0"></i>Other ${word}</span></div></figure>`;
}
// a small diverging bar for a key-food change, beside its number
const miniBar = (chg) => chg == null ? "" : `<span class="mini" aria-hidden="true"><i class="zero"></i><i class="fb ${chg >= 0 ? "pos" : "neg"}" style="${chg >= 0 ? "left:50%" : "right:50%"};width:${Math.min(50, Math.abs(chg) / 0.2 * 50)}%"></i></span>`;
