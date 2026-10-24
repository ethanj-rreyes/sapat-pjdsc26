/* SAPAT family app · "Pagkain bilang pantulong": everyday foods that support health, with evidence and when to see a health worker.
 * Searchable and filterable.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- "Pagkain bilang pantulong": everyday foods that support health
// Each tip says how strong the evidence is and when to see a health worker. Food supports care; it does not replace it.
const GUIDE = [
  { id: "ubo", sit: "sick", ic: "cup", foods: ["ginger", "calamansi"], ev: 2, tl: ["Salabat na may kalamansi at pulot", "Ubo at sipon", "Pakuluan ang ilang hiwa ng luya, lagyan ng katas ng kalamansi at kaunting pulot. Inumin nang mainit.", "Pinapakalma ng mainit na inumin ang lalamunan. Sa mga batang 1 taon pataas, nakababawas ng ubo ang pulot (Cochrane review).", "Huwag bigyan ng pulot ang sanggol na wala pang 1 taon (panganib ng botulism). Magpatingin kung hirap huminga, mataas ang lagnat, o higit 2 linggo na ang ubo."],
    en: ["Ginger tea with calamansi and honey", "Cough and colds", "Boil a few slices of ginger, add calamansi juice and a little honey. Drink warm.", "Warm drinks soothe the throat. For children 1 year and older, honey reduces coughing (Cochrane review).", "Never give honey to babies under 1 year (risk of botulism). See a health worker if breathing is hard, fever is high, or the cough lasts over 2 weeks."] },
  { id: "lagnat", sit: "sick", ic: "drop", foods: ["chicken", "papaya", "latundan"], ev: 3, tl: ["Tubig, sabaw at malambot na prutas", "Lagnat", "Painumin nang madalas: tubig, sabaw ng tinola, lugaw. Ituloy ang pagkain kahit kaunti; saging o papaya ay madaling kainin.", "Nawawalan ng tubig ang katawan kapag nilalagnat, kaya mahalaga ang inumin at pagkain (WHO).", "Hindi pinabababa ng pagkain ang lagnat. Dalhin agad sa health center kung sanggol na wala pang 3 buwan, buntis, higit 2 araw ang lagnat, may kombulsyon, pantal, o ayaw uminom."],
    en: ["Water, soup and soft fruit", "Fever", "Give fluids often: water, tinola broth, lugaw. Keep feeding even a little; banana or papaya is easy to eat.", "Fever makes the body lose water, so drinks and food matter (WHO).", "Food does not bring a fever down. Go to the health center right away for a baby under 3 months, a pregnant woman, fever over 2 days, seizures, rash, or refusing to drink."] },
  { id: "tae", sit: "sick", ic: "shield", foods: ["rice_rm", "latundan"], ev: 3, tl: ["ORS, lugaw at saging", "Pagtatae", "Bigyan ng ORS (libre sa health center) pagkatapos ng bawat pagdumi. Ituloy ang pagpapasuso at pagkain: lugaw, saging.", "Ang ORS ang pumipigil sa dehydration; dapat ituloy ang pagkain para mabilis gumaling (WHO). Para sa bata, may zinc din sa health center.", "Magpatingin kung may dugo sa dumi, napakadalas, lubog ang mata, matamlay, o hindi makainom. Iwasan ang softdrinks at matatamis na juice."],
    en: ["ORS, lugaw and banana", "Diarrhea", "Give ORS (free at the health center) after each loose stool. Keep breastfeeding and feeding: lugaw, banana.", "ORS prevents dehydration and continued feeding speeds recovery (WHO). Children can also get zinc at the health center.", "See a health worker for blood in stool, very frequent stools, sunken eyes, unusual sleepiness, or not drinking. Avoid soft drinks and sweet juice."] },
  { id: "dugo", sit: "daily", ic: "drop", foods: ["talbos", "monggo", "calamansi"], ev: 3, tl: ["Talbos o monggo na may kalamansi", "Mahina ang dugo (anemia)", "Kumain ng talbos ng kamote, monggo o itlog, at sabayan ng kalamansi o prutas. Iwasan ang kape at tsaa habang kumakain.", "Mas naa-absorb ng katawan ang iron mula sa gulay at monggo kapag may vitamin C sa parehong kain.", "Kailangan pa rin ng buntis ang iron-folic acid tablet mula sa health center; hindi ito napapalitan ng pagkain lang."],
    en: ["Sweet potato tops or monggo with calamansi", "Weak blood (anemia)", "Eat talbos ng kamote, monggo or egg, with calamansi or fruit. Skip coffee and tea at mealtime.", "Vitamin C in the same meal helps the body absorb iron from vegetables and beans.", "Pregnant women still need iron-folic acid tablets from the health center; food alone does not replace them."] },
  { id: "buntis", sit: "preg", ic: "heart", foods: ["ginger"], ev: 2, tl: ["Salabat at maliliit na kain", "Pagduduwal ng buntis", "Uminom ng salabat; kumain nang kaunti pero madalas, tulad ng tinapay o kanin sa umaga.", "Isa ang luya sa mga mungkahing hindi gamot para sa pagduduwal sa pagbubuntis (ACOG).", "Magpatingin kung hindi makakain o makainom buong araw, o pumapayat."],
    en: ["Ginger tea and small meals", "Morning sickness", "Drink ginger tea; eat small amounts often, like bread or rice in the morning.", "Ginger is one of the non-drug options for nausea in pregnancy (ACOG).", "See a health worker if you can't keep food or water down all day, or are losing weight."] },
  { id: "tibi", sit: "daily", ic: "fiber", foods: ["papaya", "camote", "kangkong"], ev: 3, tl: ["Papaya, kamote at gulay", "Hirap dumumi (tibi)", "Dagdagan ang gulay, kamote at hinog na papaya; uminom ng maraming tubig.", "Pinapalambot ng fiber at tubig ang dumi.", "Magpatingin kung may matinding sakit ng tiyan o dugo."],
    en: ["Papaya, sweet potato and vegetables", "Constipation", "Eat more vegetables, camote and ripe papaya; drink plenty of water.", "Fiber and water soften stools.", "See a health worker for severe belly pain or blood."] },
  { id: "mata", sit: "daily", ic: "eye", foods: ["kalabasa", "carrot", "talbos"], ev: 3, tl: ["Kalabasa, karot at talbos", "Para sa mata at panlaban sa sakit", "Ihalo sa ulam ang kalabasa, karot o madahong gulay ilang beses sa isang linggo.", "May vitamin A ang mga ito, na kailangan ng mata at panlaban sa impeksyon, lalo na ng mga bata.", "May libreng vitamin A capsule para sa batang 6 buwan hanggang 5 taon sa health center."],
    en: ["Squash, carrot and leafy greens", "Eyes and fighting infection", "Add squash, carrot or leafy greens to the ulam a few times a week.", "They give vitamin A, which eyes and the immune system need, especially in children.", "Children 6 months to 5 years get free vitamin A capsules at the health center."] },
  { id: "aral", sit: "study", ic: "bolt", foods: ["egg", "galunggong", "latundan"], ev: 2, tl: ["Almusal na may itlog, isda o saging", "Pag-aaral at exam", "Huwag laktawan ang almusal; itlog o monggo at kanin, at saging bilang meryenda. Matulog nang sapat bago ang exam.", "Mas nakakapag-focus ang batang may almusal. May kaunting epekto ang dark chocolate sa isip, pero mahal at matamis, kaya mas sulit ang itlog at saging.", "Mahalaga rin ang tulog at tubig; walang pagkaing pumapalit sa pahinga."],
    en: ["Breakfast with egg, fish or banana", "Study and exams", "Don't skip breakfast; egg or monggo with rice, and banana for a snack. Sleep enough before an exam.", "Children who eat breakfast focus better. Dark chocolate has a small effect on thinking, but it's costly and sweet, so egg and banana are better value.", "Sleep and water matter too; no food replaces rest."] },
  { id: "buto", sit: "daily", ic: "bone", foods: ["pechay_n", "monggo"], ev: 2, tl: ["Petsay, dilis at malunggay", "Matibay na buto", "Ihalo ang petsay o malunggay sa sabaw; dilis o tokwa kung may budget.", "May calcium ang madahong gulay, dilis at tokwa, na kailangan ng lumalaking bata at buntis.", "Wala pa sa listahan ng presyo ng PSA ang dilis, malunggay at tokwa, kaya hindi pa sila naisasama sa plano."],
    en: ["Bok choy, dilis and malunggay", "Strong bones", "Add pechay or malunggay to soups; dilis or tokwa if the budget allows.", "Leafy greens, dilis and tokwa give calcium, which growing children and pregnant women need.", "Dilis, malunggay and tokwa are not yet in PSA's price list, so the plan can't include them yet."] },
];
const EV = { 3: "ok", 2: "mid", 1: "low" };
function guideFor() { // the tip most relevant to this household today
  const has = (f) => st.members.some(f), day = Math.floor(Date.now() / 864e5);
  const pool = GUIDE.filter((g) => g.sit === "daily" || (g.sit === "preg" && has((m) => m.status === "pregnant")) || (g.sit === "study" && has((m) => m.age >= 6 && m.age <= 22)));
  return pool[day % pool.length];
}
const foodChips = (g) => g.foods.filter((k) => priceBy[k]).map((k) => `<span class="ing">${pic(FBY[k].group, "xs")}${esc(fname(k))} <em>${pesoR(pRange(k, UI.buyUnits(FBY[k])[0][2]))}/${UI.ul(UI.buyUnits(FBY[k])[0], st.lang).replace(/ \(.*\)$/, "")}</em></span>`).join("");
function tipBody(g, inner) {
  const tt = T(), x = g[st.lang] || g.tl;
  if (inner) return `<div class="tip inner"><span class="word ${EV[g.ev]}">${tt.ev[g.ev]}</span><div class="ings">${foodChips(g)}</div><p>${x[2]}</p><p class="why">${icon("info")}<span>${x[3]}</span></p><p class="warn">${icon("warn")}<span>${x[4]}</span></p></div>`;
  return `<div class="tip"><div class="tiph"><span class="bico">${icon(g.ic)}</span><span class="tx"><small>${x[1]}</small><b>${x[0]}</b></span><span class="word ${EV[g.ev]}">${tt.ev[g.ev]}</span></div>
    <div class="ings">${foodChips(g)}</div><p>${x[2]}</p><p class="why">${icon("info")}<span>${x[3]}</span></p><p class="warn">${icon("warn")}<span>${x[4]}</span></p></div>`;
}
function guideCard() {
  const tt = T(), g = guideFor(); if (!g) return "";
  return `<div class="card guidec"><div class="head"><span class="bubble sun">${icon("heart")}</span><span class="htx"><h2>${tt.guideH}</h2><small>${tt.guideS}</small></span></div>${tipBody(g)}
    <button class="btn block" type="button" data-guide="1">${tt.guideAll}</button></div>`;
}
// the full guide: search + category filters + short rows; one guide opens at a time
const GCAT = [["all", "list"], ["sick", "shield"], ["daily", "leaf"], ["preg", "heart"], ["study", "bolt"]];
let gQ = "", gCat = "all", gOpen = null;
const gText = (g) => { const x = g[st.lang] || g.tl, y = g.tl, z = g.en; return [x[0], x[1], x[2], y[0], y[1], z[0], z[1], ...g.foods.map((k) => fname(k) + " " + (UI.gloss(k, "en") || ""))].join(" ").toLowerCase(); };
function openGuide(id) {
  const tt = T(); gOpen = typeof id === "string" ? id : null; if (gOpen) { gQ = ""; gCat = "all"; }
  openSheet(tt.guideH, `<div class="search">${icon("search")}<input type="search" id="gq" placeholder="${tt.guideSearch}" aria-label="${tt.guideSearch}" value="${esc(gQ)}" autocomplete="off"></div>
    <div class="chips" id="gchips">${GCAT.map(([c, ic]) => `<button type="button" class="chip" data-c="${c}">${icon(ic)}${tt.gcat[c]}</button>`).join("")}</div>
    <div class="glist" id="glist"></div>
    <p class="quiet left">${icon("shield")}${tt.guideDisc}</p>`);
  const draw = () => {
    const q = gQ.trim().toLowerCase(), list = GUIDE.filter((g) => (gCat === "all" || g.sit === gCat) && (!q || q.split(/\s+/).every((w) => gText(g).includes(w))));
    $("gchips").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.c === gCat)));
    $("glist").innerHTML = list.length ? list.map((g) => { const x = g[st.lang] || g.tl, open = gOpen === g.id;
      return `<div class="gitem${open ? " open" : ""}"><button class="gbtn" type="button" data-g="${g.id}" aria-expanded="${open}"><span class="bico c-${g.sit}">${icon(g.ic)}</span><span class="tx"><small>${x[1]}</small><b>${x[0]}</b></span>${chev()}</button>${open ? tipBody(g, true) : ""}</div>`; }).join("")
      : `<p class="quiet">${tt.notFound}</p>`;
    $("glist").querySelectorAll("[data-g]").forEach((b) => b.addEventListener("click", () => { gOpen = gOpen === b.dataset.g ? null : b.dataset.g; draw(); }));
  };
  $("gq").addEventListener("input", (e) => { gQ = e.target.value; gOpen = null; draw(); });
  $("gchips").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { gCat = b.dataset.c; gOpen = null; draw(); }));
  draw();
}
