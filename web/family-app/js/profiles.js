/* SAPAT family app · Profiles: the "who is using SAPAT?" chooser after the welcome, the new-family setup, and the profile switcher in Pamilya.
 * Tita Baby's sample opens in its original state every time; each new family is saved on this phone only (see state.js).
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- switching
function switchProfile(id, msg) {
  openProfile(id); closeSheet();
  if (!PL[st.loc.region]) st.loc = { region: "R08", prov: "Leyte", city: null, market: null };
  refreshPrices(); solve(); save(); drawChrome(); drawNav(); go("today");
  if (msg !== false) toast(msg || T().switched(profileName(pid)));
}
const savedState = (id) => store.get(pkey(id, "state"), null) || {};
const famFigs = (members) => `<span class="pfigs">${members.slice(0, 6).map((m) => figure(m, "var(--line)")).join("")}</span>`;
const famLine = (s) => { const tt = T(); return [s.loc ? (s.loc.prov || regionName(s.loc.region)) : null, s.members ? tt.nPeople(s.members.length) : null].filter(Boolean).join(" · "); };
const sampleBudget = () => peso(budgetFor(1, "R08", UI.EXAMPLE_FAMILY.length));

// ---------------------------------------------------------------- chooser: shown in the welcome overlay after its last screen
function showChooser(el, close) {
  const tt = T();
  const saved = profiles.list.slice().sort((a, b) => (b.id === profiles.last) - (a.id === profiles.last));
  el.innerHTML = `<div class="wslide chooser">
      <div class="wbrand">sapat<span>.</span></div><h2 id="whoH">${tt.whoH}</h2><p>${tt.whoS}</p>
      <div class="plist">
        ${saved.map((p) => { const s = savedState(p.id); return `<button class="pcard" type="button" data-p="${esc(p.id)}">${famFigs(s.members || [])}<span class="tx"><b>${esc(p.name)}</b><small>${esc(famLine(s))}</small></span>${p.id === profiles.last ? `<span class="ptag">${tt.lastUsed}</span>` : ""}</button>`; }).join("")}
        <button class="pcard big" type="button" data-p="${SAMPLE}">${famFigs(UI.EXAMPLE_FAMILY)}<span class="tx"><b>${tt.sampleName} <span class="sbadge">${tt.sample}</span></b><small>${tt.sampleLine("Leyte", sampleBudget())}</small><small>${tt.sampleFam}</small></span></button>
        <button class="pcard big new" type="button" id="pNew"><span class="plus">${icon("plus")}</span><span class="tx"><b>${tt.newP}</b><small>${tt.newPS}</small></span></button>
      </div></div>`;
  el.setAttribute("aria-labelledby", "whoH");
  el.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => { switchProfile(b.dataset.p, false); close(); }));
  $("pNew").addEventListener("click", () => { close(); showSetup(); });
  const first = el.querySelector(".pcard"); if (first) first.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- new profile: who eats, where they shop, the weekly budget
function showSetup() {
  const host = $("screen") || document.body, tt0 = T();
  const draft = { name: "", members: [{ name: tt0.me, age: 30, sex: "F", status: "none" }], region: null, prov: null, preset: 1, budget: null };
  let step = 0;
  const el = document.createElement("div"); el.className = "setup"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "suH"); host.appendChild(el);
  const close = () => el.remove();
  const presetB = (d) => budgetFor(d, draft.region, draft.members.length);
  const budgetOk = () => draft.budget >= 100 && draft.budget <= 999999;
  const body = () => {
    const tt = T();
    if (step === 0) return `
      <label class="f">${tt.pName}<input type="text" id="suName" value="${esc(draft.name)}" placeholder="${tt.pNamePh}" autocomplete="off"></label>
      <div class="sulist">${draft.members.map((m, i) => `<button class="opt" type="button" data-m="${i}">${figure(m, "var(--leaf)")}<span class="tx"><b>${esc(m.name)}</b><small>${m.age} ${tt.yrs}${m.status === "pregnant" ? " · " + tt.preg : m.status === "lactating" ? " · " + tt.lact : ""}${(m.diet || "regular") !== "regular" ? " · " + UI.dietOf(m)[st.lang] : ""}</small></span>${chev()}</button>`).join("")}</div>
      <button class="btn block" type="button" id="suAdd">${icon("plus")}${tt.addPerson}</button>`;
    if (step === 1) {
      const provs = draft.region ? (PL[draft.region] || { provinces: [] }).provinces : [];
      return `
      <label class="f">${tt.region}<select id="suReg"><option value="">${tt.pickRegion}</option>${D.regions.filter((r) => r.key !== "PH").map((r) => `<option value="${r.key}"${r.key === draft.region ? " selected" : ""}>${esc(regionName(r.key))}</option>`).join("")}</select></label>
      ${provs.length ? `<label class="f">${tt.province}<select id="suProv"><option value="">${tt.wholeRegion}</option>${provs.map((p) => `<option value="${esc(p.name)}"${p.name === draft.prov ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>` : ""}`;
    }
    if (draft.budget == null && draft.preset) draft.budget = presetB(draft.preset);
    return `
      <label class="bigmoney"><span class="lbl">${tt.budgetType}</span>
        <span class="mfield"><span class="cur">₱</span><input type="text" id="suBudget" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="0" value="${draft.budget ? fmt(draft.budget) : ""}" aria-describedby="suPer"></span>
        <small id="suPer"></small></label>
      <span class="lbl">${tt.orPick}</span>
      <div class="seg" id="suSeg">${[1, 3, 5].map((d, k) => `<button type="button" data-d="${d}" aria-pressed="${draft.preset === d}">${tt.presets[k]}<small>${peso(presetB(d))}</small></button>`).join("")}</div>
      <p class="quiet left">${tt.budgetHint(draft.members.length)}</p>`;
  };
  const keepName = () => { const n = $("suName"); if (n) draft.name = n.value.trim(); };
  const draw = () => {
    const tt = T(), last = step === 2, ok = step === 1 ? !!draft.region : step === 2 ? budgetOk() : true;
    el.innerHTML = `<div class="sutop"><button class="iconbtn" type="button" id="suBack" aria-label="${step ? tt.back2 : tt.close}">${icon(step ? "back" : "x")}</button><span class="sustep">${tt.step(step + 1, 3)}</span><div class="dots">${[0, 1, 2].map((k) => `<i class="${k === step ? "on" : ""}"></i>`).join("")}</div></div>
      <div class="subody"><h2 id="suH">${tt.setupSteps[step]}</h2><p class="sup">${tt.setupStepS[step]}</p>${body()}</div>
      <div class="sufoot"><button class="btn primary block big" type="button" id="suNext"${ok ? "" : " disabled"}>${last ? icon("check") + tt.finish : tt.next}</button></div>`;
    $("suBack").addEventListener("click", () => { keepName(); if (step) { step--; draw(); } else close(); });
    $("suNext").addEventListener("click", () => { keepName(); if (!last) { step++; draw(); } else finish(); });
    if (step === 0) {
      el.querySelectorAll("[data-m]").forEach((b) => b.addEventListener("click", () => { keepName(); editMember(+b.dataset.m, { list: draft.members, onDone: draw }); }));
      $("suAdd").addEventListener("click", () => { keepName(); draft.members.push({ name: T().newM, age: 10, sex: "F", status: "none" }); draft.budget = null; editMember(draft.members.length - 1, { list: draft.members, onDone: draw }); });
    }
    if (step === 1) {
      $("suReg").addEventListener("change", (e) => { draft.region = e.target.value || null; draft.prov = null; draft.budget = null; draw(); });
      if ($("suProv")) $("suProv").addEventListener("change", (e) => { draft.prov = e.target.value || null; });
    }
    if (step === 2) {
      // typed budget: digits only, live per-day line; the three estimates fill the box and stay highlighted while they match
      const inp = $("suBudget");
      const fit = () => (inp.style.width = Math.max(2, inp.value.length || 1) + 0.6 + "ch"); // the box hugs the digits so ₱ sits next to them
      const sync = () => { fit();
        const tt = T();
        $("suPer").textContent = budgetOk() ? `${tt.perWeek} · ${peso(draft.budget / 7)} ${tt.perDay}` : tt.budgetMin;
        $("suPer").classList.toggle("warn", !budgetOk() && inp.value !== "");
        $("suSeg").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.d === draft.preset)));
        $("suNext").disabled = !budgetOk();
      };
      inp.addEventListener("focus", () => inp.select());
      inp.addEventListener("input", () => {
        const digits = inp.value.replace(/\D/g, "").slice(0, 6);
        draft.budget = digits ? +digits : null;
        draft.preset = [1, 3, 5].find((d) => presetB(d) === draft.budget) || 0;
        sync();
      });
      inp.addEventListener("blur", () => { inp.value = draft.budget ? fmt(draft.budget) : ""; fit(); });
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter" && budgetOk()) finish(); });
      $("suSeg").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { draft.preset = +b.dataset.d; draft.budget = presetB(draft.preset); inp.value = fmt(draft.budget); sync(); }));
      sync();
    }
  };
  const finish = () => {
    const tt = T(), id = "f" + Date.now().toString(36);
    const name = draft.name || tt.pNameDef(draft.members[0].name);
    const s = { name, members: draft.members, who: 0, tab: "today", loc: { region: draft.region, prov: draft.prov, city: null, market: null }, prices: {}, budget: draft.budget, preset: draft.preset, halal: false, example: false, day: null, saved: 0 };
    store.set(pkey(id, "state"), s); profiles.list.push({ id, name }); store.set("profiles", profiles);
    close(); switchProfile(id, tt.created(name));
  };
  draw();
}

// ---------------------------------------------------------------- switcher in Pamilya: switch, rename, delete, reset the sample
function openProfiles() {
  const tt = T();
  $("toast").hidden = true; // keep the sheet's buttons clear
  const row = (id, name, line, badge) => `<div class="profrow"><button class="opt" type="button" data-open="${esc(id)}" aria-current="${id === pid}">${famFigs(id === SAMPLE ? UI.EXAMPLE_FAMILY : savedState(id).members || [])}<span class="tx"><b>${esc(name)}${badge ? ` <span class="sbadge">${tt.sample}</span>` : ""}</b><small>${id === pid ? tt.openNow : esc(line)}</small></span>${id === pid ? icon("check").replace('class="i"', 'class="i ck"') : ""}</button>${id !== SAMPLE ? `<button class="iconbtn" type="button" data-ren="${esc(id)}" aria-label="${tt.rename}: ${esc(name)}">${icon("edit")}</button>` : ""}</div>`;
  openSheet(tt.profilesH, `<div class="optlist">${row(SAMPLE, tt.sampleName, tt.sampleLine("Leyte", sampleBudget()), true)}${profiles.list.map((p) => row(p.id, p.name, famLine(savedState(p.id)), false)).join("")}</div>
    <button class="btn block" type="button" id="pNew2">${icon("plus")}${tt.newP}</button>
    ${isSample() ? `<button class="btn link block" type="button" id="pReset">${tt.resetSample}</button>` : ""}`);
  $("sheet").querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.open !== pid) switchProfile(b.dataset.open); else closeSheet(); }));
  $("sheet").querySelectorAll("[data-ren]").forEach((b) => b.addEventListener("click", () => openRename(b.dataset.ren)));
  $("pNew2").addEventListener("click", () => { closeSheet(); showSetup(); });
  if ($("pReset")) $("pReset").addEventListener("click", () => switchProfile(SAMPLE, T().resetDone));
}
function openRename(id) {
  const tt = T(), p = profiles.list.find((x) => x.id === id); if (!p) return;
  $("toast").hidden = true; // keep the sheet's buttons clear
  openSheet(tt.rename, `<label class="f">${tt.pName}<input type="text" id="rnName" value="${esc(p.name)}" autocomplete="off"></label>
    <button class="btn primary block" type="button" id="rnSave">${icon("check")}${tt.save}</button>
    <button class="btn link block" type="button" id="rnDel" style="color:var(--bad)">${tt.del}</button>`, openProfiles);
  $("rnSave").addEventListener("click", () => {
    const v = $("rnName").value.trim(); if (!v) return;
    p.name = v; store.set("profiles", profiles);
    if (id === pid) { st.name = v; save(); } else { const s = savedState(id); s.name = v; store.set(pkey(id, "state"), s); }
    render(); openProfiles();
  });
  $("rnDel").addEventListener("click", () => openDelete(id));
}
function openDelete(id) {
  const tt = T(), p = profiles.list.find((x) => x.id === id); if (!p) return;
  $("toast").hidden = true; // keep the sheet's buttons clear
  openSheet(tt.delQ(esc(p.name)), `<p class="sup">${tt.delS}</p>
    <button class="btn block danger" type="button" id="dlYes">${tt.delYes}</button>
    <button class="btn block" type="button" id="dlNo">${tt.delNo}</button>`, () => openRename(id));
  $("dlNo").addEventListener("click", () => openRename(id));
  $("dlYes").addEventListener("click", () => {
    const pre = NS + pkey(id, "");
    try { Object.keys(localStorage).filter((k) => k.startsWith(pre)).forEach((k) => localStorage.removeItem(k)); } catch (e) {}
    profiles.list = profiles.list.filter((x) => x.id !== id); store.set("profiles", profiles);
    if (id === pid) switchProfile(SAMPLE, tt.deleted(p.name)); else { closeSheet(); render(); toast(tt.deleted(p.name)); }
  });
}
