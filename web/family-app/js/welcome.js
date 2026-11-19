/* SAPAT family app · The launch welcome: three screens shown each time the app opens (prototype setting).
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- welcome: three warm screens on first open
function showWelcome() {
  const host = $("screen") || document.body; let i = 0;
  const el = document.createElement("div"); el.className = "welcome"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); host.appendChild(el);
  const art = [() => POT, () => `<div class="wfam">${st.members.map((m, k) => `<span style="--d:${k * 90}ms">${figure(m, "var(--sun)", true)}</span>`).join("")}</div>`,
    () => { const f = priceBy.galunggong || priceBy.tilapia; return `<div class="wprice">${pic("fish", "lg")}${f ? `<span class="ptag">${icon("tag")}<span><b>${peso(f.price_g * 1000)}</b>/kg<small>${esc(fname(f.key))} · ${esc(st.loc.prov || regionName(st.loc.region))}</small></span></span>` : ""}${pic("vegetables", "lg")}</div>`; }];
  const draw = () => {
    const tt = T(), [h, p] = tt.welcome[i], last = i === tt.welcome.length - 1;
    el.innerHTML = `<button class="btn link wskip" type="button" id="wSkip">${tt.skip}</button>
      <div class="wslide" key="${i}"><div class="wart">${art[i]()}</div><div class="wbrand">sapat<span>.</span></div><h2>${h}</h2><p>${p}</p>${last ? `<p class="quiet left">${icon("shield")}${tt.medDisc}</p>` : ""}</div>
      <div class="wfoot"><div class="dots">${tt.welcome.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <button class="btn primary block big" type="button" id="wNext">${last ? icon("heart") + tt.start : tt.next}</button></div>`;
    $("wSkip").addEventListener("click", done);
    $("wNext").addEventListener("click", () => { if (last) done(); else { i++; draw(); } });
    $("wNext").focus({ preventScroll: true });
  };
  const done = () => { el.classList.add("out"); setTimeout(() => el.remove(), reduced() ? 0 : 280); };
  draw();
}
