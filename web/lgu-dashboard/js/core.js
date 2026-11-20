/* SAPAT LGU dashboard · Core: data handles, formatting, icons, saved settings, tabs and theme.
 * Plain scripts loaded in order (core → areas → situation → export → menu → about → boot); they share top-level names.
 * Works straight from the file (no build, no modules). */
"use strict";

const D = window.SAPAT_DATA, S = window.SAPAT, UI = window.SAPAT_UI;
S.setData(D); S.setLocal(window.SAPAT_LOCAL);
UI.foods(D, window.SAPAT_EXTRA);
const MAP = window.PH_MAP, PROV = window.PH_PROV;
const TU = () => UI.W.en; // this dashboard is in English for officials; shared nutrient words come from sapat-ui.js

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (x, d = 0) => (x == null || !isFinite(x)) ? "–" : x.toLocaleString("en-PH", { minimumFractionDigits: d, maximumFractionDigits: d });
const peso = (x, d = 0) => (x == null || !isFinite(x)) ? "–" : "₱" + fmt(x, d);
const pctAbs = (x) => Math.round(Math.abs(x) * 100) + "%"; // whole percent, no sign
const pctSigned = (x) => (x == null || !isFinite(x)) ? "–" : (x >= 0.0005 ? "+" : x <= -0.0005 ? "−" : "") + fmt(Math.abs(x * 100), 1) + "%";
const monthName = (m) => { const [y, mo] = m.split("-"); return new Date(+y, +mo - 1, 1).toLocaleDateString("en-PH", { month: "short", year: "numeric" }); };
const monthLong = (m) => { const [y, mo] = m.split("-"); return new Date(+y, +mo - 1, 1).toLocaleDateString("en-PH", { month: "long", year: "numeric" }); };
const lastMonth = D.months[D.months.length - 1];
const MONTHS = D.months.filter((m) => m >= "2019-01"); // months the alert rule can be read for (it needs a year of history)

// Plain region names, with the region number officials use
const REGION_NAMES = {
  PH: "Whole Philippines", NCR: "Metro Manila (NCR)", CAR: "Cordillera (CAR)", R01: "Ilocos Region (I)", R02: "Cagayan Valley (II)", R03: "Central Luzon (III)",
  R4A: "CALABARZON (IV-A)", R4B: "MIMAROPA (IV-B)", R05: "Bicol (V)", R06: "Western Visayas (VI)", R07: "Central Visayas (VII)", R08: "Eastern Visayas (VIII)",
  R09: "Zamboanga Peninsula (IX)", R10: "Northern Mindanao (X)", R11: "Davao Region (XI)", R12: "SOCCSKSARGEN (XII)", R13: "Caraga (XIII)", BARMM: "BARMM", NIR: "Negros Island Region",
};
const regionName = (k) => REGION_NAMES[k] || (D.regions.find((r) => r.key === k) || {}).name || k;
const REGIONS = D.regions.filter((r) => r.key !== "PH" && D.index[r.key]).map((r) => r.key);

// Poorest-10% food spending, moved to each month's prices (FIES 2023 base). NIR uses Western Visayas' survey row.
const regKey = (r) => (r === "NIR" ? "R06" : r);
function inflator(region, month) {
  const ix = D.index[region]; if (!ix) return 1;
  const i = ix.months.indexOf(month), base = D.base2023[region];
  return i >= 0 && base ? ix.cond[i] / base : 1;
}

// Saved settings (this browser only)
const store = {
  get(k, d) { try { const v = localStorage.getItem("sapat-lgu7:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("sapat-lgu7:" + k, JSON.stringify(v)); } catch (e) {} },
};

// ---------------------------------------------------------------- icons (24x24 line icons)
const IP = {
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  grow: '<path d="M12 20V5M6.5 10.5 12 5l5.5 5.5M5 20h14"/>',
  drop: '<path d="M12 3c3 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 3-6.5 6-11z"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  bone: '<circle cx="5.5" cy="9" r="2"/><circle cx="5.5" cy="15" r="2"/><circle cx="18.5" cy="9" r="2"/><circle cx="18.5" cy="15" r="2"/><path d="M7.3 10.2h9.4M7.3 13.8h9.4"/>',
  rice: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M7 11c.4-2.2 2.2-3.5 5-3.5s4.6 1.3 5 3.5"/><path d="M9 4.5c0 1 1 1.4 1 2.4M14 4.5c0 1 1 1.4 1 2.4"/>',
  fish: '<path d="M3 12c3-5 9-6.5 13.5-3L21 6v12l-4.5-3C12 18.5 6 17 3 12z"/><circle cx="8" cy="11" r=".9" fill="currentColor"/>',
  meat: '<path d="M14.5 3.5a5.5 5.5 0 0 1 3 9.6l-3.4 3.4-5.6-5.6 3.4-3.4a5.5 5.5 0 0 1 2.6-4z"/><path d="M8.5 11l-3.3 3.3"/><circle cx="4" cy="17.5" r="1.6"/><circle cx="6.5" cy="20" r="1.6"/>',
  egg: '<path d="M12 3c-3.5 0-6.5 5-6.5 9.5a6.5 6.5 0 0 0 13 0C18.5 8 15.5 3 12 3z"/>',
  bean: '<path d="M7.5 5.5c3-2.8 9-2 11 2.2 2 4.3-.5 10.3-5.5 11-4.5.7-8-2.2-7.2-5.2.6-2.1 2.8-2.4 2.3-4.5-.4-1.6-2-2.3-.6-3.5z"/><path d="M12 9c-1 1.5-1 3.5.5 5"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 8.5-5.5 14-15 14z"/><path d="M5 19 13.5 10.5"/>',
  fruit: '<path d="M12 7.5c-4-2-8 1-7 6.2.9 4.6 4 7.6 7 6.8 3 .8 6.1-2.2 7-6.8 1-5.2-3-8.2-7-6.2z"/><path d="M12 7.5c0-2 .8-3.5 3-4.5"/>',
  root: '<path d="M7 17c-2.6-3.6 1.2-10 7-11.2 4.4-.9 6.6 2.4 4.6 6.6-2 4.2-8.6 8.1-11.6 4.6z"/><path d="M7 17l-3.5 3.5M11 9.5l1 1M14 12l1 1"/>',
  spice: '<path d="M12 4c-1.2 2.4-6 4.2-6 9a6 6 0 0 0 12 0c0-4.8-4.8-6.6-6-9z"/><path d="M9.5 11.5c0 3 1 5.5 2.5 6.5M14.5 11.5c0 3-1 5.5-2.5 6.5"/>',
  sugar: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  basket: '<path d="M3 9.5h18l-2 9.5H5L3 9.5z"/><path d="M7.5 9.5 12 4l4.5 5.5M9 13v3M12 13v3M15 13v3"/>',
  pot: '<path d="M4 10h16v5.5A4.5 4.5 0 0 1 15.5 20h-7A4.5 4.5 0 0 1 4 15.5V10z"/><path d="M2 10h20M9 6.5c0-1.2 1.2-2 3-2s3 .8 3 2"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3 8.2-7 10-4-1.8-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  warn: '<path d="M12 4 2.5 20h19L12 4z"/><path d="M12 10v4.5M12 17.2v.1"/>',
  siren: '<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 18h14v3H5zM12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.8c2.5.2 4 1.9 4.5 4.7"/>',
  wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7z"/><path d="M4 7V6a2 2 0 0 1 2-2h10v3M15.5 13.5h.1"/>',
  map: '<path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5L9 4z"/><path d="M9 4v13.5M15 6.5V20"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M7 15l4-4 3 3 5-6"/>',
  table: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="2.6"/><path d="M3 7v4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7"/><path d="M9 13.6v3.8c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4c0-1.4-2.7-2.6-6-2.6"/>',
  up: '<path d="M4 17l6-6 4 4 6-7"/><path d="M15 8h5v5"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  down: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  print: '<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8" rx="2"/><path d="M7 13.5h10V20.5H7z"/>',
  doc: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 15.5h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  sort: '<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>',
  sortUp: '<path d="M8 14l4-4 4 4"/>',
  sortDown: '<path d="M8 10l4 4 4-4"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
};
const icon = (n, cls) => `<svg class="i${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${IP[n] || ""}</svg>`;
const chev = () => icon("chev", "chev");
function hydrateIcons(root) {
  (root || document).querySelectorAll("[data-icon]").forEach((el) => { if (!el.querySelector(":scope > svg.i")) el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); });
}

// Status: always the word and an icon together, never colour alone
const LEVELS = [
  { k: "steady", word: "Steady", icon: "check" },
  { k: "watch", word: "Watch", icon: "warn" },
  { k: "alert", word: "Alert", icon: "siren" },
];
const tag = (lv, cls) => lv == null ? `<span class="tag none${cls ? " " + cls : ""}">No data</span>` : `<span class="tag ${LEVELS[lv].k}${cls ? " " + cls : ""}">${icon(LEVELS[lv].icon)}${LEVELS[lv].word}</span>`;

// ---------------------------------------------------------------- tabs
const VIEWS = ["lgu", "focus", "menu", "about"];
function showView(v) {
  if (!VIEWS.includes(v)) v = "lgu";
  document.querySelectorAll("nav.tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === v)));
  VIEWS.forEach((x) => ($("view-" + x).hidden = x !== v));
  if (v === "lgu") renderSituation(); if (v === "focus") renderFocus(); if (v === "menu") renderMenu();
  store.set("view", v);
}

// ---------------------------------------------------------------- light / dark (follows the device until the viewer picks one)
function setupTheme() {
  const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const paint = () => { $("themeBtn").innerHTML = icon(isDark() ? "sun" : "moon"); $("themeBtn").setAttribute("aria-label", isDark() ? "Use light colours" : "Use dark colours"); };
  try { const t = localStorage.getItem("sapat:lgutheme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  paint();
  $("themeBtn").addEventListener("click", () => { const t = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = t; try { localStorage.setItem("sapat:lgutheme", t); } catch (e) {} paint(); });
}
