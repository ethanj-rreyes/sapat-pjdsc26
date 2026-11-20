/* SAPAT LGU dashboard · Price alerts (the country view) and Province close-up (one area at a time).
 * Price alerts: filters, a one-line answer, the map with the Alert/Watch list beside it (scrolls; "Full view" opens all of it
 * in a window), the filtered table, and how the levels are set. Close-up: the areas on Alert in a list, the chosen one in detail. */
"use strict";

const sit = Object.assign({ area: "PH", month: lastMonth, level: "prov", measure: "cost", sel: null, sort: null, status: "all", q: "" }, store.get("sit", {}));
sit.q = ""; // a search is never carried over to the next visit
if (!MONTHS.includes(sit.month)) sit.month = lastMonth;
if (!PROV) sit.level = "region";
const fc = Object.assign({ status: "alert", area: "PH", q: "" }, store.get("focus", {})); fc.q = "";
const saveSit = () => { store.set("sit", { area: sit.area, month: sit.month, level: sit.level, measure: sit.measure, sel: sit.sel, sort: sit.sort, status: sit.status }); store.set("focus", { status: fc.status, area: fc.area }); };

// the areas in view: provinces in the chosen area, or every region
const inArea = (a) => sit.level === "region" || sit.area === "PH" || a.region === sit.area;
const rowsNow = () => areaList(sit.level).filter(inArea);
const unitWord = (n) => (sit.level === "region" ? (n === 1 ? "region" : "regions") : (n === 1 ? "province" : "provinces"));
// filters: status (all, alert, watch, steady) and a name search over the area and its region
const STATUS = [["all", "All"], ["alert", "Alert"], ["watch", "Watch"], ["steady", "Steady"]];
const ST_LV = { alert: 2, watch: 1, steady: 0 };
const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const nameHit = (a, q) => !q || norm(a.name).includes(norm(q)) || (a.kind === "prov" && norm(regionName(a.region)).includes(norm(q)));
const stHit = (a, i, st) => st === "all" || (st === "attn" ? lvOf(a, i) >= 1 : lvOf(a, i) === ST_LV[st]);
const passes = (a, i) => stHit(a, i, sit.status) && nameHit(a, sit.q);
const filtered = () => { const i = MI[sit.month]; return rowsNow().filter((a) => passes(a, i)); };
const filterNote = () => [sit.status !== "all" ? STATUS.find((x) => x[0] === sit.status)[1] + " only" : "", sit.q ? `matching "${sit.q}"` : ""].filter(Boolean).join(", ");
// attention order: Alert, then Watch, then steady; within a level the bigger rise first
function attentionSort(list, i) {
  const rise = (a) => Math.max(a.vs3[i] == null ? -9 : a.vs3[i], a.level[i] === 2 && a.yoy[i] != null ? a.yoy[i] - RULE.alertYoy + RULE.alert3 : -9);
  return list.slice().sort((x, y) => (lvOf(y, i) ?? -1) - (lvOf(x, i) ?? -1) || rise(y) - rise(x));
}
const statusSeg = (el, cur, counts, opts) => {
  el.innerHTML = opts.map(([k, l]) => `<button type="button" data-st="${k}" aria-pressed="${k === cur}"><span class="sl">${k !== "all" && k !== "attn" ? icon(LEVELS[ST_LV[k]].icon) : ""}${l}</span>${counts ? ` <span class="ct">${counts[k]}</span>` : ""}</button>`).join("");
};
const countsOf = (rows, i) => ({ all: rows.length, attn: rows.filter((a) => lvOf(a, i) >= 1).length, alert: rows.filter((a) => lvOf(a, i) === 2).length, watch: rows.filter((a) => lvOf(a, i) === 1).length, steady: rows.filter((a) => lvOf(a, i) === 0).length });

// ---------------------------------------------------------------- controls
function setupControls() {
  const areaOpts = [["PH", "Whole Philippines"]].concat(REGIONS.map((r) => [r, regionName(r)])).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join("");
  const monthOpts = MONTHS.slice().reverse().map((m) => `<option value="${m}">${monthLong(m)}${m === lastMonth ? " (latest)" : ""}</option>`).join("");
  $("area").innerHTML = areaOpts; $("fArea").innerHTML = areaOpts;
  $("month").innerHTML = monthOpts; $("fMonth").innerHTML = monthOpts;
  $("mPrev").innerHTML = icon("left"); $("mNext").innerHTML = icon("chev"); $("adClose").innerHTML = icon("close");
  $("area").addEventListener("change", (e) => { sit.area = e.target.value; sit.sel = null; if (sit.level === "region" && sit.area !== "PH") sit.sel = sit.area; drawMap(); renderSituation(); });
  $("month").addEventListener("change", (e) => setSitMonth(e.target.value));
  $("mPrev").addEventListener("click", () => { const k = MONTHS.indexOf(sit.month); if (k > 0) setSitMonth(MONTHS[k - 1]); });
  $("mNext").addEventListener("click", () => { const k = MONTHS.indexOf(sit.month); if (k < MONTHS.length - 1) setSitMonth(MONTHS[k + 1]); });
  $("levelSeg").innerHTML = (PROV ? [["prov", "Provinces"], ["region", "Regions"]] : [["region", "Regions"]]).map(([k, l]) => `<button type="button" data-l="${k}">${l}</button>`).join("");
  $("levelSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { sit.level = b.dataset.l; sit.sel = sit.level === "region" && sit.area !== "PH" ? sit.area : null; drawMap(); renderSituation(); }));
  $("statusSeg").addEventListener("click", (e) => { const b = e.target.closest("[data-st]"); if (b) { sit.status = b.dataset.st; renderSituation(); } });
  $("adStatus").addEventListener("click", (e) => { const b = e.target.closest("[data-st]"); if (b) { sit.status = b.dataset.st; renderSituation(); } });
  const onFind = (v) => { sit.q = v; $("find").value = v; $("adFind").value = v; renderFiltered(); };
  $("find").addEventListener("input", (e) => onFind(e.target.value));
  $("adFind").addEventListener("input", (e) => onFind(e.target.value));
  $("aFull").addEventListener("click", () => { renderDialog(); $("aDialog").showModal(); });
  $("adClose").addEventListener("click", () => $("aDialog").close());
  $("aDialog").addEventListener("click", (e) => { if (e.target === $("aDialog")) $("aDialog").close(); }); // click on the backdrop
  // Province close-up
  $("fMonth").addEventListener("change", (e) => { sit.month = e.target.value; saveSit(); renderFocus(); });
  $("fArea").addEventListener("change", (e) => { fc.area = e.target.value; saveSit(); renderFocus(); });
  $("fStatus").addEventListener("click", (e) => { const b = e.target.closest("[data-st]"); if (b) { fc.status = b.dataset.st; saveSit(); renderFocus(); } });
  $("fFind").addEventListener("input", (e) => { fc.q = e.target.value; renderFocus(); });
  // the "More measures" list closes on a click outside it or on Escape
  document.addEventListener("click", (e) => { const det = document.querySelector(".moreM"); if (det && det.open && !det.contains(e.target)) det.open = false; });
  document.addEventListener("keydown", (e) => { const det = document.querySelector(".moreM"); if (e.key === "Escape" && det && det.open) { det.open = false; det.querySelector("summary").focus(); } });
  $("fresh").innerHTML = `${icon("cal")}<span>Latest PSA prices: <b>${monthLong(lastMonth)}</b></span>`;
}
function setSitMonth(m) { sit.month = m; renderSituation(); }

// ---------------------------------------------------------------- the answer (one line)
function renderAnswer() {
  const m = sit.month, i = MI[m], rows = rowsNow(), c = countsOf(rows, i), n = rows.length;
  const where = sit.level === "prov" && sit.area !== "PH" ? `${regionName(sit.area)}, ` : "", when = monthLong(m);
  let head;
  if (!c.alert && !c.watch) head = `${where}${when}: ${n === 1 ? "the" : "all " + n} ${unitWord(n)} ${n === 1 ? "is" : "are"} steady.`;
  else if (c.alert && c.watch) head = `${where}${when}: ${c.alert} of ${n} ${unitWord(n)} on Alert, ${c.watch} on Watch.`;
  else head = `${where}${when}: ${c.alert || c.watch} of ${n} ${unitWord(n)} on ${c.alert ? "Alert" : "Watch"}.`;
  $("ansH").textContent = head;
  const costs = rows.map((a) => a.cond[i]).filter((v) => v != null);
  $("ansSub").textContent = (c.alert || c.watch ? `${c.steady} ${c.steady === 1 ? "is" : "are"} steady. ` : "") +
    (costs.length > 1 ? `A healthy day costs ${peso(Math.min(...costs))} to ${peso(Math.max(...costs))} per person, depending on the ${unitWord(1)}.` : costs.length ? `A healthy day costs ${peso(costs[0])} per person.` : "");
}

// ---------------------------------------------------------------- the Alert/Watch list beside the map, and its full view
// The side list shows what needs attention (Alert and Watch) unless the status filter asks for something else.
const sideRows = () => { const i = MI[sit.month], st = sit.status === "all" ? "attn" : sit.status; return attentionSort(rowsNow().filter((a) => stHit(a, i, st) && nameHit(a, sit.q)), i); };
function alertItems(list, full) {
  const m = sit.month, i = MI[m];
  if (!list.length) return `<li class="calm">${icon("shield")}<span>${sit.q ? `Nothing matches "${esc(sit.q)}".` : sit.status === "all" ? `No ${unitWord(2)} on Alert or Watch this month.` : `No ${unitWord(2)} on ${STATUS.find((x) => x[0] === sit.status)[1]} this month.`}</span></li>`;
  let html = "", cur = -2;
  list.forEach((a) => {
    const lv = lvOf(a, i);
    if (lv !== cur) { cur = lv; const n = list.filter((x) => lvOf(x, i) === lv).length;
      html += `<li class="ghead ${lv == null ? "none" : LEVELS[lv].k}"><b>${n} on ${lv == null ? "no data" : LEVELS[lv].word}.</b>${lv != null && full ? ` <span>${esc(ACTIONS[lv].short)}</span>` : ""}</li>`; }
    const w = why(a, m), c3 = a.vs3[i];
    html += full
      ? `<li class="arow ${lv == null ? "none" : LEVELS[lv].k}${a.key === sit.sel ? " sel" : ""}" data-k="${esc(a.key)}">${tag(lv)}
          <div class="atx"><p class="s">${esc(sentence(a, m))}</p>${w ? `<p class="w">${esc(w)}</p>` : ""}</div>
          <button type="button" class="btn small ghost" data-see="${esc(a.key)}" aria-label="Close-up of ${esc(a.name)}">Close-up${chev()}</button></li>`
      : `<li class="srow${a.key === sit.sel ? " sel" : ""}" data-k="${esc(a.key)}" tabindex="0">
          <span class="sname"><b>${esc(a.name)}</b><small>${a.kind === "prov" && sit.area === "PH" ? esc(regionName(a.region)) + " · " : ""}${peso(a.cond[i])} a day</small></span>
          <span class="schg ${lv == null ? "" : LEVELS[lv].k}">${pctSigned(c3)}<small>vs 3 mo.</small></span>
          ${w ? `<span class="swhy">${esc(w)}</span>` : ""}
          <button type="button" class="btn small ghost" data-see="${esc(a.key)}" aria-label="Close-up of ${esc(a.name)}">Close-up${chev()}</button></li>`;
  });
  return html;
}
function wireAlertList(root) {
  root.querySelectorAll("[data-see]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); if ($("aDialog").open) $("aDialog").close(); openFocus(b.dataset.see); }));
  root.querySelectorAll("li[data-k]").forEach((li) => {
    const go = () => { pickArea(li.dataset.k); if ($("aDialog").open) $("aDialog").close(); };
    li.addEventListener("click", go);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    li.addEventListener("mouseenter", () => hot(li.dataset.k)); li.addEventListener("mouseleave", () => hot(null));
  });
}
function renderSide() {
  const list = sideRows(), i = MI[sit.month];
  const what = sit.status === "all" ? "Needs attention" : STATUS.find((x) => x[0] === sit.status)[1];
  $("apH").textContent = `${what} (${list.length})`;
  $("apSub").textContent = `${monthLong(sit.month)}${sit.q ? `, matching "${sit.q}"` : ""}. Most urgent first.`;
  $("alist").innerHTML = alertItems(list, false); if (!sit._scrollSide) $("alist").scrollTop = 0;
  wireAlertList($("alist"));
  const sel = $("alist").querySelector("li.sel"); if (sel && sit._scrollSide) { sel.scrollIntoView({ block: "nearest" }); sit._scrollSide = false; }
  if ($("aDialog").open) renderDialog();
}
function renderDialog() {
  const list = sideRows(), i = MI[sit.month];
  $("adH").textContent = `${sit.status === "all" ? "Everything that needs attention" : STATUS.find((x) => x[0] === sit.status)[1] + " only"}: ${list.length} ${unitWord(list.length)}`;
  $("adSub").textContent = `${sit.level === "prov" && sit.area !== "PH" ? regionName(sit.area) + ", " : ""}${monthLong(sit.month)}. What to do is said once per group.`;
  statusSeg($("adStatus"), sit.status, countsOf(rowsNow().filter((a) => nameHit(a, sit.q)), i), STATUS);
  $("adFind").value = sit.q;
  $("adList").innerHTML = alertItems(list, true);
  hydrateIcons($("adList")); wireAlertList($("adList"));
}
function openFocus(k) {
  const a = areaBy(k); if (!a) return; sit.sel = k;
  if (fc.status !== "all" && !stHit(a, MI[sit.month], fc.status)) fc.status = lvOf(a, MI[sit.month]) >= 1 ? "attn" : "all";
  if (a.kind === "prov" && fc.area !== "PH" && fc.area !== a.region) fc.area = a.region;
  fc.q = ""; $("fFind").value = ""; saveSit(); showView("focus"); window.scrollTo(0, 0);
}

// ---------------------------------------------------------------- measures
function renderMeasures() {
  const main = MEASURES.filter((x) => x.main), more = MEASURES.filter((x) => !x.main);
  const extraOn = !measureBy(sit.measure).main;
  $("measures").innerHTML = `<span class="mlab">The map and table show</span>` + main.map((x) => `<button type="button" class="chip" data-k="${x.k}" aria-pressed="${x.k === sit.measure}">${x.name}</button>`).join("") +
    `<details class="moreM"><summary class="chip${extraOn ? " on" : ""}">${extraOn ? esc(measureBy(sit.measure).name) : `More measures (${more.length})`}${chev()}</summary>
      <div class="mpop">${more.map((x) => `<button type="button" class="opt" data-k="${x.k}" aria-pressed="${x.k === sit.measure}"><b>${x.name}</b><small>${x.unit}</small></button>`).join("")}</div></details>`;
  $("measures").querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => { sit.measure = b.dataset.k; renderSituation(); }));
  const det = $("measures").querySelector(".moreM"); // open the list leftwards when the button sits near the right edge
  det.addEventListener("toggle", () => det.classList.toggle("flip", det.getBoundingClientRect().left + 370 > document.documentElement.clientWidth));
}

// ---------------------------------------------------------------- map
const SVGNS = "http://www.w3.org/2000/svg";
// a point inside each shape for its marker: centroid of its largest ring
const centroidCache = {};
function centroidOf(a) {
  if (centroidCache[a.kind + a.key]) return centroidCache[a.kind + a.key];
  let best = null;
  a.d.split(/(?=M)/).forEach((ring) => {
    const n = ring.match(/-?[\d.]+/g); if (!n || n.length < 6) return;
    const pts = []; for (let k = 0; k + 1 < n.length; k += 2) pts.push([+n[k], +n[k + 1]]);
    let A = 0, cx = 0, cy = 0;
    for (let k = 0; k < pts.length; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length], f = x0 * y1 - x1 * y0; A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f; }
    if (Math.abs(A) < 1e-9) return;
    const c = { x: cx / (3 * A), y: cy / (3 * A), A: Math.abs(A / 2) };
    if (!best || c.A > best.A) best = c;
  });
  return (centroidCache[a.kind + a.key] = best || { x: 0, y: 0, A: 0 });
}
function bboxOf(list) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  list.forEach((a) => { const n = a.d.match(/-?[\d.]+/g); for (let k = 0; k + 1 < n.length; k += 2) { const x = +n[k], y = +n[k + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } });
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
let viewW = MAP.w;
function drawMap() {
  const all = areaList(sit.level).filter((a) => a.d), zoom = sit.level === "prov" && sit.area !== "PH";
  let vb = { x: 0, y: 0, w: MAP.w, h: MAP.h };
  if (zoom) { const b = bboxOf(all.filter(inArea)), pad = Math.max(b.w, b.h) * 0.08 + 4; vb = { x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad }; }
  viewW = vb.w;
  const sw = vb.w / MAP.w; // keep strokes the same on screen when zoomed in
  $("phMap").innerHTML = `<svg viewBox="${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}" style="--sw:${sw.toFixed(3)}" role="group" aria-label="Map of ${zoom ? esc(regionName(sit.area)) : "the Philippines"} by ${sit.level === "prov" ? "province" : "region"}">
    ${all.map((a) => `<path class="rg${a.kind === "prov" && !a.psa ? " nops" : ""}${inArea(a) ? "" : " out"}" data-u="${esc(a.key)}" d="${a.d}"${inArea(a) ? ` tabindex="0" role="button" aria-label="${esc(a.name)}"` : ` aria-hidden="true"`}></path>`).join("")}
    ${zoom && MAP.paths[sit.area] ? `<path class="regline" d="${MAP.paths[sit.area]}" aria-hidden="true"/>` : ""}
    <g id="ncrInset"></g><g id="marks" aria-hidden="true"></g></svg>`;
  const ncr = all.find((a) => a.region === "NCR");
  if (ncr && !zoom) { // Metro Manila is too small to see at country scale: draw it again, larger, in an inset
    const b = bboxOf([ncr]), Sx = Math.min(10, 90 / Math.max(b.w, b.h)), ox = 40, oy = 330;
    $("ncrInset").innerHTML = `<rect x="${ox - 8}" y="${oy - 22}" width="${b.w * Sx + 16}" height="${b.h * Sx + 30}" rx="8" fill="var(--surface)" stroke="var(--line)"/><text x="${ox - 2}" y="${oy - 8}">Metro Manila</text>
      <line x1="${ox + b.w * Sx + 8}" y1="${oy + b.h * Sx / 2}" x2="${b.x}" y2="${b.y + b.h / 2}" stroke="var(--ink-2)" stroke-dasharray="3 3"/>
      <path class="rg" data-u="${esc(ncr.key)}" tabindex="-1" transform="translate(${ox - b.x * Sx} ${oy - b.y * Sx}) scale(${Sx})" d="${ncr.d}" style="stroke-width:${0.8 / Sx}"></path>`;
  }
  $("phMap").querySelectorAll("path.rg:not(.out)").forEach((p) => {
    const k = p.dataset.u;
    p.addEventListener("mousemove", (e) => { showTip(k, e); hot(k); });
    p.addEventListener("mouseleave", () => { $("mapTip").hidden = true; hot(null); });
    p.addEventListener("click", () => pickArea(k));
    p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickArea(k); } });
    p.addEventListener("focus", () => { const r = p.getBoundingClientRect(); showTip(k, { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }); hot(k); });
    p.addEventListener("blur", () => { $("mapTip").hidden = true; hot(null); });
  });
}
const binOf = (M, v, vals) => {
  if (v == null) return null;
  if (M.kind === "status") return v;
  if (M.kind === "div") { const t = Math.max(-1, Math.min(1, v / M.span)); return t <= -0.5 ? 0 : t < -0.15 ? 1 : t <= 0.15 ? 2 : t < 0.5 ? 3 : 4; }
  const lo = Math.min(...vals), hi = Math.max(...vals); let t = hi > lo ? (v - lo) / (hi - lo) : 0.5; if (M.rev) t = 1 - t;
  return Math.min(4, Math.floor(t * 5));
};
const colorOf = (M, b) => b == null ? "var(--nodata)" : M.kind === "status" ? `var(--st${b})` : M.kind === "div" ? `var(--div${b + 1})` : `var(--seq${b + 1})`;
function paintMap() {
  const M = measureBy(sit.measure), m = sit.month, i = MI[m], all = areaList(sit.level), vals = {};
  all.forEach((a) => (vals[a.key] = valOf(M, a, m)));
  const list = all.filter(inArea).map((a) => vals[a.key]).filter((v) => v != null);
  $("phMap").querySelectorAll("path.rg").forEach((p) => {
    const k = p.dataset.u; p.style.fill = p.classList.contains("out") ? "" : colorOf(M, binOf(M, vals[k], list));
    p.classList.toggle("sel", k === sit.sel);
    const a = areaBy(k); p.classList.toggle("fade", !!a && !p.classList.contains("out") && !passes(a, i));
  });
  // Watch and Alert marks on every measure, so status never depends on colour alone
  const r = viewW / 80;
  $("marks").innerHTML = all.filter((a) => a.d && inArea(a) && lvOf(a, i) >= 1).map((a) => {
    const c = centroidOf(a), lv = lvOf(a, i);
    return lv === 2
      ? `<path class="mk alert" d="M${c.x} ${c.y - r * 1.15}L${c.x + r} ${c.y + r * 0.6}L${c.x - r} ${c.y + r * 0.6}Z" style="stroke-width:${r * 0.28}"/>`
      : `<circle class="mk watch" cx="${c.x}" cy="${c.y}" r="${r * 0.62}" style="stroke-width:${r * 0.34}"/>`;
  }).join("");
  $("mapTitle").textContent = M.name + (M.timed ? `, ${monthLong(m)}` : "");
  $("mapUnit").textContent = M.unit + (sit.level === "prov" ? ", by province" : ", by region");
  const marks = `<div class="mklegend"><span><svg viewBox="0 0 20 20" aria-hidden="true"><path class="mk alert" d="M10 3.5L16.5 15H3.5Z" style="stroke-width:1.8"/></svg>Alert</span><span><svg viewBox="0 0 20 20" aria-hidden="true"><circle class="mk watch" cx="10" cy="10" r="4.6" style="stroke-width:2.4"/></svg>Watch</span><span class="q">marks show on every measure</span></div>`;
  if (M.kind === "status") {
    $("mapLegend").innerHTML = `<div class="stl">${LEVELS.map((L, b) => `<span><i class="sw" style="background:var(--st${b})"></i>${tag(b)}<b>${list.filter((v) => v === b).length}</b></span>`).join("")}</div>` + marks;
  } else if (list.length) {
    const lo = Math.min(...list), hi = Math.max(...list);
    const ends = M.kind === "div" ? [M.fmt(-M.span) + " or less", "no change", M.fmt(M.span) + " or more"] : M.rev ? [M.fmt(hi), "", M.fmt(lo)] : [M.fmt(lo), "", M.fmt(hi)];
    const words = M.kind === "div" ? ["cheaper", "pricier"] : M.rev ? ["covers more", "covers less"] : ["lower", "higher"];
    $("mapLegend").innerHTML = `<div class="ramp"><div class="sws">${[0, 1, 2, 3, 4].map((b) => `<i style="background:${colorOf(M, b)}"></i>`).join("")}</div><div class="ends"><span>${ends[0]}</span><span>${ends[1]}</span><span>${ends[2]}</span></div><div class="ends q"><span>${words[0]}</span><span>${words[1]}</span></div></div>` + marks;
  } else $("mapLegend").innerHTML = marks;
  $("mapNote").textContent = `Source: ${M.src}${M.timed ? ", " + monthLong(m) : ""}. ` + (sit.level === "prov"
    ? "Faded areas have no province price survey and use regional prices. Highly urbanized cities are drawn inside their province."
    : "Negros Island Region is drawn inside Western and Central Visayas; it is in the table.") + (M.kind === "seq" ? " Colours split the range shown into 5 equal steps." : "");
}
function hot(k) {
  $("phMap").classList.toggle("dim", !!k);
  $("phMap").querySelectorAll("path.rg").forEach((p) => p.classList.toggle("hot", p.dataset.u === k));
  $("tbl").querySelectorAll("tr[data-k]").forEach((t) => t.classList.toggle("hot", t.dataset.k === k));
  $("alist").querySelectorAll("li[data-k]").forEach((t) => t.classList.toggle("hot", t.dataset.k === k));
}
function showTip(k, ev) {
  const a = areaBy(k); if (!a) return; const M = measureBy(sit.measure), m = sit.month, i = MI[m], v = valOf(M, a, m), lv = lvOf(a, i);
  const tip = $("mapTip"), card = $("phMap").closest(".look");
  tip.innerHTML = `<b>${esc(a.name)}</b>${a.kind === "prov" ? `<span>${esc(regionName(a.region))}</span>` : ""}${M.k !== "level" ? `<span>${M.name}: <strong>${v == null ? "no data" : M.fmt(v)}</strong></span>` : ""}<span>${lv == null ? "No data" : LEVELS[lv].word}${M.k !== "cost" && a.cond[i] != null ? `, ${peso(a.cond[i])} a day` : ""}</span>`;
  tip.hidden = false;
  const r = card.getBoundingClientRect(); let px = ev.clientX - r.left + 14, py = ev.clientY - r.top + 14;
  if (px + 220 > r.width) px -= 240; tip.style.left = px + "px"; tip.style.top = py + "px";
}

// ---------------------------------------------------------------- table
const COLS = () => {
  const base = ["name", "level", "cost", "chg3", "yoy", "why"];
  if (!measureBy(sit.measure).main && sit.measure !== "yoy") base.splice(5, 0, sit.measure);
  return base;
};
function colDef(k, m) {
  const mo = monthName(m);
  if (k === "name") return { k, h: sit.level === "prov" ? "Province" : "Region", sub: sit.level === "prov" && sit.area === "PH" ? "and region" : "", txt: true, val: (a) => a.name };
  if (k === "why") return { k, h: "Key food that rose most", sub: "rice, galunggong, eggs, monggo", txt: true, val: (a) => { const i = MI[m], d = drivers(a, i, trigger(a, i))[0]; return d ? d.chg : null; } };
  const M = measureBy(k);
  return { k, h: M.name, sub: (M.k === "level" ? "" : M.short + ", ") + (M.timed ? mo : "2023"), M, val: (a) => valOf(M, a, m) };
}
function sortedRows() {
  const m = sit.month, i = MI[m], rows = filtered();
  if (!sit.sort) return attentionSort(rows, i);
  const c = colDef(sit.sort.k, m), dir = sit.sort.dir === "asc" ? 1 : -1;
  return rows.slice().sort((x, y) => {
    const a = c.val(x), b = c.val(y);
    if (a == null && b == null) return 0; if (a == null) return 1; if (b == null) return -1;
    return (typeof a === "string" ? a.localeCompare(b) : a - b) * dir;
  });
}
function renderTable() {
  const m = sit.month, i = MI[m], cols = COLS().map((k) => colDef(k, m)), rows = sortedRows();
  const all = rowsNow().length, fn = filterNote();
  $("tblTitle").textContent = `${fn ? `${rows.length} of ${all}` : rows.length} ${unitWord(fn ? all : rows.length)}${sit.level === "prov" && sit.area !== "PH" ? " in " + regionName(sit.area) : ""}, ${monthLong(m)}${fn ? ` (${fn})` : ""}`;
  const ariaSort = (k) => !sit.sort ? (k === "level" ? "descending" : "none") : sit.sort.k === k ? (sit.sort.dir === "asc" ? "ascending" : "descending") : "none";
  const sortIc = (k) => { const s = ariaSort(k); return icon(s === "ascending" ? "sortUp" : s === "descending" ? "sortDown" : "sort", "si"); };
  $("tbl").innerHTML = `<caption class="vh">${esc($("tblTitle").textContent)}. Sorted by ${sit.sort ? esc(colDef(sit.sort.k, m).h) : "alert level"}.</caption>
    <thead><tr>${cols.map((c) => `<th scope="col" class="${c.txt || c.k === "level" ? "" : "n"} c-${c.k}" aria-sort="${ariaSort(c.k)}"><button type="button" data-sort="${c.k}"><span>${esc(c.h)}${c.sub ? `<small>${esc(c.sub)}</small>` : ""}</span>${sortIc(c.k)}</button></th>`).join("")}</tr></thead>
    <tbody>${rows.length ? "" : `<tr class="empty"><td colspan="${cols.length}">No ${unitWord(2)} match the filters. <button type="button" class="linkbtn" id="clrF">Clear the filters</button></td></tr>`}${rows.map((a) => `<tr data-k="${esc(a.key)}" tabindex="0" class="${a.key === sit.sel ? "sel" : ""}">${cols.map((c) => cell(c, a, i, m)).join("")}</tr>`).join("")}</tbody>`;
  $("tbl").querySelectorAll("[data-sort]").forEach((b) => b.addEventListener("click", () => {
    // each click: first direction → other direction → back to attention order
    const k = b.dataset.sort, order = k === "name" ? ["asc", "desc"] : ["desc", "asc"];
    const cur = sit.sort && sit.sort.k === k ? order.indexOf(sit.sort.dir) : -1;
    sit.sort = cur === 1 ? null : { k, dir: order[cur + 1] };
    saveSit(); renderTable(); const nb = $("tbl").querySelector(`[data-sort="${k}"]`); if (nb) nb.focus();
  }));
  $("tbl").querySelectorAll("tr[data-k]").forEach((t) => {
    t.addEventListener("click", () => pickArea(t.dataset.k, true));
    t.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickArea(t.dataset.k, true); } });
    t.addEventListener("mouseenter", () => hot(t.dataset.k)); t.addEventListener("mouseleave", () => hot(null));
  });
  if ($("clrF")) $("clrF").addEventListener("click", () => { sit.status = "all"; sit.q = ""; $("find").value = ""; renderSituation(); });
  const sel = $("tbl").querySelector("tr.sel"); if (sel && sit._scrollRow) { sel.scrollIntoView({ block: "nearest" }); sit._scrollRow = false; }
  $("tblNote").textContent = `Sources: SAPAT cost of a healthy diet from PSA retail prices, ${monthLong(m)}; reference family of five. Key-food change is on the same basis as the alert (past 3 months, or last year when that triggered it).`;
}
function cell(c, a, i, m) {
  if (c.k === "name") return `<th scope="row" class="nm"><b>${esc(a.name)}</b>${a.kind === "prov" && sit.area === "PH" ? `<small>${esc(regionName(a.region))}</small>` : ""}${a.kind === "prov" && !a.psa ? `<small>regional prices</small>` : ""}</th>`;
  if (c.k === "level") return `<td>${tag(lvOf(a, i))}</td>`;
  if (c.k === "why") { const d = drivers(a, i, trigger(a, i))[0]; return `<td class="why">${d ? `${cap(d.f.name)} <span class="${d.chg >= 0.05 ? "up" : ""}">${pctSigned(d.chg)}</span>` : "–"}</td>`; }
  const v = c.val(a); const strong = (c.k === "chg3" && v >= RULE.watch3) || (c.k === "yoy" && v >= RULE.alertYoy);
  return `<td class="n${strong ? " up" : ""}">${v == null ? "–" : c.M.fmt(v)}</td>`;
}

// ---------------------------------------------------------------- the chosen area
function pickArea(k, fromTable) {
  const a = areaBy(k); if (!a) return;
  sit.sel = k; sit._scrollRow = !fromTable; sit._scrollSide = true; saveSit();
  renderSide(); paintMap(); renderTable();
}
function renderDetail(list) {
  const m = sit.month, i = MI[m];
  const a = areaBy(sit.sel); if (!a) { $("detail").innerHTML = `<div class="dempty">${icon("shield")}<p>Pick an area from the list to see it in detail.</p></div>`; return; }
  const pos = list.findIndex((x) => x.key === a.key);
  const lv = lvOf(a, i), basis = trigger(a, i), c3 = a.vs3[i], y = a.yoy[i];
  const prev3 = i >= 3 ? (a.cond[i - 1] + a.cond[i - 2] + a.cond[i - 3]) / 3 : null;
  const span3 = i >= 3 ? `${monthName(D.months[i - 3])} to ${monthName(D.months[i - 1])}` : "";
  const fired = lv === 2 ? (basis === "yoy" ? `${pctAbs(y)} above ${monthName(D.months[i - 12])}; Alert starts at 15%` : `${pctAbs(c3)} above the past 3 months; Alert starts at 10%`)
    : lv === 1 ? `${pctAbs(c3)} above the past 3 months; Watch starts at 5%, Alert at 10%` : "below the 5% Watch line";
  const kf = drivers(a, i, "3m"), kfY = drivers(a, i, "yoy");
  const fy = (k) => (kfY.find((d) => d.f.k === k) || {}).chg;
  $("detail").innerHTML = `
    <div class="dnav">
      <button type="button" class="btn small" id="dPrev" ${pos > 0 ? "" : "disabled"}>${icon("left")}Previous</button>
      <span class="q">${pos >= 0 ? `${pos + 1} of ${list.length} in the list` : "Not in the list's filter"}</span>
      <button type="button" class="btn small" id="dNext" ${pos >= 0 && pos < list.length - 1 ? "" : "disabled"}>Next${chev()}</button>
    </div>
    <div class="dhead">
      <div><h2>${esc(a.name)}</h2><p>${a.kind === "prov" ? `Province in ${esc(regionName(a.region))}` : "Region"}${a.kind === "prov" && !a.psa ? ". No province price survey, so regional prices are used" : ""}</p></div>
      ${tag(lv, "big")}
    </div>
    <p class="dsent">${esc(sentenceBare(a, m))} ${esc(why(a, m))}</p>
    <div class="nums">
      <div class="num"><span class="nl">Cost of a healthy day</span><b>${peso(a.cond[i])}</b><span class="nu">per person per day, ${monthLong(m)}</span><span class="ns">SAPAT, from PSA retail prices</span></div>
      <div class="num"><span class="nl">Change vs past 3 months</span><b>${pctSigned(c3)}</b><span class="nu">vs the ${span3} average (${peso(prev3)})</span><span class="ns">SAPAT, from PSA retail prices</span></div>
      <div class="num"><span class="nl">Alert level</span><b class="lvw">${lv == null ? "–" : LEVELS[lv].word}</b><span class="nu">${esc(fired)}</span><span class="ns">SAPAT early-warning rule (Price alerts tab)</span></div>
    </div>
    <div class="dgrid">
      <figure class="dchart"><figcaption><b>Cost of a healthy day, last 3 years</b><span>₱ per person per day. The dashed line is the Alert line: 10% above the 3 months before.</span></figcaption>${areaChart(a, i)}</figure>
      <div class="kf"><h3>Key food prices, ${monthName(m)}</h3>
        <div class="kfwrap"><table><thead><tr><th scope="col">Food</th><th scope="col" class="n">Price</th><th scope="col" class="n">vs past 3 months</th><th scope="col" class="n">vs last year</th></tr></thead>
        <tbody>${KEY_FOODS.map((f) => { const d = kf.find((x) => x.f.k === f.k), now = a.food(f.k, i), yy = fy(f.k); return `<tr><th scope="row">${f.label}<small>${f.unit}</small></th><td class="n">${now == null ? "–" : peso(now, 2)}</td><td class="n${d && d.chg >= 0.05 ? " up" : ""}">${d ? pctSigned(d.chg) : "–"}</td><td class="n${yy >= 0.15 ? " up" : ""}">${yy == null ? "–" : pctSigned(yy)}</td></tr>`; }).join("")}</tbody></table></div>
        <p class="src">PSA retail prices${a.kind === "prov" ? (a.psa ? ", province survey" : ", regional") : ", regional average"}. A dash means PSA had no price that month.</p>
      </div>
    </div>
    ${lv == null ? "" : `<div class="todo ${LEVELS[lv].k}"><h3>${icon(LEVELS[lv].icon)}What you can do${lv ? ` (${LEVELS[lv].word})` : ""}</h3><ul>${ACTIONS[lv].list.map(([ic, t]) => `<li>${icon(ic)}<span>${esc(t)}</span></li>`).join("")}</ul></div>`}
    <div class="dact">
      <button type="button" class="btn primary" id="prSummary" data-icon="doc">One-page summary (PDF)</button>
      <button type="button" class="btn" id="toMenu" data-icon="pot">Plan feeding menus for ${esc(a.kind === "prov" ? regionName(a.region) : a.name)}</button>
      <span class="q">The summary opens your print window; choose <b>Save as PDF</b>.</span>
    </div>`;
  hydrateIcons($("detail"));
  $("prSummary").addEventListener("click", () => printSummary(a.key));
  $("dPrev").addEventListener("click", () => { sit.sel = list[pos - 1].key; saveSit(); renderFocus(); });
  $("dNext").addEventListener("click", () => { sit.sel = list[pos + 1].key; saveSit(); renderFocus(); });
  $("toMenu").addEventListener("click", () => { mn.region = a.region === "NIR" ? "NIR" : a.region; mn.month = sit.month; syncMenuInputs(); showView("menu"); window.scrollTo(0, 0); });
}
// 36 months of cost, with the Alert line and shapes (not just colour) for Watch and Alert months
function areaChart(a, i, opt) {
  opt = opt || {};
  const W = opt.w || (window.innerWidth < 640 ? 380 : 640), H = opt.h || (window.innerWidth < 640 ? 240 : 220), L = 44, R = 12, T = 12, B = 26;
  const i0 = Math.max(3, i - 35), idx = []; for (let k = i0; k <= i; k++) idx.push(k);
  const cost = idx.map((k) => a.cond[k]), line = idx.map((k) => (a.cond[k - 1] + a.cond[k - 2] + a.cond[k - 3]) / 3 * (1 + RULE.alert3));
  const vals = cost.concat(line).filter((v) => v != null);
  const lo = Math.floor(Math.min(...vals) * 0.95 / 10) * 10, hi = Math.ceil(Math.max(...vals) * 1.03 / 10) * 10;
  const x = (k) => L + (W - L - R) * k / Math.max(1, idx.length - 1), yv = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
  const path = (arr) => arr.map((v, k) => v == null ? "" : `${k && arr[k - 1] != null ? "L" : "M"}${x(k).toFixed(1)},${yv(v).toFixed(1)}`).join("");
  const step = (hi - lo) > 120 ? 40 : (hi - lo) > 60 ? 20 : 10;
  let g = "";
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${yv(v)}" y2="${yv(v)}" class="grid"/><text x="${L - 6}" y="${yv(v) + 4}" text-anchor="end">₱${v}</text>`;
  idx.forEach((k, j) => { if (D.months[k].endsWith("-01")) g += `<text x="${x(j)}" y="${H - 6}" text-anchor="middle">${D.months[k].slice(0, 4)}</text><line x1="${x(j)}" x2="${x(j)}" y1="${H - B}" y2="${H - B + 4}" class="grid"/>`; });
  let marks = "";
  idx.forEach((k, j) => {
    const lv = a.level[k]; if (!lv || a.cond[k] == null) return; const cx = x(j), cy = yv(a.cond[k]);
    marks += lv === 2 ? `<path class="mk alert" d="M${cx} ${cy - 6.5}L${cx + 5.6} ${cy + 3.4}L${cx - 5.6} ${cy + 3.4}Z" style="stroke-width:1.6"/>` : `<circle class="mk watch" cx="${cx}" cy="${cy}" r="3.6" style="stroke-width:2"/>`;
  });
  const last = idx.length - 1;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cost of a healthy day in ${esc(a.name)} over the last ${idx.length} months: ${peso(cost[0])} in ${monthName(D.months[i0])}, ${peso(cost[last])} in ${monthName(D.months[i])}.">${g}
    <path d="${path(line)}" class="aline"/><path d="${path(cost)}" class="cline"/>${marks}
    <text x="${Math.min(x(last) - 4, W - R)}" y="${yv(cost[last]) - 12}" text-anchor="end" class="lab">${peso(cost[last])}</text></svg>`;
}

// ---------------------------------------------------------------- how the levels are set (rule, back-test, what to do)
function renderRules() {
  const bt = BACKTEST;
  const rule = [
    "Less than 5% above the average of the 3 months before, and less than 15% above the same month last year.",
    "At least 5% above the average of the 3 months before.",
    "At least 10% above the average of the 3 months before, or at least 15% above the same month last year.",
  ];
  $("rules").innerHTML = `
    <div class="rhead"><h2 id="rulesH">How the levels are set, and what to do</h2>
      <p>Each month SAPAT compares the cost of a healthy day in each area with its own recent past. The same rule runs for every province and region.</p></div>
    <div class="levels">${[2, 1, 0].map((lv) => `<div class="lvcol ${LEVELS[lv].k}">${tag(lv, "big")}<p class="rule">${rule[lv]}</p><ul>${ACTIONS[lv].list.map(([ic, t]) => `<li>${icon(ic)}<span>${esc(t)}</span></li>`).join("")}</ul></div>`).join("")}</div>
    <div class="bt">
      <h3>${icon("chart")}Tested on past prices</h3>
      <p>From ${monthLong(bt.from)} to ${monthLong(bt.to)}, the rule raised <b>${fmt(bt.alerts)} Alerts</b> across ${bt.provinces} provinces. In ${fmt(bt.confirmed)} of them the cost stayed at least 5% higher for the next two months. The other ${fmt(bt.falseA)} were false alarms: <b>about 1 false alert per province every ${Math.round(bt.yearsPerFalse)} years</b>.</p>
      <div class="shocks"><span class="q">See how it caught past price shocks:</span>${PAST_SHOCKS.map(([mo, l]) => `<button type="button" class="btn small" data-shock="${mo}">${icon("siren")}${l}</button>`).join("")}<button type="button" class="btn small" data-shock="${lastMonth}">${icon("cal")}Back to latest</button></div>
    </div>`;
  $("rules").querySelectorAll("[data-shock]").forEach((b) => b.addEventListener("click", () => { sit.month = b.dataset.shock; sit.sel = null; renderSituation(); $("ansH").focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }));
}

// ---------------------------------------------------------------- Province close-up: the list, then one area in detail
const focusRows = () => { const i = MI[sit.month]; return attentionSort(areaList(sit.level).filter((a) => (sit.level === "region" || fc.area === "PH" || a.region === fc.area) && stHit(a, i, fc.status) && nameHit(a, fc.q)), i); };
function renderFocus() {
  const m = sit.month, i = MI[m], base = areaList(sit.level).filter((a) => sit.level === "region" || fc.area === "PH" || a.region === fc.area);
  $("fMonth").value = m; $("fArea").value = fc.area; $("fArea").disabled = sit.level === "region";
  statusSeg($("fStatus"), fc.status, countsOf(base.filter((a) => nameHit(a, fc.q)), i), [["alert", "Alert"], ["attn", "Alert + Watch"], ["all", "All"]]);
  const list = focusRows();
  if (!sit.sel || !list.some((a) => a.key === sit.sel)) { if (!sit._keepSel) sit.sel = (list[0] || {}).key || null; }
  sit._keepSel = false;
  $("frH").textContent = fc.status === "alert" ? `On Alert (${list.length})` : fc.status === "attn" ? `On Alert or Watch (${list.length})` : `All ${unitWord(2)} (${list.length})`;
  $("frSub").textContent = `${monthLong(m)}. Most urgent first.`;
  $("flist").innerHTML = list.length ? list.map((a) => { const lv = lvOf(a, i); return `<li class="frow${a.key === sit.sel ? " sel" : ""}" data-k="${esc(a.key)}" tabindex="0" role="button" aria-pressed="${a.key === sit.sel}">
      ${tag(lv)}<span class="sname"><b>${esc(a.name)}</b><small>${a.kind === "prov" ? esc(regionName(a.region)) : "Region"}</small></span>
      <span class="schg ${lv == null ? "" : LEVELS[lv].k}">${pctSigned(a.vs3[i])}<small>${peso(a.cond[i])}/day</small></span></li>`; }).join("")
    : `<li class="calm">${icon("shield")}<span>${fc.q ? `Nothing matches "${esc(fc.q)}".` : `No ${unitWord(2)} on ${fc.status === "alert" ? "Alert" : "Alert or Watch"} in ${monthLong(m)}.`} <button type="button" class="linkbtn" id="fAll">Show all</button></span></li>`;
  $("flist").querySelectorAll("li[data-k]").forEach((li) => {
    const go = () => { sit.sel = li.dataset.k; saveSit(); renderFocus(); if (window.innerWidth < 900) $("detail").scrollIntoView({ block: "start" }); };
    li.addEventListener("click", go);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  if ($("fAll")) $("fAll").addEventListener("click", () => { fc.status = "all"; fc.q = ""; $("fFind").value = ""; saveSit(); renderFocus(); });
  const sel = $("flist").querySelector("li.sel"); if (sel) sel.scrollIntoView({ block: "nearest" });
  renderDetail(list);
}

// ---------------------------------------------------------------- render all
// filters that only change which rows show (the search box): list, map fading and table
function renderFiltered() { renderSide(); paintMap(); renderTable(); }
function renderSituation() {
  saveSit();
  $("area").value = sit.area; $("month").value = sit.month;
  $("mPrev").disabled = MONTHS.indexOf(sit.month) <= 0; $("mNext").disabled = sit.month === lastMonth;
  $("levelSeg").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === sit.level)));
  statusSeg($("statusSeg"), sit.status, countsOf(rowsNow(), MI[sit.month]), STATUS);
  renderAnswer(); renderSide(); renderMeasures(); paintMap(); renderTable();
}
