/* SAPAT LGU dashboard · Start-up: wire the tabs, draw the map once, open the saved (or linked) view. */
"use strict";

hydrateIcons();
document.querySelectorAll("nav.tabs button").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
setupTheme();
setupControls();
setupExports();
setupMenu();
renderRules();
renderAbout();
drawMap();
showView((location.hash || "").replace("#", "") || store.get("view", "lgu"));
$("tourBtn").addEventListener("click", startTour);
// prototype: the welcome opens on every load (as in the family app); a link with #nowelcome skips it
if (!/nowelcome/.test(location.hash)) showWelcome();
