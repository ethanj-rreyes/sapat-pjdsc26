/* SAPAT shared UI kit: words (Tagalog/English), icons, food pictures, family figures, nutrient targets, portions and
 * place handling. Used by both the mobile app and the web planner so they say and show the same things. */
(function (root) {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (x, d = 0) => (x == null || !isFinite(x)) ? "–" : x.toLocaleString("en-PH", { minimumFractionDigits: d, maximumFractionDigits: d });
  const peso = (x, d = 0) => "₱" + fmt(x, d);

  // ---------------------------------------------------------------- words
  const W = {
    tl: {
      tabs: ["Pamilya", "Budget", "Presyo", "Ayos"], note: "Prototype ng SAPAT app. Pindutin na parang telepono.",
      hi: ["Magandang umaga", "Magandang tanghali", "Magandang hapon", "Magandang gabi"],
      homeAll: "Busog at sapat ang lahat ngayong araw!", homeSome: (n, t) => `${n} sa ${t} ang sapat na ang kain ngayon.`, homeNone: "Simulan nating itala ang kain ngayon.",
      tapOne: "Pindutin ang isang kasama para makita ang kinain niya.", add: "Magdagdag", example: "Halimbawang araw lang ito.", clear: "Burahin", cleared: "Binura ang halimbawa",
      none: "Wala pang kain", allOk: "Sapat na ngayon", shortOn: "Kulang sa", and: "at",
      st: { ok: "Sapat", mid: "Medyo kulang", low: "Kulang", over: "Sobra", none: "Wala pa" },
      yrs: "taon", preg: "buntis", lact: "nagpapasuso", female: "Babae", male: "Lalaki",
      kcalLeft: "kcal pa", kcalOver: "kcal sobra", spent: "gastos ngayon", energy: "Lakas",
      prot: "Protina", carb: "Carbs", fat: "Taba", vits: "Bitamina at fiber", fiber: "Fiber", iron: "Iron", vitA: "Vitamin A", vitC: "Vitamin C", calcium: "Calcium",
      tipLow: (n) => `Kulang sa ${n}?`, tipAdds: (p, c) => `+${p}% ng kailangan · ${c}`,
      meals: ["Almusal", "Tanghalian", "Meryenda", "Hapunan"], mealEmpty: "Wala pa", addTo: (m) => `Idagdag sa ${m}`, addFood: "Idagdag",
      search: "Hanapin: kanin, itlog, tilapia…", groups: { all: "Lahat", plan: "Nasa listahan", cereals: "Kanin at mais", fish: "Isda", meat: "Karne", eggs: "Itlog", pulses: "Monggo at mani", vegetables: "Gulay", fruits: "Prutas", roots: "Lamang-ugat", condiments: "Pampalasa", sugar: "Asukal" },
      listTag: "Listahan", notFound: "Walang nahanap. Subukan ang ibang salita.", added: (n) => `Naidagdag: ${n}`, removed: (n) => `Tinanggal: ${n}`, undo: "Ibalik",
      pv: ["kcal", "protina", "fiber", "presyo"],
      perWeek: "kada linggo", perDay: "kada araw", presets: ["Masikip", "Katamtaman", "Mas maluwag"],
      enough: "Kaya ng budget ang sapat na pagkain.", notEnough: (s) => `Kulang ng ${s} bawat linggo para sa sapat na pagkain.`,
      yours: "Budget ninyo", healthy: "Sapat na pagkain", bestList: "Ang listahan sa ibaba ang pinakamasustansya sa budget ninyo.",
      trendH: "Halaga ng masustansyang araw", perPerson: "kada tao bawat araw", vsYear: "mula noong isang taon",
      lv: { normal: "Steady", watch: "Bantayan", alert: "Alerto" },
      situH: (r) => `Kalagayan sa ${r}`, s1: "ng kita napupunta sa pagkain", s2: "kulang ang gastos sa pagkain", s3: "ng gastos ay bigas at mais", s4: "ng pamilya ay mahirap",
      in10: "sa 10", fies: "PSA FIES 2023 at 2023 poverty statistics", buyH: "Bibilhin ngayong linggo", cookH: "Lutong-bahay", noPlan: "Hindi makagawa ng plano. Subukan ang ibang budget.",
      whereH: "Saan ka namimili?", lvName: { region: "Rehiyon", province: "Probinsya", city: "Lungsod o bayan", market: "Palengke" },
      wholeRegion: "Buong rehiyon", anyCity: "Kahit saang bayan", anyMarket: "Kahit saang palengke", pick: "Hanapin",
      noCityPrice: "Wala pang presyo para sa bayang ito. Presyo muna ng probinsya o rehiyon ang gagamitin.",
      noMarketPrice: "Wala pang presyo mula sa palengke. Presyo muna ng lungsod, probinsya o rehiyon ang gagamitin.",
      hasCityPrice: "May sariling presyo ang lungsod na ito mula sa PSA.", noPriceYet: "Wala pang presyo", hasPrice: "May presyo mula sa PSA",
      publicMarket: (c) => `Pampublikong palengke ng ${c}`, otherMarket: "Ibang palengke", marketName: "Pangalan ng palengke", save: "I-save",
      usedFrom: "Pinanggalingan ng presyo", lvW: { yours: "sarili mo", market: "palengke", city: "lungsod", province: "probinsya", region: "rehiyon" },
      sulitH: "Pinakasulit ngayong buwan", priceH: "Presyo ngayong buwan", resetMine: "Ibalik ang opisyal na presyo", searchPrice: "Hanapin ang pagkain",
      howMuch: "Magkano ang bili mo kada kilo?", now: "Ngayon", useOfficial: "Gamitin ang opisyal na presyo", saved: "Na-save ang presyo",
      lvl: { yours: "Sarili mo", market: "Palengke", city: "Lungsod", province: "Probinsya", region: "Rehiyon" },
      famH: "Kasama sa bahay", addM: "Magdagdag ng kasama", halal: "Walang baboy (halal)", halalS: "Tanggalin ang baboy sa listahan",
      langH: "Wika", langS: "Tagalog o English", theme: "Madilim na itsura", themeS: "Para sa gabi", dataH: "Pinagkunan ng datos",
      src: ["Presyo: PSA OpenSTAT, rehiyon, probinsya at ilang lungsod", "Sustansya: DOST-FNRI PhilFCT", "Kailangan: PDRI 2015 (FNRI)", "Gabay sa pagkain lang ito, hindi payong medikal."],
      name: "Pangalan", age: "Edad", status: ["Wala", "Buntis", "Nagpapasuso"], done: "Tapos", remove: "Alisin", newM: "Bago",
      persona: ["Baby, 34, buntis", "Nanay ng tatlo sa Leyte. Prepaid na Android. Mga ₱1,300 kada linggo sa pagkain."],
      back: "Bumalik", close: "Isara", light: "Maliwanag o madilim", diet: "Uri ng pagkain", dietNo: "Hindi kinakain", 
    },
    en: {
      tabs: ["Family", "Budget", "Prices", "Settings"], note: "Prototype of the SAPAT app. Tap through it like a phone.",
      hi: ["Good morning", "Good noon", "Good afternoon", "Good evening"],
      homeAll: "Everyone ate well today!", homeSome: (n, t) => `${n} of ${t} have eaten enough so far.`, homeNone: "Let's start logging today's meals.",
      tapOne: "Tap someone to see what they ate.", add: "Add", example: "This is an example day.", clear: "Clear", cleared: "Example cleared",
      none: "Nothing logged yet", allOk: "Enough for today", shortOn: "Low on", and: "and",
      st: { ok: "Enough", mid: "A bit low", low: "Low", over: "Too much", none: "Not yet" },
      yrs: "yrs", preg: "pregnant", lact: "breastfeeding", female: "Female", male: "Male",
      kcalLeft: "kcal to go", kcalOver: "kcal over", spent: "spent today", energy: "Energy",
      prot: "Protein", carb: "Carbs", fat: "Fat", vits: "Vitamins and fiber", fiber: "Fiber", iron: "Iron", vitA: "Vitamin A", vitC: "Vitamin C", calcium: "Calcium",
      tipLow: (n) => `Low on ${n}?`, tipAdds: (p, c) => `+${p}% of need · ${c}`,
      meals: ["Breakfast", "Lunch", "Snack", "Dinner"], mealEmpty: "Nothing yet", addTo: (m) => `Add to ${m}`, addFood: "Add food",
      search: "Search: rice, egg, tilapia…", groups: { all: "All", plan: "On your list", cereals: "Rice & corn", fish: "Fish", meat: "Meat", eggs: "Eggs", pulses: "Beans & nuts", vegetables: "Vegetables", fruits: "Fruits", roots: "Root crops", condiments: "Spices", sugar: "Sugar" },
      listTag: "On list", notFound: "Nothing found. Try another word.", added: (n) => `Added: ${n}`, removed: (n) => `Removed: ${n}`, undo: "Undo",
      pv: ["kcal", "protein", "fiber", "price"],
      perWeek: "per week", perDay: "per day", presets: ["Tight", "Moderate", "Roomier"],
      enough: "Your budget covers a healthy diet.", notEnough: (s) => `${s} short each week for a healthy diet.`,
      yours: "Your budget", healthy: "Healthy diet", bestList: "The list below is the most nutritious your budget can buy.",
      trendH: "Cost of a healthy day", perPerson: "per person a day", vsYear: "vs last year",
      lv: { normal: "Steady", watch: "Watch", alert: "Alert" },
      situH: (r) => `How families are doing in ${r}`, s1: "of income goes to food", s2: "spend less than the food threshold", s3: "of food spending is rice and corn", s4: "of families are poor",
      in10: "in 10", fies: "PSA FIES 2023 and 2023 poverty statistics", buyH: "Shopping list this week", cookH: "Home-cooked ideas", noPlan: "Couldn't make a plan. Try another budget.",
      whereH: "Where do you shop?", lvName: { region: "Region", province: "Province", city: "City or town", market: "Market" },
      wholeRegion: "Whole region", anyCity: "Any town", anyMarket: "Any market", pick: "Search",
      noCityPrice: "No prices for this town yet. Using province or region prices for now.",
      noMarketPrice: "No market prices yet. Using city, province or region prices for now.",
      hasCityPrice: "PSA publishes prices for this city.", noPriceYet: "No prices yet", hasPrice: "Has PSA prices",
      publicMarket: (c) => `${c} public market`, otherMarket: "Another market", marketName: "Market name", save: "Save",
      usedFrom: "Where prices come from", lvW: { yours: "yours", market: "market", city: "city", province: "province", region: "region" },
      sulitH: "Best value this month", priceH: "This month's prices", resetMine: "Go back to official prices", searchPrice: "Search food",
      howMuch: "How much did you pay per kilo?", now: "Now", useOfficial: "Use the official price", saved: "Price saved",
      lvl: { yours: "Yours", market: "Market", city: "City", province: "Province", region: "Region" },
      famH: "Household", addM: "Add someone", halal: "No pork (halal)", halalS: "Leave pork off the list",
      langH: "Language", langS: "Tagalog or English", theme: "Dark look", themeS: "Easier at night", dataH: "Where the data comes from",
      src: ["Prices: PSA OpenSTAT, by region, province and some cities", "Nutrients: DOST-FNRI PhilFCT", "Needs: PDRI 2015 (FNRI)", "Meal-planning help only, not medical advice."],
      name: "Name", age: "Age", status: ["None", "Pregnant", "Breastfeeding"], done: "Done", remove: "Remove", newM: "New",
      persona: ["Baby, 34, pregnant", "Mother of three in Leyte. Prepaid Android phone. About ₱1,300 a week for food."],
      back: "Back", close: "Close", light: "Light or dark", diet: "Diet", dietNo: "Not eaten", 
    },
  };
  const TL = { rice_rm: "Bigas (regular)", rice_wm: "Bigas (well-milled)", corn_w: "Mais (puti)", corn_y: "Mais (dilaw)", potato: "Patatas", camote: "Kamote", gabi: "Gabi", monggo: "Monggo", peanut: "Mani", peanut_us: "Mani (may balat)", beef: "Baka", beef_b: "Baka (may buto)", pork_kasim: "Baboy (kasim)", pork_liempo: "Liempo", pork_b: "Baboy (may buto)", pork_pata: "Pata ng baboy", chicken: "Manok", egg: "Itlog", egg_duck: "Itlog ng pato", galunggong: "Galunggong", tilapia: "Tilapia", bangus: "Bangus", tulingan: "Tulingan", aloy: "Aloy", hasahasa: "Hasa-hasa", sapsap: "Sapsap", bisugo: "Bisugo", dalagang: "Dalagang-bukid", suahe: "Hipon (suahe)", sugpo: "Sugpo", alimango: "Alimango", sitaw: "Sitaw", baguio: "Baguio beans", talong: "Talong", tomato: "Kamatis", ampalaya: "Ampalaya", sayote: "Sayote", upo: "Upo", kalabasa: "Kalabasa", repolyo: "Repolyo", pechay_c: "Petsay Baguio", pechay_n: "Petsay Tagalog", talbos: "Talbos ng kamote", kangkong: "Kangkong", carrot: "Karot", garlic_n: "Bawang (lokal)", garlic_i: "Bawang (imported)", onion: "Sibuyas", ginger: "Luya", lakatan: "Saging lakatan", latundan: "Saging latundan", saba: "Saging saba", mango: "Mangga (kalabaw)", mango_p: "Mangga (piko)", papaya: "Papaya", pinya: "Pinya", dalandan: "Dalandan", calamansi: "Kalamansi", coconut: "Niyog", sugar_w: "Asukal (puti)", sugar_b: "Asukal (pula)" };
  let FBY = {};
  // Tagalog names in Tagalog mode, English names in English mode (EN). gloss() gives the other language's name, for a hint.
  const fname = (k, lang) => (lang === "en" && EN[k]) || TL[k] || (FBY[k] || {}).name || k;
  const EN = { rice_rm: "Rice (regular-milled)", rice_wm: "Rice (well-milled)", corn_w: "Corn grits (white)", corn_y: "Corn grits (yellow)", potato: "Potato", camote: "Sweet potato", gabi: "Taro", monggo: "Mung beans", peanut: "Peanuts", peanut_us: "Peanuts (in shell)", beef: "Beef", beef_b: "Beef (with bones)", pork_kasim: "Pork (shoulder)", pork_liempo: "Pork belly", pork_b: "Pork (with bones)", pork_pata: "Pork leg", chicken: "Chicken", egg: "Egg", egg_duck: "Duck egg", galunggong: "Round scad", tilapia: "Tilapia", bangus: "Milkfish", tulingan: "Tuna (tulingan)", aloy: "Tuna (aloy)", hasahasa: "Short mackerel", sapsap: "Ponyfish", bisugo: "Threadfin bream", dalagang: "Fusilier", suahe: "Shrimp (small)", sugpo: "Tiger prawn", alimango: "Mud crab", sitaw: "String beans", baguio: "Green beans", talong: "Eggplant", tomato: "Tomato", ampalaya: "Bitter gourd", sayote: "Chayote", upo: "Bottle gourd", kalabasa: "Squash", repolyo: "Cabbage", pechay_c: "Chinese cabbage", pechay_n: "Bok choy", talbos: "Sweet potato tops", kangkong: "Water spinach", carrot: "Carrot", garlic_n: "Garlic (local)", garlic_i: "Garlic (imported)", onion: "Red onion", ginger: "Ginger", lakatan: "Banana (lakatan)", latundan: "Banana (latundan)", saba: "Cooking banana (saba)", mango: "Mango (carabao)", mango_p: "Mango (piko)", papaya: "Papaya", pinya: "Pineapple", dalandan: "Native orange (dalandan)", calamansi: "Calamansi", coconut: "Coconut", sugar_w: "Sugar (white)", sugar_b: "Sugar (brown)" };
  const gloss = (k, lang) => (lang === "en" ? TL[k] || "" : EN[k] || "");

  // How each food is bought and used at home: [Tagalog label, English label, grams as purchased].
  // The first unit is how it is sold; the second helps make sense of the price in the kitchen. "mga" counts are approximate.
  const PCS = { galunggong: 10, tilapia: 4, bangus: 3, tulingan: 5, aloy: 5, hasahasa: 8, sapsap: 12, bisugo: 8, dalagang: 5, talong: 6, ampalaya: 4, sayote: 3, carrot: 8, tomato: 10, onion: 10, potato: 6, camote: 4, gabi: 6, lakatan: 8, latundan: 10, saba: 7, mango: 3, mango_p: 4, dalandan: 6 };
  const TALI = ["kangkong", "talbos", "pechay_n", "sitaw"];
  function buyUnits(f) {
    const k = f.key, g = f.group;
    if (f.unit === "pc") return k === "coconut" ? [["piraso", "piece", f.grams_per_unit], ["¼ tasang gata", "¼ cup coconut milk", 60]] : [["piraso", "piece", f.grams_per_unit], ["dosena", "dozen", f.grams_per_unit * 12]];
    if (g === "cereals") return [["kilo", "kilo", 1000], ["tasang kanin (luto)", "cup of cooked rice", 56]];
    if (k === "monggo") return [["¼ kilo", "¼ kilo", 250], ["tasang luto", "cup cooked", 60]];
    if (g === "pulses") return [["¼ kilo", "¼ kilo", 250], ["dakot", "handful", 30]];
    if (TALI.includes(k)) return [["tali (mga 250 g)", "bundle (about 250 g)", 250], ["kilo", "kilo", 1000]];
    if (k === "garlic_n" || k === "garlic_i") return [["ulo (mga 40 g)", "bulb (about 40 g)", 40], ["kilo", "kilo", 1000]];
    if (k === "ginger") return [["piraso (mga 50 g)", "piece (about 50 g)", 50], ["kilo", "kilo", 1000]];
    if (k === "calamansi") return [["¼ kilo", "¼ kilo", 250], ["kilo", "kilo", 1000]];
    if (k === "papaya" || k === "pinya") return [["piraso (mga 1 kilo)", "piece (about 1 kilo)", 1000], ["hiwa", "slice", 150]];
    if (g === "sugar") return [["¼ kilo", "¼ kilo", 250], ["kutsara", "tablespoon", 12]];
    if (PCS[k]) return [["kilo", "kilo", 1000], [`piraso (mga ${PCS[k]} sa isang kilo)`, `piece (about ${PCS[k]} per kilo)`, 1000 / PCS[k]]];
    return [["kilo", "kilo", 1000], ["¼ kilo", "¼ kilo", 250]];
  }
  const ul = (u, lang) => (lang === "en" ? u[1] : u[0]);
  // a week's need rounded up to what a stall actually sells: whole pieces, bundles, or quarter kilos
  function buyQty(f, gramsWeek) {
    const [u] = buyUnits(f); const k = f.key;
    if (f.unit === "pc" || TALI.includes(k) || k === "garlic_n" || k === "garlic_i" || k === "ginger" || k === "papaya" || k === "pinya") { const n = Math.max(1, Math.ceil(gramsWeek / u[2] - 0.15)); return { n, unit: u, grams: n * u[2] }; }
    const q = Math.max(0.25, Math.ceil(gramsWeek / 250 - 0.15) / 4); return { n: q, unit: ["kilo", "kilo", 1000], grams: q * 1000 };
  }
  const fracKg = (q) => { const w = Math.floor(q), r = q - w, fr = r > 0.7 ? "¾" : r > 0.4 ? "½" : r > 0.1 ? "¼" : ""; return (w ? String(w) : "") + fr || "0"; };
  function buyLabel(f, b, lang) {
    if (b.unit[0] === "kilo") { const pcs = PCS[f.key]; return `${fracKg(b.n)} kilo${pcs ? (lang === "en" ? ` (about ${Math.round(b.n * pcs)} pcs)` : ` (mga ${Math.round(b.n * pcs)} piraso)`) : ""}`; }
    const base = ul(b.unit, lang).replace(/ \(.*\)$/, ""); return `${b.n} ${base}`;
  }

  // ---------------------------------------------------------------- icons
  const IP = {
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>', grow: '<path d="M12 20V5M6.5 10.5 12 5l5.5 5.5M5 20h14"/>',
    drop: '<path d="M12 3c3 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 3-6.5 6-11z"/>', eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    bone: '<circle cx="5.5" cy="9" r="2"/><circle cx="5.5" cy="15" r="2"/><circle cx="18.5" cy="9" r="2"/><circle cx="18.5" cy="15" r="2"/><path d="M7.3 10.2h9.4M7.3 13.8h9.4"/>',
    citrus: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18"/>', fiber: '<path d="M4 18c4-1 6-5 8-9s4-6 8-6"/><path d="M4 12c3 0 5-2 6-5M10 21c3-2 5-5 6-9"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 13.8c2.5.2 4 1.9 4.5 4.7"/>',
    wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7z"/><path d="M4 7V6a2 2 0 0 1 2-2h10v3M15.5 13.5h.1"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8" r="1.5"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    back: '<path d="M15 5 8 12l7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>', pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    flame: '<path d="M12 21c-4 0-6.5-2.7-6.5-6.3 0-4 3.5-5.5 4-9.7 2.8 1.6 4 4 4 6 1-.6 1.7-1.7 2-3 1.5 1.6 3 4 3 6.7 0 3.6-2.5 6.3-6.5 6.3z"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="2.6"/><path d="M3 7v4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7"/><path d="M9 13.6v3.8c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4c0-1.4-2.7-2.6-6-2.6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', down: '<path d="M12 5v13M6 12l6 6 6-6"/>', up: '<path d="M12 19V6M6 12l6-6 6 6"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', cup: '<path d="M5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M9 3.5c0 1 1 1.5 1 2.5M13 3.5c0 1 1 1.5 1 2.5"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c1-1.5 2.5-2 4-2s3 .5 4 2"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
    pot: '<path d="M4 10h16v5.5A4.5 4.5 0 0 1 15.5 20h-7A4.5 4.5 0 0 1 4 15.5V10z"/><path d="M2 10h20M9 6.5c0-1.2 1.2-2 3-2s3 .8 3 2"/>',
    list: '<path d="M3 9.5h18l-2 9.5H5L3 9.5z"/><path d="M7.5 9.5 12 4l4.5 5.5"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
    store: '<path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16v1a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0 2.7 2.7 0 0 1-5.3 0zM5.5 13v7h13v-7M10 20v-4h4v4"/>',
    city: '<path d="M3 21V9l6-3v15M9 21V4l8 3v14M17 21v-9l4 2v7M2 21h20"/>', map: '<path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5L9 4z"/><path d="M9 4v13.5M15 6.5V20"/>',
    shield: '<path d="M12 3l7 3v5c0 5-3 8.2-7 10-4-1.8-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>', warn: '<path d="M12 4 2.5 20h19L12 4z"/><path d="M12 10v4.5M12 17.2v.1"/>',
    db: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>',
    signal: '<path d="M4 20v-3M9 20v-7M14 20v-11M19 20V4"/>', wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M6 12.5a9 9 0 0 1 12 0M9.5 16a4 4 0 0 1 5 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
    batt: '<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M21.5 10.5v3"/><rect x="4.5" y="9" width="10" height="6" rx="1" fill="currentColor" stroke="none"/>',
    siren: '<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 18h14v3H5zM12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>', pause: '<path d="M7 5v14M17 5v14" stroke-width="3"/>',
    rice: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M7 11c.4-2.2 2.2-3.5 5-3.5s4.6 1.3 5 3.5"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M7 15l4-4 3 3 5-6"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8.5 11.5h.1M12 11.5h.1M15.5 11.5h.1M8.5 15h.1M12 15h.1M15.5 15h.1M8.5 18h.1M12 18h3.5"/>', egg: '<path d="M12 3c-3.6 0-6.5 5.2-6.5 10a6.5 6.5 0 0 0 13 0C18.5 8.2 15.6 3 12 3z"/>', meat: '<path d="M15 4a6 6 0 0 1 4 10l-4 4-7-7 4-4a6 6 0 0 1 3-3z"/><path d="M8 11l-3 3"/><circle cx="4.5" cy="17.5" r="2"/><circle cx="7" cy="20" r="2"/>', fish: '<path d="M3 12c3-5 9-6 13-3l4-3v12l-4-3c-4 3-10 2-13-3z"/><circle cx="7.5" cy="11" r="1"/>', leaf: '<path d="M5 19c0-9 5-14 14-14 0 8-5 14-14 14z"/><path d="M5 19 13 11"/>', swap: '<path d="M7 7h12l-3.5-3.5M17 17H5l3.5 3.5"/>', home: '<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  };
  const icon = (n, cls) => `<svg class="i${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${IP[n] || ""}</svg>`;

  const PIC = {
    cereals: ['#FFF4D6', '<path d="M6 30h36a18 13 0 0 1-36 0z" fill="#E8A23A"/><ellipse cx="24" cy="29" rx="16" ry="5.5" fill="#FFFFFF"/><g fill="#F3EEDF"><ellipse cx="18" cy="26" rx="2.2" ry="1.2"/><ellipse cx="24" cy="24.5" rx="2.2" ry="1.2"/><ellipse cx="30" cy="26" rx="2.2" ry="1.2"/><ellipse cx="21" cy="28" rx="2.2" ry="1.2"/><ellipse cx="27" cy="28.5" rx="2.2" ry="1.2"/></g><path d="M18 21c0-3 2-3 2-6M25 20c0-3 2-3 2-6" stroke="#C9B48A" stroke-width="2" stroke-linecap="round" fill="none"/>'],
    fish: ['#DDEFF7', '<path d="M7 24c5-8 15-10 22-5l6-5v20l-6-5c-7 5-17 3-22-5z" fill="#4A90B8"/><path d="M14 22c4-3 9-3 12 0" stroke="#A9D3EA" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="13.5" cy="22.5" r="1.8" fill="#13324A"/>'],
    meat: ['#FBE3DC', '<path d="M27 8a10 10 0 0 1 7 17l-6 6-11-11 6-6a10 10 0 0 1 4-6z" fill="#C8553D"/><path d="M27 12a6 6 0 0 1 4 10" stroke="#E98C76" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M17 20l-6 6" stroke="#F1E3D3" stroke-width="4" stroke-linecap="round"/><circle cx="9" cy="31" r="3.2" fill="#F1E3D3"/><circle cx="13" cy="35" r="3.2" fill="#F1E3D3"/>'],
    eggs: ['#FFF4D6', '<path d="M24 7c-6.5 0-11.5 9-11.5 17a11.5 11.5 0 0 0 23 0C35.5 16 30.5 7 24 7z" fill="#FFFFFF" stroke="#E5D7B8" stroke-width="1.5"/><circle cx="24" cy="26" r="6" fill="#F2B233"/>'],
    pulses: ['#E4F1DD', '<g fill="#5E9B3C"><ellipse cx="17" cy="20" rx="5" ry="3.6" transform="rotate(-25 17 20)"/><ellipse cx="28" cy="17" rx="5" ry="3.6" transform="rotate(20 28 17)"/><ellipse cx="22" cy="28" rx="5" ry="3.6" transform="rotate(10 22 28)"/><ellipse cx="32" cy="28" rx="5" ry="3.6" transform="rotate(-30 32 28)"/><ellipse cx="14" cy="31" rx="5" ry="3.6" transform="rotate(30 14 31)"/></g>'],
    vegetables: ['#DCEFE0', '<path d="M10 38c0-17 10-27 28-27 0 16-10 27-28 27z" fill="#2F8A4E"/><path d="M10 38 30 18M18 30v-7M24 24h7" stroke="#A8DDB6" stroke-width="2.2" stroke-linecap="round" fill="none"/>'],
    roots: ['#F6E2D3', '<path d="M12 33c-5-7 2-19 13-21 8-1.6 12 4.4 8.5 12.2C30 32 18 39.5 12 33z" fill="#B0582E"/><path d="M12 33l-5 5" stroke="#B0582E" stroke-width="3" stroke-linecap="round"/><path d="M20 19l2 2M26 24l2 2M18 27l2 1" stroke="#E7A07A" stroke-width="2" stroke-linecap="round"/>'],
    fruits: ['#FFF1C9', '<path d="M10 14c4 14 14 20 28 18-3 5-10 8-17 6C12 35 6 24 10 14z" fill="#F2C230"/><path d="M10 14c-1-2 0-4 2-4" stroke="#6B5523" stroke-width="2.5" stroke-linecap="round" fill="none"/>'],
    condiments: ['#F3EEE6', '<path d="M24 9c-2 4-10 7-10 15a10 10 0 0 0 20 0c0-8-8-11-10-15z" fill="#F7F1E6" stroke="#CDBFA6" stroke-width="1.5"/><path d="M19.5 20c0 5 1.8 9 4.5 11M28.5 20c0 5-1.8 9-4.5 11" stroke="#CDBFA6" stroke-width="1.5" fill="none"/><path d="M24 9c0-2 1-3.5 3-4" stroke="#7A9A5A" stroke-width="2" stroke-linecap="round"/>'],
    sugar: ['#EFEDF6', '<path d="M10 17l14-7 14 7v14l-14 7-14-7z" fill="#FFFFFF" stroke="#BDB7D4" stroke-width="1.5"/><path d="M10 17l14 7 14-7M24 24v14" stroke="#BDB7D4" stroke-width="1.5" fill="none"/>'],
  };
  const pic = (group, size) => { const [bg, art] = PIC[group] || PIC.vegetables; return `<span class="pic${size ? " " + size : ""}" style="--tile:${bg}" aria-hidden="true"><svg viewBox="0 0 48 48">${art}</svg></span>`; };

  function figure(m, ring, lg) {
    const a = +m.age, F = m.sex === "F", skin = "#C68A5E", hair = a >= 60 ? "#B9B9B9" : "#2B1E16";
    let head, body, extra = "";
    if (a < 5) { head = [24, 25, 8.5]; body = "M13 48c0-8 4.5-12 11-12s11 4 11 12z"; }
    else if (a < 13) { head = [24, 21, 7.5]; body = "M11 48c0-10 5-15 13-15s13 5 13 15z"; }
    else { head = [24, 17, 7.5]; body = "M7 48c0-13 7-19 17-19s17 6 17 19z"; }
    const [hx, hy, hr] = head;
    const shirt = a < 5 ? "#8FC1E3" : F ? (a < 13 ? "#E07A9B" : "#D9694F") : (a < 13 ? "#5BA35B" : "#3E7CB1");
    const hairBack = F && a >= 5 ? `<rect x="${hx - hr - 1.8}" y="${hy - hr - 1.2}" width="${2 * hr + 3.6}" height="${2 * hr + (a < 13 ? 3 : 10)}" rx="${hr + 1.8}" fill="${hair}"/>` : "";
    const hairTop = `<path d="M${hx - hr - 0.3} ${hy - 0.5}A${hr + 0.3} ${hr + 0.3} 0 0 1 ${hx + hr + 0.3} ${hy - 0.5}Q${hx + 2} ${hy - hr + 3} ${hx - hr - 0.3} ${hy - 0.5}z" fill="${hair}"/>`;
    if (m.status === "pregnant") extra = `<ellipse cx="27" cy="41" rx="9" ry="7" fill="${shirt}"/><ellipse cx="29" cy="39" rx="4" ry="3" fill="#FFFFFF" opacity=".25"/>`;
    if (a < 13 && F && a >= 5) extra += `<circle cx="${hx - hr - 1}" cy="${hy - 2}" r="2.6" fill="${hair}"/><circle cx="${hx + hr + 1}" cy="${hy - 2}" r="2.6" fill="${hair}"/>`;
    const cheeks = `<circle cx="${hx - 4.2}" cy="${hy + 2.6}" r="1.4" fill="#E98C76" opacity=".55"/><circle cx="${hx + 4.2}" cy="${hy + 2.6}" r="1.4" fill="#E98C76" opacity=".55"/>`;
    const svg = `<svg viewBox="0 0 48 48" aria-hidden="true">${hairBack}<path d="${body}" fill="${shirt}"/>${extra}<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${skin}"/>${hairTop}${cheeks}<circle cx="${hx - 2.6}" cy="${hy + 0.8}" r="0.95" fill="#2B1E16"/><circle cx="${hx + 2.6}" cy="${hy + 0.8}" r="0.95" fill="#2B1E16"/><path d="M${hx - 2} ${hy + 3.4}q2 1.8 4 0" stroke="#2B1E16" stroke-width="1" fill="none" stroke-linecap="round"/></svg>`;
    const badge = m.status === "pregnant" ? icon("heart") : m.status === "lactating" ? icon("drop") : "";
    return `<span class="figwrap"><span class="fig${lg ? " lg" : ""}" style="--ring:${ring || "var(--line)"}">${svg}</span>${badge ? `<span class="badge">${badge}</span>` : ""}</span>`;
  }

  // ---------------------------------------------------------------- nutrition
  const NUTS = ["energy_kcal", "protein_g", "carb_g", "fat_g", "fiber_g", "iron_mg", "vit_a_ug", "vit_c_mg", "calcium_mg"];
  const SUMN = [["energy_kcal", "energy"], ["protein_g", "prot"], ["iron_mg", "iron"], ["vit_a_ug", "vitA"], ["vit_c_mg", "vitC"], ["calcium_mg", "calcium"]];
  function foods(D, X) { const out = D.foods.map((f) => { const x = (X && X.foods[f.key]) || [0, 0, 0, 0]; return Object.assign({}, f, { fat_g: x[0] || 0, carb_g: x[1] || 0, fiber_g: x[2] || 0, vit_c_mg: x[3] || 0 }); }); FBY = {}; out.forEach((f) => (FBY[f.key] = f)); return out; }
  // PDRI 2015 (rev. 2018): fiber ranges, vitamin C RNI, acceptable macronutrient distribution ranges
  const FIBER = [[2, [6, 7]], [5, [8, 10]], [9, [11, 14]], [12, [15, 17]], [15, [18, 20]], [18, [21, 23]], [200, [20, 25]]];
  const VITC = [[12, 45, 45], [15, 60, 55], [18, 70, 60], [200, 70, 60]];
  function targets(S, m) {
    const n = S.memberNeeds(m), v = n.values, age = +m.age;
    const fib = FIBER.find(([a]) => age <= a)[1];
    const vc = VITC.find(([a]) => age <= a); let c = m.sex === "M" ? vc[1] : vc[2];
    if (m.status === "pregnant") c += 10; if (m.status === "lactating") c += 35;
    const fatPct = age <= 2 ? [25, 35] : [15, 30], carbPct = age <= 2 ? [50, 69] : age <= 18 ? [55, 79] : [55, 75];
    const E = v.energy_kcal;
    return { energy_kcal: E, protein_g: v.protein_g, iron_mg: v.iron_mg, vit_a_ug: v.vit_a_ug, calcium_mg: v.calcium_mg, vit_c_mg: c,
      fiber_g: fib[0], fat_range: fatPct.map((p) => E * p / 900), carb_range: carbPct.map((p) => E * p / 400), fat_g: E * fatPct[0] / 900, carb_g: E * carbPct[0] / 400, stage: n.stage, priority: n.priority };
  }
  const stat = (r) => (r >= 0.9 ? "ok" : r >= 0.6 ? "mid" : "low");
  const SWI = { ok: "check", mid: "minus", low: "down", over: "up", none: "minus" };
  const word = (s, tt) => `<span class="word ${s}">${icon(SWI[s])}${tt.st[s]}</span>`;
  const ringCol = (r) => (r >= 0.85 ? "var(--good)" : r >= 0.6 ? "var(--sun)" : "var(--bad)");

  // household portions in grams as bought: [amount, unit, note, grams]
  const U = { tl: { cup: "tasa", pc: "piraso", slice: "hiwa", fish: "isda", hand: "dakot", tsp: "kutsarita", tbsp: "kutsara", cooked: "luto", raw: "hilaw", rice: "kanin", porridge: "lugaw", match: "laki ng posporo", milk: "gata", whole: "buo", small: "maliit", med: "katamtaman" },
    en: { cup: "cup", pc: "piece", slice: "slice", fish: "fish", hand: "handful", tsp: "tsp", tbsp: "tbsp", cooked: "cooked", raw: "raw", rice: "cooked rice", porridge: "porridge", match: "matchbox size", milk: "coconut milk", whole: "whole", small: "small", med: "medium" } };
  const ep = (f) => (f.ep_pct || 100) / 100;
  function portions(f) {
    const g = f.group, k = f.key, E = (e) => Math.round(e / ep(f));
    if (g === "cereals") return [["½", "cup", "rice", 28], ["1", "cup", "rice", 56], ["1½", "cup", "rice", 84], ["2", "cup", "rice", 112]];
    if (g === "eggs") return [["1", "pc", "", f.grams_per_unit], ["2", "pc", "", f.grams_per_unit * 2]];
    if (g === "fish") return [["½", "fish", "small", E(35)], ["1", "fish", "med", E(70)], ["2", "fish", "med", E(140)]];
    if (g === "meat") return [["1", "slice", "match", E(30)], ["2", "slice", "", E(60)], ["3", "slice", "", E(90)]];
    if (g === "pulses") return k === "monggo" ? [["½", "cup", "cooked", 30], ["1", "cup", "cooked", 60]] : [["1", "hand", "", E(30)], ["2", "hand", "", E(60)]];
    if (g === "vegetables") return [["½", "cup", "cooked", E(45)], ["1", "cup", "cooked", E(90)], ["1", "cup", "raw", E(45)]];
    if (g === "roots") return [["½", "pc", "", E(75)], ["1", "pc", "med", E(150)]];
    if (g === "condiments" || g === "sugar") return [["1", "tsp", "", 5], ["1", "tbsp", "", g === "sugar" ? 12 : 15]];
    if (k === "calamansi") return [["3", "pc", "", 30], ["6", "pc", "", 60]];
    if (k === "coconut") return [["¼", "cup", "milk", 60], ["½", "cup", "milk", 120]];
    if (["lakatan", "latundan", "saba"].includes(k)) return [["1", "pc", "", E(70)], ["2", "pc", "", E(140)]];
    return [["1", "slice", "", E(80)], ["2", "slice", "", E(160)], ["1", "pc", "whole", E(200)]];
  }
  const plabel = (p, lang) => { const u = U[lang] || U.tl; return `${p[0]} ${u[p[1]] || p[1]}${p[2] ? " " + (u[p[2]] || p[2]) : ""}`; };
  const pshort = (p, lang) => { const u = U[lang] || U.tl; return `${p[0]} ${u[p[1]] || p[1]}`; };
  const qty = (r, lang) => r.unit === "pcs" ? `${r.qty} ${U[lang].pc}` : r.qty < 1 ? `${Math.max(50, Math.round(r.qty * 1000 / 50) * 50)} g` : `${String(Math.round(r.qty * 4) / 4).replace(".25", "¼").replace(".5", "½").replace(".75", "¾")} kg`;
  function ulam(S, plan, lang) {
    const tot = plan.foods.map((f, j) => ({ key: f.key, name: f.name, group: f.group, grams: plan.grams.reduce((a, g) => a + g[j], 0) }));
    const prot = tot.filter((x) => ["fish", "meat", "eggs", "pulses"].includes(x.group) && x.grams * 7 >= 150).sort((a, b) => b.grams - a.grams).slice(0, 3);
    const veg = tot.filter((x) => x.group === "vegetables" && x.grams > 0).sort((a, b) => b.grams - a.grams);
    return prot.map((p, k) => { const v = veg.length ? [veg[(k * 2) % veg.length], veg[(k * 2 + 1) % veg.length]] : []; let n = S.dishName([p, ...v.filter(Boolean)]); if (lang === "tl") n = n.replace(" with ", " na may ").replace(" and ", " at "); return [p.group, n]; });
  }
  const EXAMPLE_FAMILY = [
    { name: "Jun", age: 38, sex: "M", status: "none" }, { name: "Baby", age: 34, sex: "F", status: "pregnant" },
    { name: "Mika", age: 8, sex: "F", status: "none" }, { name: "Paolo", age: 4, sex: "M", status: "none" }, { name: "Ana", age: 1, sex: "F", status: "none" },
  ];
  const monthName = (m, lang) => { const [y, mo] = m.split("-"); return new Date(+y, +mo - 1, 1).toLocaleDateString(lang === "tl" ? "fil-PH" : "en-PH", { month: "short", year: "numeric" }); };

  // ---------------------------------------------------------------- places: region → province → city/town → market
  const regionName = (D, k) => { const n = (D.regions.find((r) => r.key === k) || {}).name || k; return n.replace(/^[IVX]+(-[AB])?\s/, ""); };
  function place(PL, loc) {
    const R = PL[loc.region] || { provinces: [] };
    const prov = R.provinces.find((p) => p.name === loc.prov) || null;
    const cities = loc.region === "NCR" ? (R.cities || []) : (prov ? prov.cities : []);
    const city = cities.find((c) => c.name === loc.city) || null;
    return { prov, city, cities, provPsa: prov ? prov.psa : null, cityPsa: city ? city.psa : null };
  }
  function placeOptions(D, PL, loc, lv, tt) {
    const p = place(PL, loc);
    if (lv === "region") return { opts: D.regions.filter((r) => r.key !== "PH").map((r) => ({ v: r.key, l: regionName(D, r.key) })), cur: loc.region, all: null };
    if (lv === "province") return { opts: (PL[loc.region] || { provinces: [] }).provinces.map((x) => ({ v: x.name, l: x.name, ok: !!x.psa })), cur: loc.prov, all: tt.wholeRegion };
    if (lv === "city") return { opts: p.cities.map((c) => ({ v: c.name, l: c.name, ok: !!c.psa })), cur: loc.city, all: tt.anyCity };
    const opts = [{ v: "@public", l: marketLabel(D, Object.assign({}, loc, { market: "@public" }), tt), ok: false }];
    if (loc.market && loc.market !== "@public") opts.push({ v: loc.market, l: loc.market, ok: false });
    return { opts, cur: loc.market, all: tt.anyMarket };
  }
  function marketLabel(D, loc, tt) {
    if (loc.market !== "@public") return loc.market;
    return tt.publicMarket((loc.city || loc.prov || regionName(D, loc.region)).replace(/^City of /, "").replace(/ City$/, ""));
  }
  function setPlace(loc, lv, v) {
    const l = Object.assign({}, loc);
    if (lv === "region") return { region: v || loc.region, prov: null, city: null, market: null };
    if (lv === "province") { l.prov = v; l.city = null; l.market = null; }
    if (lv === "city") { l.city = v; l.market = null; }
    if (lv === "market") l.market = v;
    return l;
  }
  function placeNote(loc, p, tt) {
    if (loc.market) return ["no", tt.noMarketPrice];
    if (loc.city && !p.cityPsa) return ["no", tt.noCityPrice];
    if (loc.city && p.cityPsa) return ["ok", tt.hasCityPrice];
    return null;
  }
  const LV = ["yours", "market", "city", "province", "region"];
  const LVC = { yours: "var(--sun)", market: "var(--leaf)", city: "var(--leaf)", province: "color-mix(in srgb, var(--leaf) 45%, var(--surface))", region: "var(--ghost)" };
  function mixBar(list, tt) {
    const n = {}; LV.forEach((l) => (n[l] = 0)); list.forEach((f) => n[f.level]++);
    const tot = list.length || 1;
    return `<div style="display:grid;gap:8px"><div class="mixbar" role="img" aria-label="${tt.usedFrom}">${LV.filter((l) => n[l]).map((l) => `<i style="width:${n[l] / tot * 100}%;background:${LVC[l]}"></i>`).join("")}</div>
      <div class="mixkey">${LV.filter((l) => n[l]).map((l) => `<span><i style="background:${LVC[l]}"></i><b>${n[l]}</b> ${tt.lvW[l]}</span>`).join("")}</div></div>`;
  }


  // ---------------------------------------------------------------- diets: what each member eats (applied per member in the planner)
  const DIETS = [
    { k: "regular", icon: "bowl", tl: "Karaniwan", en: "Regular", tlS: "Lahat ng pagkain", enS: "Eats everything", ex: () => false },
    { k: "nopork", icon: "heart", tl: "Walang baboy", en: "No pork", tlS: "Halal", enS: "Halal", ex: (f) => f.key.startsWith("pork") },
    { k: "pesca", icon: "fish", tl: "Isda, walang karne", en: "Fish, no meat", tlS: "Walang baboy, baka o manok", enS: "No pork, beef or chicken", ex: (f) => f.group === "meat" },
    { k: "veg", icon: "leaf", tl: "Gulay at itlog", en: "Vegetarian", tlS: "Walang karne at isda; may itlog", enS: "No meat or fish; eggs are fine", ex: (f) => f.group === "meat" || f.group === "fish" },
    { k: "lowsugar", icon: "drop", tl: "Bawas asukal", en: "Low sugar", tlS: "Para sa may diabetes", enS: "For diabetes", ex: (f) => f.group === "sugar" },
  ];
  const dietOf = (m) => DIETS.find((d) => d.k === (m.diet || "regular")) || DIETS[0];
  const dietExclude = (members, foods) => { const o = {}; members.forEach((m, i) => { const d = dietOf(m); o[i] = foods.filter((f) => d.ex(f)).map((f) => f.key); }); return o; };

  root.SAPAT_UI = { esc, fmt, peso, W, TL, fname, gloss, buyUnits, buyQty, buyLabel, ul, PCS, IP, icon, PIC, pic, figure, NUTS, SUMN, foods, targets, stat, SWI, word, ringCol, U, portions, plabel, pshort, qty, ulam, EXAMPLE_FAMILY, monthName, regionName, place, placeOptions, setPlace, placeNote, mixBar, DIETS, dietOf, dietExclude, marketLabel };
})(typeof window !== "undefined" ? window : globalThis);
