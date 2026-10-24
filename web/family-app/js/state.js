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


const st = store.get("state", null) || { lang: "tl", members: null, who: 1, tab: "today", loc: { region: "R08", prov: "Leyte", city: null, market: null }, prices: {}, budget: null, preset: 1, halal: false, example: true, day: null };
const T = () => Object.assign({}, UI.W[st.lang] || UI.W.tl, W2[st.lang] || W2.tl);
const fname = (k) => UI.fname(k, st.lang);
const FOODS = UI.foods(D, X), FBY = {}; FOODS.forEach((f) => (FBY[f.key] = f));
{ const vg = FOODS.filter((f) => f.group === "vegetables"), o = { key: "_veg", name: "Gulay", group: "vegetables", ep_pct: 100 }; UI.NUTS.forEach((n) => (o[n] = vg.reduce((a, f) => a + (f[n] || 0), 0) / vg.length)); FBY._veg = o; }
const NUTS = UI.NUTS, CORE = ["energy_kcal", "protein_g", "iron_mg", "vit_a_ug", "calcium_mg"];
const targets = (m) => UI.targets(S, m);
const nutr = (key, g) => { const f = FBY[key]; const o = {}; NUTS.forEach((n) => (o[n] = (f[n] || 0) * g)); return o; };
if (!st.members) st.members = UI.EXAMPLE_FAMILY.map((m) => Object.assign({}, m));
if (!st.prices) st.prices = {};
if (st.saved == null) st.saved = 0;
const meIdx = () => { const i = st.members.findIndex((m) => m.status === "pregnant" || m.status === "lactating"); return i >= 0 ? i : st.members.findIndex((m) => m.age >= 18) >= 0 ? st.members.findIndex((m) => m.age >= 18) : 0; };

// ---------------------------------------------------------------- the week
const now = new Date();
const todayIdx = (now.getDay() + 6) % 7; // Monday = 0
const monday = new Date(now); monday.setDate(now.getDate() - todayIdx); const weekKey = monday.toISOString().slice(0, 10);
if (st.day == null || st.weekKey !== weekKey) { st.day = todayIdx; st.weekKey = weekKey; }
let wk = store.get("week:" + weekKey, null);
const exampleWeek = () => { const eaten = {}; for (let d = 0; d < todayIdx; d++) for (let m = 0; m < 4; m++) eaten[d + "-" + m] = true; const h = now.getHours(); if (h >= 9) eaten[todayIdx + "-0"] = true; if (h >= 13) eaten[todayIdx + "-1"] = true; return { eaten, extras: {}, shop: {}, swaps: [] }; };
if (!wk) wk = st.example ? exampleWeek() : { eaten: {}, extras: {}, shop: {}, swaps: [] };
const save = () => { store.set("state", st); store.set("week:" + weekKey, wk); };
