/* SAPAT family app · "Ano ang kinain?": the planned dish, something else at home, karinderya, eating out, street food, baon,
 * handaan or ayuda, or a skipped meal. Food from outside is estimated from the food groups on the plate.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- "Ano ang kinain?": the plan, something else, eating out, or a skipped meal
// Bought or shared food has no exact recipe, so we ask what was on the plate (food groups) and estimate. It is marked "tantiya".
const OUTG = [["rice", "cereals", [["rice_rm", 84]]], ["noodle", "cereals", [["rice_wm", 56]]], ["veg", "vegetables", [["_veg", 90]]], ["fish", "fish", [["galunggong", 140]]],
  ["meat", "meat", [["chicken", 100]]], ["egg", "eggs", [["egg", 55]]], ["fruit", "fruits", [["latundan", 96]]], ["sweet", "sugar", [["sugar_w", 25]]]];
const OUTK = [["plan", "check"], ["home", "pot"], ["karinderya", "store"], ["out", "city"], ["street", "cup"], ["baon", "bowl"], ["handa", "heart"], ["skip", "x"]];
const sizeOf = (m) => Math.min(1.2, Math.max(0.4, targets(m).energy_kcal / 2000));
function openOther(mi, who) {
  const tt = T(), k = todayIdx + "-" + mi, items = week.days[todayIdx][mi];
  const sel = { who: who != null ? [who] : st.members.map((_, i) => i) };
  openSheet(tt.whatAte(tt.meals[mi].toLowerCase()), `
    <div style="display:grid;gap:8px"><span class="lbl">${tt.otherFor}</span><div class="chips" id="oWho">${st.members.map((m, i) => `<button type="button" class="chip" data-w="${i}" aria-pressed="${sel.who.includes(i)}">${esc(m.name)}</button>`).join("")}</div></div>
    <div class="optlist kinds">${OUTK.filter(([x]) => x !== "plan" || items.length).map(([x, ic]) => `<button class="opt" type="button" data-kind="${x}"><span class="bubble ${x === "skip" ? "sun" : ""}">${icon(ic)}</span><span class="tx"><b>${x === "plan" ? esc(mealName(items, mi, todayIdx)) : tt.kind[x][0]}</b><small>${x === "plan" ? tt.kind.plan[0] : tt.kind[x][1]}</small></span>${chev()}</button>`).join("")}</div>`);
  $("oWho").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { const w = +b.dataset.w, has = sel.who.includes(w); if (has && sel.who.length > 1) sel.who = sel.who.filter((x) => x !== w); else if (!has) sel.who.push(w); b.setAttribute("aria-pressed", String(sel.who.includes(w))); }));
  $("sheet").querySelectorAll("[data-kind]").forEach((b) => b.addEventListener("click", () => {
    const kind = b.dataset.kind;
    if (kind === "plan") { closeSheet(); const before = snap(k); if (wk.out) delete wk.out[k]; wk.eaten[k] = true; save(); render(); burst(b.getBoundingClientRect()); toast(tt.thanksAte(tt.meals[mi]), () => restore(k, before)); return; }
    if (kind === "home") { closeSheet(); openAdd(mi, sel.who.length === 1 ? sel.who[0] : null); addState.who = sel.who.slice(); return; }
    if (kind === "skip") { saveOut(k, mi, { who: sel.who.slice(), kind, groups: [], spent: 0 }); return; }
    openPlate(k, mi, kind, sel.who.slice());
  }));
}
function openPlate(k, mi, kind, who) {
  const tt = T(), groups = new Set(kind === "street" ? [] : ["rice"]);
  openSheet(tt.kind[kind][0], `
    <div style="display:grid;gap:8px"><span class="lbl">${tt.plateQ}</span><div class="plate" id="plate">${OUTG.map(([g, grp]) => `<button type="button" data-g="${g}" aria-pressed="${groups.has(g)}">${pic(grp, "sm")}<span>${tt.og[g]}</span></button>`).join("")}</div></div>
    <label class="f">${tt.spentQ}<input type="number" id="oSpent" inputmode="decimal" min="0" step="1" placeholder="0"></label>
    <p class="quiet left">${icon("info")}${tt.plateNote}</p>
    <button class="btn primary block" type="button" id="oSave">${icon("check")}${tt.save}</button>`, () => openOther(mi, who.length === 1 ? who[0] : null));
  $("plate").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { const g = b.dataset.g; groups.has(g) ? groups.delete(g) : groups.add(g); b.setAttribute("aria-pressed", String(groups.has(g))); }));
  $("oSave").addEventListener("click", () => saveOut(k, mi, { who, kind, groups: [...groups], spent: Math.max(0, +$("oSpent").value || 0) }));
}
const snap = (k) => JSON.parse(JSON.stringify({ out: (wk.out || {})[k] || null, eaten: !!wk.eaten[k], extras: wk.extras[todayIdx] || {} }));
function restore(k, b) { wk.out = wk.out || {}; if (b.out) wk.out[k] = b.out; else delete wk.out[k]; if (b.eaten) wk.eaten[k] = true; else delete wk.eaten[k]; wk.extras[todayIdx] = b.extras; save(); render(); }
function saveOut(k, mi, o) {
  const tt = T(), before = snap(k), d = todayIdx;
  // replace any earlier estimate for this meal and these people
  wk.extras[d] = wk.extras[d] || {};
  o.who.forEach((i) => { wk.extras[d][i] = (wk.extras[d][i] || []).filter((x) => !(x.est && x.meal === mi)); });
  o.groups.forEach((g) => { const row = OUTG.find((x) => x[0] === g); row[2].forEach(([key, grams]) => o.who.forEach((i) => (wk.extras[d][i] = wk.extras[d][i] || []).push({ key, g: grams * sizeOf(st.members[i]), meal: mi, est: true, lab: tt.og[g] }))); });
  (wk.out = wk.out || {})[k] = o;
  if (o.who.length < st.members.length) wk.eaten[k] = true; // the others ate the planned dish at home
  save(); closeSheet(); render();
  const kids = o.who.some((i) => st.members[i].age < 13 || ["pregnant", "lactating"].includes(st.members[i].status));
  const msg = o.kind === "skip" ? (kids ? tt.skipKids : tt.skipMsg) : !o.groups.includes("veg") ? tt.noVeg : tt.outSaved;
  toast(msg, () => restore(k, before));
}
