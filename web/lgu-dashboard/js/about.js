/* SAPAT LGU dashboard · How it works: problem → feature table and the data note. */
"use strict";

function renderAbout() {
  const PS = [
    ["Families cannot see what an adequate diet costs for their own members at local prices; budgets default to rice.", "users", "Family app", "Live"],
    ["Children under 5 and pregnant or breastfeeding mothers carry the largest nutrient gaps.", "shield", "Protect-first budget mode", "Live"],
    ["LGUs plan with a food threshold updated every two to three years; price shocks are seen late.", "siren", "Monthly price alerts by province", "Live"],
    ["Reports to the nutrition committee are built from screenshots.", "table", "Sortable table, CSV and Excel download, one-page province summary", "Live"],
    ["School and community meal programs plan menus by hand on fixed budgets.", "pot", "Feeding program menus", "Live"],
    ["Healthy choices compete with cheaper, filling staples.", "coins", "Rewards for protein-rich purchases (with 4Ps, Walang Gutom)", "Planned"],
  ];
  $("psTable").innerHTML = `<div class="psh"><span>Problem</span><span>SAPAT feature</span><span>Status</span></div>` +
    PS.map(([p, ic, f, s]) => `<div><span>${p}</span><span class="feat">${icon(ic)}${f}</span><span><span class="pill ${s === "Live" ? "live" : "plan"}">${s === "Live" ? "In prototype" : "Planned"}</span></span></div>`).join("");
  $("aboutData").textContent = `Data bundle generated ${D.generated}: ${D.foods.length} foods, ${REGIONS.length} regions and ${AREAS_PROV.length} provinces, ${monthLong(D.months[0])} to ${monthLong(lastMonth)}.`;
}
