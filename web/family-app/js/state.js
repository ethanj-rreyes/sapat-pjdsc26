/* SAPAT family app · App setup: data handles, saved state (localStorage), the family, the current week, and the T() word lookup.
 * One of several ordered scripts; see js/README.md. */
"use strict";

const D = window.SAPAT_DATA, S = window.SAPAT, X = window.SAPAT_EXTRA, PL = window.SAPAT_PLACES || {}, UI = window.SAPAT_UI;
S.setData(D); S.setLocal(window.SAPAT_LOCAL);
const $ = (id) => document.getElementById(id);
const { esc, fmt, peso, icon, pic, figure } = UI;
const WIDE = !!$("sidenav");
const lastMonth = D.months[D.months.length - 1];
const NS = WIDE ? "sapatw2:" : "sapatm3:";
const store = { get(k, d) { try { const v = localStorage.getItem(NS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {} } };


// ---------------------------------------------------------------- profiles (saved on this phone only, nothing is sent to a server)
// Each family profile has its own keys: "p:<id>:state" and "p:<id>:week:<monday>". "profiles" lists them and remembers the last one used.
// Tita Baby's sample ("sample") is never written: it opens in its original state every time. Language and theme are device-wide ("prefs").
const SAMPLE = "sample";
const prefs = store.get("prefs", null) || (() => { const o = store.get("state", null) || {}; return { lang: o.lang || "tl", theme: o.theme || null }; })();
const profiles = store.get("profiles", null) || { list: [], last: SAMPLE };
const sampleState = () => ({ name: null, members: UI.EXAMPLE_FAMILY.map((m) => Object.assign({}, m)), who: 1, tab: "today", loc: { region: "R08", prov: "Leyte", city: null, market: null }, prices: {}, budget: null, preset: 1, halal: false, example: true, day: null, saved: 0 });
let pid = SAMPLE;
const isSample = () => pid === SAMPLE;
const pkey = (id, k) => "p:" + id + ":" + k;
const st = {}; // the open profile (filled by openProfile below)
const profileName = (id) => (id === SAMPLE ? T().sampleName : ((profiles.list.find((p) => p.id === id) || {}).name || "?"));
const T = () => Object.assign({}, UI.W[st.lang] || UI.W.tl, W2[st.lang] || W2.tl);
const fname = (k) => UI.fname(k, st.lang);
const FOODS = UI.foods(D, X), FBY = {}; FOODS.forEach((f) => (FBY[f.key] = f));
{ const vg = FOODS.filter((f) => f.group === "vegetables"), o = { key: "_veg", name: "Gulay", group: "vegetables", ep_pct: 100 }; UI.NUTS.forEach((n) => (o[n] = vg.reduce((a, f) => a + (f[n] || 0), 0) / vg.length)); FBY._veg = o; }
const NUTS = UI.NUTS, CORE = ["energy_kcal", "protein_g", "iron_mg", "vit_a_ug", "calcium_mg"];
const targets = (m) => UI.targets(S, m);
const nutr = (key, g) => { const f = FBY[key]; const o = {}; NUTS.forEach((n) => (o[n] = (f[n] || 0) * g)); return o; };
const meIdx = () => { const i = st.members.findIndex((m) => m.status === "pregnant" || m.status === "lactating"); return i >= 0 ? i : st.members.findIndex((m) => m.age >= 18) >= 0 ? st.members.findIndex((m) => m.age >= 18) : 0; };

// ---------------------------------------------------------------- the week
const now = new Date();
const todayIdx = (now.getDay() + 6) % 7; // Monday = 0
const monday = new Date(now); monday.setDate(now.getDate() - todayIdx); const weekKey = monday.toISOString().slice(0, 10);
const exampleWeek = () => { const eaten = {}; for (let d = 0; d < todayIdx; d++) for (let m = 0; m < 4; m++) eaten[d + "-" + m] = true; const h = now.getHours(); if (h >= 9) eaten[todayIdx + "-0"] = true; if (h >= 13) eaten[todayIdx + "-1"] = true; return { eaten, extras: {}, shop: {}, swaps: [] }; };
const emptyWeek = () => ({ eaten: {}, extras: {}, shop: {}, swaps: [] });
let wk = null;
// Load a profile into st and wk. The sample always starts fresh; a saved profile comes back exactly as it was left.
function openProfile(id) {
  if (id !== SAMPLE && !profiles.list.some((p) => p.id === id)) id = SAMPLE;
  pid = id;
  const saved = isSample() ? null : store.get(pkey(id, "state"), null);
  Object.keys(st).forEach((k) => delete st[k]);
  Object.assign(st, saved || sampleState(), { lang: prefs.lang, theme: prefs.theme });
  if (!st.members || !st.members.length) st.members = sampleState().members;
  if (!st.prices) st.prices = {};
  if (st.saved == null) st.saved = 0;
  if (st.day == null || st.weekKey !== weekKey) { st.day = todayIdx; st.weekKey = weekKey; }
  wk = (isSample() ? null : store.get(pkey(id, "week:" + weekKey), null)) || (st.example ? exampleWeek() : emptyWeek());
  profiles.last = id; store.set("profiles", profiles);
}
const save = () => {
  prefs.lang = st.lang; prefs.theme = st.theme || null; store.set("prefs", prefs);
  if (isSample()) return; // demo changes are never written over Tita Baby
  const o = Object.assign({}, st); delete o.lang; delete o.theme;
  store.set(pkey(pid, "state"), o); store.set(pkey(pid, "week:" + weekKey), wk);
};
// A family saved by the earlier one-profile version ("state" with the example cleared) becomes a profile of its own.
if (!store.get("prefs", null)) {
  const old = store.get("state", null);
  if (old && old.example === false && old.members && old.members.length) {
    const id = "f" + Date.now().toString(36); delete old.lang; delete old.theme; old.name = prefs.lang === "en" ? "My family" : "Aking pamilya";
    store.set(pkey(id, "state"), old); const w = store.get("week:" + weekKey, null); if (w) store.set(pkey(id, "week:" + weekKey), w);
    profiles.list.push({ id, name: old.name }); profiles.last = id;
  }
  store.set("prefs", prefs); store.set("profiles", profiles);
}
openProfile(profiles.last || SAMPLE);
