/* SAPAT family app · Sheets for adding a food with a portion, and for adding or editing a household member.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- sheets: add food, edit member
let addState = { meal: 0, q: "", g: "all", who: [] };
function openAdd(meal, who) {
  const tt = T(); addState = { meal, q: "", g: "all", who: who != null ? [who] : st.members.map((_, i) => i) };
  openSheet(tt.other, `
    <div style="display:grid;gap:8px"><span class="lbl">${tt.otherFor}</span><div class="chips" id="whoChips">${st.members.map((m, i) => `<button type="button" class="chip" data-w="${i}" aria-pressed="${addState.who.includes(i)}">${esc(m.name)}</button>`).join("")}</div></div>
    <div class="seg" id="mealSeg">${tt.meals.map((n, k) => `<button type="button" data-m="${k}" aria-pressed="${k === meal}">${n}</button>`).join("")}</div>
    <div class="search">${icon("search")}<input type="search" id="q" placeholder="${tt.search}" aria-label="${tt.search}" autocomplete="off"></div>
    <div class="chips" id="gchips">${Object.entries(tt.groups).filter(([k]) => k !== "plan").map(([k, l]) => `<button type="button" class="chip" data-g="${k}" aria-pressed="${k === "all"}">${l}</button>`).join("")}</div>
    <div class="foodlist" id="flist"></div>`);
  $("whoChips").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { const w = +b.dataset.w; const has = addState.who.includes(w); if (has && addState.who.length > 1) addState.who = addState.who.filter((x) => x !== w); else if (!has) addState.who.push(w); b.setAttribute("aria-pressed", String(addState.who.includes(w))); }));
  $("mealSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { addState.meal = +b.dataset.m; $("mealSeg").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }));
  $("q").addEventListener("input", (e) => { addState.q = e.target.value.toLowerCase(); listFoods(); });
  $("gchips").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { addState.g = b.dataset.g; $("gchips").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); listFoods(); }));
  listFoods();
}
function listFoods() {
  const tt = T();
  let fs = FOODS.filter((f) => !(st.halal && f.key.startsWith("pork")));
  if (addState.g !== "all") fs = fs.filter((f) => f.group === addState.g);
  if (addState.q) fs = fs.filter((f) => (f.name + " " + (UI.TL[f.key] || "")).toLowerCase().includes(addState.q));
  fs.sort((a, b) => fname(a.key).localeCompare(fname(b.key)));
  $("flist").innerHTML = fs.length ? fs.map((f) => { const p = UI.portions(f)[0]; return `<button class="food" type="button" data-k="${f.key}">${pic(f.group)}<span class="tx"><b>${esc(fname(f.key))}</b><small>${UI.gloss(f.key, st.lang) ? esc(UI.gloss(f.key, st.lang)) + " · " : ""}${UI.plabel(p, st.lang)} · ${fmt(f.energy_kcal * p[3])} kcal${priceBy[f.key] ? " · " + about(p[3] * priceBy[f.key].price_g) + calc(() => explainFood(f.key, p[3], UI.plabel(p, st.lang))) : ""}</small></span></button>`; }).join("") : `<p class="quiet">${tt.notFound}</p>`;
  $("flist").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => openPortion(b.dataset.k)));
}
function openPortion(key) {
  const tt = T(), f = FBY[key], ps = UI.portions(f), keep = Object.assign({}, addState); let sel = 0, mult = 1;
  openSheet(esc(fname(key)), `
    <div style="display:flex;gap:16px;align-items:center">${pic(f.group, "lg")}<div style="display:grid;gap:6px;justify-items:start"><span style="color:var(--ink-2);font-weight:700">${tt.meals[keep.meal]} · ${keep.who.map((w) => esc(st.members[w].name)).join(", ")}</span>${priceBy[key] ? `<span class="pl">${priceLine(key)}</span>` : ""}</div></div>
    <div class="portions" id="pp">${ps.map((p, k) => `<button type="button" data-k="${k}" aria-pressed="${k === sel}"><b>${UI.pshort(p, st.lang)}</b><small>${p[2] ? UI.U[st.lang][p[2]] + " · " : ""}${fmt(p[3])} g</small></button>`).join("")}</div>
    <div class="qty"><button class="step" type="button" id="qm" aria-label="−">${icon("minus")}</button><output id="qo" aria-live="polite"></output><button class="step" type="button" id="qp" aria-label="+">${icon("plus")}</button></div>
    <div class="preview" id="pv"></div>
    <button class="btn primary block" type="button" id="doAdd">${icon("plus")}${tt.addFood}</button>`, () => { openAdd(keep.meal, null); addState.who = keep.who; });
  const upd = () => {
    const g = ps[sel][3] * mult, n = nutr(key, g);
    $("qo").textContent = `× ${mult % 1 ? fmt(mult, 1) : mult}`;
    $("pv").innerHTML = [fmt(n.energy_kcal), fmt(n.protein_g, 1) + "g", fmt(n.fiber_g, 1) + "g", priceBy[key] ? about(g * priceBy[key].price_g).replace(/^(mga|about) /, "~") : "–"].map((v, k) => `<div><b>${v}</b><small>${tt.pv[k]}</small></div>`).join("");
    $("pp").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.k === sel)));
  };
  $("pp").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { sel = +b.dataset.k; upd(); }));
  $("qm").addEventListener("click", () => { mult = Math.max(0.5, mult - 0.5); upd(); });
  $("qp").addEventListener("click", () => { mult = Math.min(10, mult + 0.5); upd(); });
  $("doAdd").addEventListener("click", () => { const p = ps[sel].slice(0, 3); if (mult !== 1) p[0] = (mult % 1 ? fmt(mult, 1) : mult) + " × " + p[0]; closeSheet(); addExtra(keep.who, key, ps[sel][3] * mult, keep.meal, p); });
  upd();
}
function addMember() { st.members.push({ name: T().newM, age: 10, sex: "F", status: "none" }); save(); solve(); editMember(st.members.length - 1); }
function editMember(i) {
  const m = st.members[i];
  const fix = () => { if (m.sex === "M" || m.age < 13 || m.age > 55) m.status = "none"; };
  const draw = () => {
    const tt = T(), canStatus = m.sex === "F" && m.age >= 13 && m.age <= 55;
    openSheet(esc(m.name), `
      <div style="display:grid;justify-items:center">${figure(m, "var(--leaf)", true)}</div>
      <label class="f">${tt.name}<input type="text" id="mName" value="${esc(m.name)}" autocomplete="off"></label>
      <div style="display:grid;gap:8px"><span class="lbl">${tt.age}</span><div class="qty"><button class="step" type="button" id="am" aria-label="−">${icon("minus")}</button><output>${m.age} ${tt.yrs}</output><button class="step" type="button" id="ap" aria-label="+">${icon("plus")}</button></div></div>
      <div class="seg" id="sexSeg"><button type="button" data-s="F" aria-pressed="${m.sex === "F"}">${tt.female}</button><button type="button" data-s="M" aria-pressed="${m.sex === "M"}">${tt.male}</button></div>
      ${canStatus ? `<div class="seg" id="stSeg">${["none", "pregnant", "lactating"].map((k, n) => `<button type="button" data-s="${k}" aria-pressed="${m.status === k}">${tt.status[n]}</button>`).join("")}</div>` : ""}
      <div style="display:grid;gap:8px"><span class="lbl">${tt.diet}</span><div class="diets" id="dietSeg">${UI.DIETS.map((d) => `<button type="button" data-d="${d.k}" aria-pressed="${(m.diet || "regular") === d.k}"><span class="bubble">${icon(d.icon)}</span><span><b>${d[st.lang]}</b><small>${d[st.lang + "S"]}</small></span></button>`).join("")}</div></div>
      <button class="btn primary block" type="button" id="mDone">${icon("check")}${tt.done}</button>
      ${st.members.length > 1 ? `<button class="btn link block" type="button" id="mDel" style="color:var(--bad)">${tt.remove}</button>` : ""}`);
    const keep = () => { m.name = $("mName").value.trim() || m.name; };
    $("am").addEventListener("click", () => { keep(); m.age = Math.max(1, m.age - 1); fix(); draw(); });
    $("ap").addEventListener("click", () => { keep(); m.age = Math.min(100, m.age + 1); fix(); draw(); });
    $("sexSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { keep(); m.sex = b.dataset.s; fix(); draw(); }));
    if ($("stSeg")) $("stSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { keep(); m.status = b.dataset.s; draw(); }));
    $("dietSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { keep(); m.diet = b.dataset.d; $("dietSeg").querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); }));
    $("mDone").addEventListener("click", () => { keep(); closeSheet(); save(); solve(); render(); });
    if ($("mDel")) $("mDel").addEventListener("click", () => { st.members.splice(i, 1); st.who = 0; closeSheet(); save(); solve(); go("family"); });
  };
  draw();
}
