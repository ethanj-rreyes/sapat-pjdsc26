/* SAPAT LGU dashboard · Welcome and guided tour. The welcome opens each time the page loads (prototype setting, as in the family
 * app, so judges and demo recordings always see it); "Tour" in the header replays the tour. The tour lights up one part of the
 * page at a time and says what it is for, across Price alerts, Province close-up and Feeding program. */
"use strict";

const TOUR = [
  { view: "lgu", el: "#view-lgu .controls", h: "1. Pick what to look at",
    p: "Choose the region and the month (the arrows step one month). Status shows only the Alert, Watch or Steady areas, and Find jumps to a province by name. Everything below follows these filters." },
  { view: "lgu", el: "#view-lgu .answer", h: "2. This month's answer",
    p: "One line: how many provinces are on Alert or Watch, and what a healthy day costs per person across the country (or region)." },
  { view: "lgu", el: "#view-lgu .viz", h: "The month in pictures",
    p: "How many provinces are on Alert, Watch or Steady (click a part to show only those), whether that number is rising over the last two years (click a month to open it), and which key foods moved." },
  { view: "lgu", el: "#view-lgu .mapbox", h: "3. The map",
    p: "Colour shows the measure you pick (cost of a healthy day, its change, or the alert level; 6 more under More measures). ▲ is Alert and ● is Watch on every measure. Point at a province for its numbers; click to select it." },
  { view: "lgu", el: "#view-lgu .apanel", h: "4. What needs attention",
    p: "Every province on Alert or Watch, most urgent first, with the food that rose most. Scroll the list, click a name to find it on the map, or open Full view to read all of them with what to do." },
  { view: "lgu", el: "#view-lgu .tablebox", h: "5. The numbers",
    p: "The same provinces as a table. Click a column to sort. Download it as CSV or Excel, or print it, for the Local Nutrition Committee." },
  { view: "lgu", el: "#rules", h: "6. How the levels are set",
    p: "Watch: 5% above the 3 months before. Alert: 10% above, or 15% above last year. Tested on past prices; the buttons replay past shocks such as the 2023 rice spike." },
  { view: "focus", el: "#view-focus .frail", h: "7. Province close-up",
    p: "A second tab for one province at a time. The list starts with the provinces on Alert; switch to Alert + Watch or All, or search." },
  { view: "focus", el: "#detail", h: "8. Why, and what to do",
    p: "Why the province is flagged, three years of its cost, the key food prices, and what the office can do at this level. One-page summary prints a PDF to attach to a report; Previous and Next step through the list." },
  { view: "menu", el: "#view-menu > .panel", h: "9. Plan a feeding program",
    p: "For school or community feeding: pick the region, the learners' age, how many, and the budget per meal." },
  { view: "menu", el: "#view-menu .results", h: "10. The menu and the order",
    p: "A 5-day menu at this month's prices, whether each meal meets the learners' needs, and the week's ingredients as a supplier order. The protein rotates so no dish repeats when there are other choices." },
];

// ---------------------------------------------------------------- welcome
function showWelcome() {
  const d = document.createElement("dialog"); d.className = "welcome"; d.setAttribute("aria-labelledby", "wH");
  d.innerHTML = `
    <div class="wtop"><span class="wordmark">sapat<span>.</span></span><span class="tagline">for LGU nutrition offices</span></div>
    <h1 id="wH">See where healthy food is getting harder to afford, and plan feeding programs at today's prices.</h1>
    <p class="wsub">From PSA retail prices, updated monthly for every province. Built for nutrition action officers, provincial health officers and dietitians.</p>
    <div class="wcards">
      <div class="wcard">${icon("map")}<b>Price alerts</b><span>Which provinces are on Alert or Watch this month, on a map and a table.</span></div>
      <div class="wcard">${icon("siren")}<b>Province close-up</b><span>One province at a time: why it is flagged and what to do.</span></div>
      <div class="wcard">${icon("pot")}<b>Feeding program</b><span>A 5-day menu and supplier order for your budget per meal.</span></div>
    </div>
    <p class="wdisc">${icon("info")}<span>SAPAT is planning guidance for programs, not medical advice.</span></p>
    <div class="wact"><button type="button" class="btn primary" id="wTour">${icon("chev")}Take the 1-minute tour</button><button type="button" class="btn" id="wSkip">Go to the dashboard</button></div>`;
  document.body.appendChild(d);
  const close = () => { d.close(); d.remove(); };
  d.addEventListener("cancel", (e) => { e.preventDefault(); close(); });
  d.querySelector("#wSkip").addEventListener("click", close);
  d.querySelector("#wTour").addEventListener("click", () => { close(); startTour(); });
  d.showModal(); d.querySelector("#wTour").focus();
}

// ---------------------------------------------------------------- tour
let tourAt = -1, tourEls = null, tourBack = null;
function startTour() {
  if (tourEls) endTour();
  tourBack = store.get("view", "lgu");
  const spot = document.createElement("div"); spot.className = "tspot"; spot.setAttribute("aria-hidden", "true");
  const card = document.createElement("div"); card.className = "tcard"; card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "false"); card.setAttribute("aria-labelledby", "tH");
  const block = document.createElement("div"); block.className = "tblock"; // stops clicks on the page while the tour runs
  document.body.append(block, spot, card);
  tourEls = { spot, card, block };
  block.addEventListener("click", () => tourStep(tourAt + 1));
  window.addEventListener("resize", placeTour); window.addEventListener("scroll", placeTour, { passive: true });
  document.addEventListener("keydown", tourKeys);
  tourStep(0);
}
function tourKeys(e) {
  if (!tourEls) return;
  if (e.key === "Escape") { e.preventDefault(); endTour(); }
  else if (e.key === "ArrowRight") tourStep(tourAt + 1);
  else if (e.key === "ArrowLeft" && tourAt > 0) tourStep(tourAt - 1);
}
function tourStep(k) {
  if (k >= TOUR.length) { endTour(true); return; }
  if (k < 0) return;
  tourAt = k; const s = TOUR[k];
  if (store.get("view", "lgu") !== s.view || $("view-" + s.view).hidden) showView(s.view);
  const t = document.querySelector(s.el); if (!t) { tourStep(k + 1); return; }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const r = t.getBoundingClientRect(), fits = r.height < window.innerHeight * 0.62;
  window.scrollTo({ top: window.scrollY + r.top - (fits ? Math.max(16, (window.innerHeight * 0.62 - r.height) / 2) : 16), behavior: "auto" });
  const { card } = tourEls;
  card.innerHTML = `<p class="tstep">${k + 1} of ${TOUR.length}${k >= 7 ? ` · ${s.view === "focus" ? "Province close-up" : "Feeding program"} tab` : ` · Price alerts tab`}</p>
    <h2 id="tH">${esc(s.h.replace(/^\d+\.\s*/, ""))}</h2><p>${esc(s.p)}</p>
    <div class="tbar"><button type="button" class="linkbtn" id="tEnd">End tour</button>
      <span class="tnav">${k ? `<button type="button" class="btn small" id="tPrev">${icon("left")}Back</button>` : ""}<button type="button" class="btn small primary" id="tNext">${k === TOUR.length - 1 ? "Finish" : "Next"}${k === TOUR.length - 1 ? "" : chev()}</button></span></div>`;
  card.querySelector("#tEnd").addEventListener("click", () => endTour());
  card.querySelector("#tNext").addEventListener("click", () => tourStep(k + 1));
  if (card.querySelector("#tPrev")) card.querySelector("#tPrev").addEventListener("click", () => tourStep(k - 1));
  placeTour();
  card.querySelector("#tNext").focus({ preventScroll: true });
  if (!reduce) { card.classList.remove("in"); void card.offsetWidth; card.classList.add("in"); }
}
function placeTour() {
  if (!tourEls || tourAt < 0) return;
  const t = document.querySelector(TOUR[tourAt].el); if (!t) return;
  const { spot, card } = tourEls, pad = 8, vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const r = t.getBoundingClientRect();
  const top = Math.max(4, r.top - pad), bot = Math.min(vh - 4, r.bottom + pad);
  Object.assign(spot.style, { left: r.left - pad + "px", top: top + "px", width: r.width + 2 * pad + "px", height: Math.max(0, bot - top) + "px" });
  // the card: below the lit part if it fits, else above, else pinned to the bottom of the screen
  const cw = Math.min(400, vw - 24); card.style.width = cw + "px";
  const ch = card.offsetHeight, gap = 12;
  let y, x = Math.min(Math.max(12, r.left), vw - cw - 12);
  if (vw < 640) { y = vh - ch - 12; x = 12; card.style.width = vw - 24 + "px"; }
  else if (bot + gap + ch < vh) y = bot + gap;
  else if (top - gap - ch > 0) y = top - gap - ch;
  else { y = vh - ch - 16; x = Math.min(Math.max(12, r.right - cw - 16), vw - cw - 12); }
  card.style.left = x + "px"; card.style.top = y + "px";
}
function endTour(finished) {
  if (!tourEls) return;
  Object.values(tourEls).forEach((e) => e.remove()); tourEls = null; tourAt = -1;
  window.removeEventListener("resize", placeTour); window.removeEventListener("scroll", placeTour);
  document.removeEventListener("keydown", tourKeys);
  showView(finished ? "lgu" : tourBack || "lgu"); window.scrollTo(0, 0);
  $("tourBtn").focus();
}
