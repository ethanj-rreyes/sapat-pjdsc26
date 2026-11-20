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
