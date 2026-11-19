/* SAPAT family app · Budget input: a number field (per week or per day), quick amounts, and a "Hindi sigurado?" helper with typical amounts
 * for the family's region. Used by the new-profile setup (profiles.js) and the Week tab (week.js). It never picks a budget by itself:
 * the value only changes when the person types or taps, and the Week tab re-plans only when they press I-apply.
 * One of several ordered scripts; see js/README.md. */
"use strict";

const BQUICK = { week: [800, 1200, 1600, 2000], day: [100, 150, 200, 300] };
const BTYPICAL = [2, 5, 8]; // FIES deciles shown in "Hindi sigurado?": lower, typical (the middle family), higher
const BMIN = 100; // ₱ per week

// host: element to render into. opts: { value, mode: "week"|"day", region, n, onChange(v), onMode(mode), onApply(v) (Week tab only) }
// Uses classes, not ids, so it can sit under the setup overlay and in the Week tab at the same time.
function budgetEditor(host, opts) {
  let v = opts.value || null, mode = opts.mode === "day" ? "day" : "week";
  const tt = T(), q = (s) => host.querySelector(s);
  const ok = () => v != null && v >= BMIN && v <= 999999;
  const toShown = (w) => (w == null ? "" : fmt(mode === "day" ? Math.round(w / 7) : w));
  host.innerHTML = `<div class="bud">
      <div class="seg bmode" role="group" aria-label="${tt.bModeL}">${["week", "day"].map((m) => `<button type="button" data-mode="${m}" aria-pressed="${m === mode}">${m === "week" ? tt.bWeek : tt.bDay}</button>`).join("")}</div>
      <label class="bigmoney"><span class="lbl blbl"></span>
        <span class="mfield"><span class="cur">₱</span><input type="text" class="binp" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder=""></span>
        <small class="bper" aria-live="polite"></small></label>
      <div class="bquick" role="group" aria-label="${tt.quickH}"></div>
      <button type="button" class="btn link bunsure" aria-expanded="false">${icon("info")}${tt.unsure}</button>
      <div class="btyp" hidden></div>
      ${opts.onApply ? `<button type="button" class="btn primary block bapply">${icon("check")}${tt.apply}</button><p class="bpend quiet" hidden>${tt.pending}</p>` : ""}
    </div>`;
  const inp = q(".binp");
  const fit = () => (inp.style.width = Math.max(2, inp.value.length || 1) + 0.6 + "ch"); // the box hugs the digits so ₱ sits next to them
  const sync = (fromTyping) => {
    const t = T();
    if (!fromTyping) inp.value = toShown(v);
    fit();
    q(".blbl").textContent = mode === "day" ? t.bTypeD : t.bTypeW;
    const per = q(".bper");
    per.textContent = ok() ? (mode === "day" ? t.eqWeek(peso(v)) : t.eqDay(peso(v / 7))) : v == null ? "" : t.budgetMin(peso(mode === "day" ? Math.ceil(BMIN / 7) : BMIN));
    per.classList.toggle("warn", v != null && !ok());
    host.querySelectorAll(".bmode button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    q(".bquick").innerHTML = BQUICK[mode].map((a) => { const w = mode === "day" ? a * 7 : a; return `<button type="button" data-w="${w}" aria-pressed="${w === v}">${peso(a)}</button>`; }).join("");
    q(".bquick").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => set(+b.dataset.w)));
    if (opts.onApply) {
      const changed = ok() && v !== opts.value;
      q(".bapply").disabled = !changed; q(".bpend").hidden = !changed;
    }
    if (opts.onChange) opts.onChange(ok() ? v : null);
  };
  const set = (w) => { v = w; sync(false); };
  inp.addEventListener("focus", () => inp.select());
  inp.addEventListener("input", () => {
    const digits = inp.value.replace(/\D/g, "").slice(0, 6);
    v = digits ? (mode === "day" ? +digits * 7 : +digits) : null;
    sync(true);
  });
  inp.addEventListener("blur", () => { inp.value = toShown(v); fit(); });
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { inp.blur(); if (opts.onApply && ok() && v !== opts.value) opts.onApply(v); } });
  host.querySelectorAll(".bmode button").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; if (opts.onMode) opts.onMode(mode); sync(false); }));
  // "Hindi sigurado?": typical weekly food spending of families this size in their region (FIES 2023 deciles, at this month's prices)
  q(".bunsure").addEventListener("click", (e) => {
    const box = q(".btyp"), open = box.hidden;
    box.hidden = !open; e.currentTarget.setAttribute("aria-expanded", String(open));
    if (!open) return;
    const t = T();
    box.innerHTML = `<p class="quiet left">${t.unsureS(opts.n, regionName(opts.region))}</p><div class="optlist">${BTYPICAL.map((d, k) => { const w = budgetFor(d, opts.region, opts.n); return `<button type="button" class="opt" data-w="${w}"><span class="tx"><b>${t.typical[k]}</b><small>${t.eqDayShort(peso(w / 7))}</small></span><b class="amt">${peso(w)}</b></button>`; }).join("")}</div>`;
    box.querySelectorAll("[data-w]").forEach((b) => b.addEventListener("click", () => set(+b.dataset.w)));
  });
  if (opts.onApply) q(".bapply").addEventListener("click", () => { if (ok()) opts.onApply(v); });
  sync(false);
  return { focus: () => inp.focus() };
}
