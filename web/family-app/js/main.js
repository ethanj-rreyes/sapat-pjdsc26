/* SAPAT family app · Start-up. Loads last, after every other file.
 * One of several ordered scripts; see js/README.md. */
"use strict";

// ---------------------------------------------------------------- boot
if (!PL[st.loc.region]) st.loc = { region: "R08", prov: "Leyte", city: null, market: null };
document.documentElement.lang = st.lang === "tl" ? "fil" : "en";
drawChrome(); drawNav(); refreshPrices(); solve(); go(VIEWS.includes(st.tab) ? st.tab : "today");
// prototype: the welcome plays every time the app is opened, so judges and demo recordings always see it
st.tab = "today"; go("today"); showWelcome();
