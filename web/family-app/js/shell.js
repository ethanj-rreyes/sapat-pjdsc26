/* SAPAT family app · App shell: tabs, theme, language, navigation (go/render), toasts, bottom sheets, and the meal card used on several screens.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- chrome
const TABS = [["today", "sun"], ["week", "bowl"], ["shop", "list"], ["family", "users"]];
function drawNav() {
  const tt = T();
  if ($("nav")) $("nav").innerHTML = TABS.map(([k, ic], n) => `<button type="button" data-t="${k}"><span class="pill">${icon(ic)}</span>${tt.tabs[n]}</button>`).join("");
  if ($("sidenav")) $("sidenav").innerHTML = TABS.map(([k, ic], n) => `<button type="button" data-t="${k}">${icon(ic)}${tt.tabs[n]}</button>`).join("");
  document.querySelectorAll("#nav button, #sidenav button").forEach((b) => b.addEventListener("click", () => go(b.dataset.t)));
}
const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
function setTheme(t) { document.documentElement.dataset.theme = t; st.theme = t; save(); drawChrome(); }
if (st.theme) document.documentElement.dataset.theme = st.theme;
$("themeBtn").addEventListener("click", () => setTheme(isDark() ? "light" : "dark"));
$("langBtn").addEventListener("click", () => setLang(st.lang === "tl" ? "en" : "tl"));
$("backBtn").innerHTML = icon("back"); $("backBtn").addEventListener("click", () => go(st.prev || "today"));
function setLang(l) { st.lang = l; save(); document.documentElement.lang = l === "tl" ? "fil" : "en"; drawChrome(); drawNav(); go(st.tab); }
function drawChrome() {
  const tt = T();
  $("themeBtn").innerHTML = icon(isDark() ? "sun" : "moon"); $("themeBtn").setAttribute("aria-label", tt.light);
  $("langBtn").querySelectorAll("span").forEach((s) => s.classList.toggle("on", s.dataset.l === st.lang));
  $("langBtn").setAttribute("aria-label", tt.langH + ": " + (st.lang === "tl" ? "Tagalog" : "English"));
  $("backBtn").setAttribute("aria-label", tt.back);
  if ($("tagline")) $("tagline").textContent = st.lang === "tl" ? "Sustansya na abot-kaya." : "Nutrition you can afford.";
  if ($("sideFoot")) $("sideFoot").textContent = tt.src[3];
  if ($("noteText")) $("noteText").textContent = tt.note;
  if ($("persona")) $("persona").innerHTML = `${figure(UI.EXAMPLE_FAMILY[1], "var(--sun)")}<span><b>${tt.persona[0]}</b><small>${tt.persona[1]}</small></span>`;
}
const VIEWS = ["today", "week", "shop", "family", "person"];
function go(t) {
  if (t !== "person") st.prev = t;
  st.tab = t; save();
  if (st.who >= st.members.length) st.who = 0;
  const navTab = t === "person" ? (st.prev || "family") : t;
  document.querySelectorAll("#nav button, #sidenav button").forEach((b) => (b.dataset.t === navTab ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
  VIEWS.forEach((k) => ($("v-" + k).hidden = k !== t));
  const tt = T(), h = now.getHours();
  const hi = tt.hi[h < 11 ? 0 : h < 13 ? 1 : h < 18 ? 2 : 3];
  const dateStr = now.toLocaleDateString(st.lang === "tl" ? "fil-PH" : "en-PH", { weekday: "long", month: "short", day: "numeric" });
  const titles = { today: `${hi}, ${st.members[meIdx()].name}!`, week: tt.tabs[1], shop: tt.tabs[2], family: tt.tabs[3], person: st.members[st.who].name };
  const subs = { today: tt.kumain, week: placeName(), shop: placeName(), family: "", person: dateStr };
  $("title").textContent = titles[t]; $("subtitle").textContent = subs[t];
  $("sampBadge").hidden = !isSample(); $("sampBadge").textContent = tt.sample; // so no one mistakes Tita Baby's sample for real data
  $("backBtn").hidden = t !== "person";
  window.scrollTo(0, 0); if ($("main") && $("main").scrollTop) $("main").scrollTop = 0;
  render();
}
function render() { CALC = {}; ({ today: renderToday, week: renderWeek, shop: renderShop, family: renderFamily, person: renderPerson })[st.tab](); }
let toastTimer = null;
function toast(msg, undo) {
  const t = $("toast"); t.innerHTML = `${icon("check")}<span>${esc(msg)}</span>${undo ? `<button type="button">${T().undo}</button>` : ""}`; t.hidden = false;
  if (undo) t.querySelector("button").addEventListener("click", () => { undo(); t.hidden = true; });
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 4000);
}
const chev = () => icon("chev").replace('class="i"', 'class="i chev"');
const MI = ["sun", "bowl", "cup", "moon"];
const famBubble = (m, i, d) => { const md = memberDay(i, d), s = score(md); return `<button class="fam" type="button" data-who="${i}">${figure(m, ringCol(s), true)}<b>${esc(m.name)}</b><span class="word ${scoreState(s)}">${scoreWord(s)}</span></button>`; };
function mealCard(d, mi, opts) {
  const tt = T(), items = week.days[d][mi], eaten = !!wk.eaten[d + "-" + mi], cost = items.length ? typR(sumT(items.map((x) => [x.key, x.g])), mealRange(items)) : "";
  const chips = items.filter((x) => !["condiments", "sugar"].includes(FBY[x.key].group) && (mi === 0 || FBY[x.key].group !== "cereals")).map((x) => `<span class="ing">${pic(FBY[x.key].group, "xs")}${esc(fname(x.key))}</span>`).join("");
  return `<div class="meal${eaten ? " done" : ""}">
    <div class="mtop"><span class="bubble ${mi === 2 ? "sun" : ""}">${icon(MI[mi])}</span><span class="mt"><small>${tt.meals[mi]} · ${tt.mealHint[mi]}</small><b>${esc(mealName(items, mi, d))}</b></span><span class="mc">${cost}${calc(() => explainList(items.map((x) => [x.key, x.g]), esc(mealName(items, mi, d)), st.members.length))}</span></div>
    ${items.length ? `<div class="ings">${chips}</div>` : ""}
    ${opts && opts.actions && items.length ? `<div class="mact"><button class="btn ${eaten ? "done" : "primary"}" type="button" data-eat="${d}-${mi}">${icon("check")}${eaten ? tt.eaten : tt.ate}</button>${mi % 2 && !eaten ? `<button class="btn" type="button" data-swap="${d}-${mi}">${icon("swap")}${tt.swap}</button>` : ""}${opts.other ? `<button class="btn link" type="button" data-other="${mi}">${tt.other}</button>` : ""}</div>` : opts && opts.swapOnly && items.length && mi % 2 ? `<div class="mact"><button class="btn" type="button" data-swap="${d}-${mi}">${icon("swap")}${tt.swap}</button></div>` : ""}
  </div>`;
}
function wireMeals(root) {
  root.querySelectorAll("[data-eat]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.eat, r = b.getBoundingClientRect(); if (wk.eaten[k]) delete wk.eaten[k]; else wk.eaten[k] = true; save(); render(); if (wk.eaten[k]) { burst(r); toast(T().thanksAte(T().meals[+k.split("-")[1]]), () => { delete wk.eaten[k]; save(); render(); }); } }));
  root.querySelectorAll("[data-swap]").forEach((b) => b.addEventListener("click", () => openSwap(b.dataset.swap)));
  root.querySelectorAll("[data-other]").forEach((b) => b.addEventListener("click", () => openOther(+b.dataset.other, null)));
  root.querySelectorAll("[data-who]").forEach((b) => b.addEventListener("click", () => { st.who = +b.dataset.who; go("person"); }));
}


// ---------------------------------------------------------------- bottom sheets
function openSheet(title, body, onBack) {
  $("sheet").innerHTML = `<div class="grab"></div><div class="sh">${onBack ? `<button class="iconbtn" type="button" id="shBack" aria-label="${T().back}">${icon("back")}</button>` : ""}<h2 id="sheetTitle">${title}</h2><button class="iconbtn" type="button" id="shClose" aria-label="${T().close}">${icon("x")}</button></div><div class="sb" id="sb">${body}</div>`;
  $("scrim").hidden = false;
  $("shClose").addEventListener("click", closeSheet);
  if (onBack) $("shBack").addEventListener("click", onBack);
  setTimeout(() => { const f = $("sheet").querySelector("input, .sb button"); if (f) f.focus({ preventScroll: true }); }, 40);
}
function closeSheet() { $("scrim").hidden = true; $("sheet").innerHTML = ""; }
$("scrim").addEventListener("click", (e) => { if (e.target === $("scrim")) closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("scrim").hidden) closeSheet(); });
