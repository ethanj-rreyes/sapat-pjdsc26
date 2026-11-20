/* SAPAT LGU dashboard · Getting the numbers out without screenshots: the table as CSV or Excel (all measures for the areas in
 * view), a printed table, and a one-page summary of one area (printed, or saved as PDF from the print window).
 * The Excel file is written here (a small .xlsx writer, no library), so it works offline and opens without warnings. */
"use strict";

// ---------------------------------------------------------------- the rows every export uses
function exportTable() {
  const m = sit.month, i = MI[m], rows = sortedRows();
  const head = ["Area", "Type", "Region", "Month", "Alert level", "What set the level", "Cost of a healthy day (₱ per person per day)",
    "Change vs past 3 months (%)", "Change vs same month last year (%)", "What the poorest 10% can afford (% of a healthy day)",
    "Rice, regular-milled (₱ per kg)", "Galunggong (₱ per kg)", "Egg, chicken (₱ per piece)", "Monggo (₱ per kg)", "Key food that rose most",
    "People below the food line, 2023 (% of people, regional)", "Families in poverty, 2023 (% of families, regional)", "Price basis", "In one sentence", "What to do"];
  const num = (k, a) => { const M = measureBy(k), v = valOf(M, a, m); return v == null ? null : M.csv(v); };
  const body = rows.map((a) => {
    const lv = lvOf(a, i), d = drivers(a, i, trigger(a, i))[0];
    const fired = lv === 2 ? (trigger(a, i) === "yoy" ? "15% or more above last year" : "10% or more above past 3 months") : lv === 1 ? "5% or more above past 3 months" : lv === 0 ? "below 5%" : "";
    const food = (k) => { const v = a.food(k, i); return v == null ? null : +v.toFixed(2); };
    return [a.name, a.kind === "prov" ? "Province" : "Region", regionName(a.region), monthName(m), lv == null ? "No data" : LEVELS[lv].word, fired,
      num("cost", a), num("chg3", a), num("yoy", a), num("afford", a), food("rice_rm"), food("galunggong"), food("egg"), food("monggo"),
      d ? `${cap(d.f.name)} ${pctSigned(d.chg)}` : "", num("below", a), num("pov", a),
      a.kind === "prov" ? (a.psa ? "Province prices (PSA) where surveyed" : "Regional prices (no province survey)") : "Regional average prices",
      sentence(a, m) + (why(a, m) ? " " + why(a, m) : ""), lv == null ? "" : ACTIONS[lv].short];
  });
  return { head, body, title: `SAPAT price alerts: ${sit.level === "prov" && sit.area !== "PH" ? regionName(sit.area) : sit.level === "prov" ? "all provinces" : "all regions"}${filterNote() ? " (" + filterNote() + ")" : ""}, ${monthLong(m)}` };
}
const fileBase = () => `sapat-price-alerts-${sit.month}-${sit.level === "prov" ? (sit.area === "PH" ? "provinces" : sit.area.toLowerCase()) : "regions"}`;
const NOTES = () => [
  ["SAPAT price alerts"],
  ["Month", monthLong(sit.month)],
  ["Areas", (sit.level === "prov" ? (sit.area === "PH" ? "All provinces" : "Provinces in " + regionName(sit.area)) : "All regions") + (filterNote() ? ", " + filterNote() : "")],
  ["Cost of a healthy day", "Cheapest basket meeting a reference family of five's needs for energy, protein, iron, vitamin A and calcium (PDRI 2015), per person per day, at PSA retail prices."],
  ["Watch", "At least 5% above the average of the 3 months before."],
  ["Alert", "At least 10% above the average of the 3 months before, or at least 15% above the same month last year."],
  ["Back-test", `${monthLong(BACKTEST.from)} to ${monthLong(BACKTEST.to)}: ${BACKTEST.alerts} Alerts across ${BACKTEST.provinces} provinces; ${BACKTEST.falseA} false alarms (cost did not stay 5% higher for the next two months), about 1 per province every ${Math.round(BACKTEST.yearsPerFalse)} years.`],
  ["Sources", "PSA OpenSTAT retail prices; DOST-FNRI PhilFCT and PDRI 2015; PSA FIES 2023; PSA 2023 poverty statistics."],
  ["Note", "SAPAT is planning guidance for programs, not medical advice."],
  ["Downloaded", new Date().toLocaleDateString("en-PH", { day: "numeric", month: "long", year: "numeric" })],
];

// ---------------------------------------------------------------- CSV
function downloadCsv() {
  const t = exportTable(), q = (v) => v == null ? "" : typeof v === "number" ? String(v) : /[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  const csv = "﻿" + [t.head].concat(t.body).map((r) => r.map(q).join(",")).join("\r\n") + "\r\n"; // BOM so Excel reads ₱ correctly
  saveBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), fileBase() + ".csv");
}

// ---------------------------------------------------------------- Excel (.xlsx): two sheets, bold frozen header
function downloadXlsx() {
  const t = exportTable();
  const x = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const col = (n) => { let s = ""; n++; while (n) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
  const cellX = (v, r, c, st) => v == null || v === "" ? "" : typeof v === "number"
    ? `<c r="${col(c)}${r}"${st ? ` s="${st}"` : ""}><v>${v}</v></c>`
    : `<c r="${col(c)}${r}" t="inlineStr"${st ? ` s="${st}"` : ""}><is><t xml:space="preserve">${x(v)}</t></is></c>`;
  const sheet = (rows, widths, freeze) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${freeze ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" xSplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>` : ""}
<cols>${widths.map((w, k) => `<col min="${k + 1}" max="${k + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>
<sheetData>${rows.map((r, k) => `<row r="${k + 1}">${r.map((v, c) => cellX(v, k + 1, c, k === 0 || c === 0 ? 1 : 0)).join("")}</row>`).join("")}</sheetData></worksheet>`;
  const widths = t.head.map((h, k) => (k === 0 ? 24 : k >= 18 ? 60 : Math.min(30, Math.max(12, h.length * 0.55))));
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Areas" sheetId="1" r:id="rId1"/><sheet name="Notes" sheetId="2" r:id="rId2"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    "xl/worksheets/sheet1.xml": sheet([t.head].concat(t.body), widths, true),
    "xl/worksheets/sheet2.xml": sheet(NOTES(), [22, 110], false),
  };
  saveBlob(new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fileBase() + ".xlsx");
}
// a zip file with stored (uncompressed) entries: enough for .xlsx, and tiny
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (let k = 0; k < b.length; k++) c = CRC_T[(c ^ b[k]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zipStore(files) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  Object.entries(files).forEach(([name, text]) => {
    const nb = enc.encode(name), db = enc.encode(text), crc = crc32(db);
    const lh = new DataView(new ArrayBuffer(30));
    [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, 0, 2], [12, 0x21, 2], [14, crc, 4], [18, db.length, 4], [22, db.length, 4], [26, nb.length, 2], [28, 0, 2]]
      .forEach(([o, v, n]) => (n === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true)));
    const ch = new DataView(new ArrayBuffer(46));
    [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, 0, 2], [14, 0x21, 2], [16, crc, 4], [20, db.length, 4], [24, db.length, 4], [28, nb.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]]
      .forEach(([o, v, n]) => (n === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true)));
    parts.push(new Uint8Array(lh.buffer), nb, db); central.push(new Uint8Array(ch.buffer), nb);
    off += 30 + nb.length + db.length;
  });
  const csize = central.reduce((s, p) => s + p.length, 0), end = new DataView(new ArrayBuffer(22)), n = Object.keys(files).length;
  [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, n, 2], [10, n, 2], [12, csize, 4], [16, off, 4], [20, 0, 2]].forEach(([o, v, k]) => (k === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true)));
  const all = parts.concat(central, [new Uint8Array(end.buffer)]), out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
  let p = 0; all.forEach((b) => { out.set(b, p); p += b.length; });
  return out;
}
function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------------------------------------------------------------- printing (the table, or one area on one page)
const today = () => new Date().toLocaleDateString("en-PH", { day: "numeric", month: "long", year: "numeric" });
function doPrint(kind, html) {
  $("printArea").innerHTML = html;
  document.body.dataset.print = kind;
  const done = () => { delete document.body.dataset.print; window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  window.print();
}
function printTable() {
  const m = sit.month, i = MI[m], cols = COLS().map((k) => colDef(k, m)), rows = sortedRows();
  doPrint("table", `<div class="pr">
    <div class="prhead"><span class="wordmark">sapat<span>.</span></span><span>Price alerts for LGU nutrition offices</span><span>Printed ${today()}</span></div>
    <h1>${esc($("ansH").textContent)}</h1><p>${esc($("ansSub").textContent)}</p>
    <table class="prt"><thead><tr>${cols.map((c) => `<th class="${c.txt || c.k === "level" ? "" : "n"}">${esc(c.h)}${c.sub ? `<small>${esc(c.sub)}</small>` : ""}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((a) => `<tr>${cols.map((c) => cell(c, a, i, m)).join("")}</tr>`).join("")}</tbody></table>
    <p class="prnote"><b>Watch:</b> at least 5% above the average of the 3 months before. <b>Alert:</b> at least 10% above it, or at least 15% above the same month last year. Back-tested ${monthName(BACKTEST.from)} to ${monthName(BACKTEST.to)}: about 1 false alert per province every ${Math.round(BACKTEST.yearsPerFalse)} years.</p>
    <p class="prnote">Sources: SAPAT cost of a healthy diet (reference family of five) from PSA retail prices, ${monthLong(m)}; DOST-FNRI PhilFCT; PDRI 2015. SAPAT is planning guidance for programs, not medical advice.</p></div>`);
}
function printSummary(key) {
  const a = areaBy(key), m = sit.month, i = MI[m], lv = lvOf(a, i), c3 = a.vs3[i], y = a.yoy[i];
  const prev3 = i >= 3 ? (a.cond[i - 1] + a.cond[i - 2] + a.cond[i - 3]) / 3 : null;
  const kf = drivers(a, i, "3m"), kfY = drivers(a, i, "yoy");
  const peers = areaList(a.kind === "prov" ? "prov" : "region").filter((x) => a.kind === "prov" ? x.region === a.region : true);
  const rank = attentionSort(peers, i).findIndex((x) => x.key === a.key) + 1;
  doPrint("summary", `<div class="pr one">
    <div class="prhead"><span class="wordmark">sapat<span>.</span></span><span>${a.kind === "prov" ? "Province" : "Region"} summary for LGU nutrition offices</span><span>${monthLong(m)} prices, printed ${today()}</span></div>
    <div class="prtitle"><div><h1>${esc(a.name)}</h1><p>${a.kind === "prov" ? `Province in ${esc(regionName(a.region))}` : "Region"}${a.kind === "prov" && !a.psa ? " (regional prices; no province survey)" : ""}</p></div>${tag(lv, "big")}</div>
    <p class="prsent">${esc(sentenceBare(a, m))} ${esc(why(a, m))}</p>
    <div class="nums">
      <div class="num"><span class="nl">Cost of a healthy day</span><b>${peso(a.cond[i])}</b><span class="nu">per person per day, ${monthLong(m)}</span></div>
      <div class="num"><span class="nl">Change vs past 3 months</span><b>${pctSigned(c3)}</b><span class="nu">vs ${peso(prev3)} average of the 3 months before</span></div>
      <div class="num"><span class="nl">Change vs last year</span><b>${pctSigned(y)}</b><span class="nu">vs ${i >= 12 ? peso(a.cond[i - 12]) + " in " + monthLong(D.months[i - 12]) : "–"}</span></div>
    </div>
    <div class="prgrid">
      <figure><figcaption><b>Cost of a healthy day, last 3 years</b> (₱ per person per day). Dashed: the Alert line, 10% above the 3 months before. ▲ Alert, ● Watch.</figcaption>${areaChart(a, i, { w: 520, h: 200 })}</figure>
      <div><h2>Key food prices</h2><table class="prt"><thead><tr><th>Food</th><th class="n">${monthName(m)}</th><th class="n">vs 3 mo.</th><th class="n">vs last yr</th></tr></thead><tbody>
        ${KEY_FOODS.map((f) => { const d = kf.find((x) => x.f.k === f.k), dy = kfY.find((x) => x.f.k === f.k), now = a.food(f.k, i); return `<tr><td>${f.label}<small>${f.unit}</small></td><td class="n">${now == null ? "–" : peso(now, 2)}</td><td class="n">${d ? pctSigned(d.chg) : "–"}</td><td class="n">${dy ? pctSigned(dy.chg) : "–"}</td></tr>`; }).join("")}</tbody></table>
        ${a.kind === "prov" ? `<p class="prnote">${rank === 1 ? "Most urgent" : `Number ${rank} by urgency`} of ${peers.length} provinces in ${esc(regionName(a.region))} this month.</p>` : ""}</div>
    </div>
    ${lv == null ? "" : `<div class="todo ${LEVELS[lv].k}"><h2>What you can do</h2><ul>${ACTIONS[lv].list.map(([ic, t]) => `<li>${icon(ic)}<span>${esc(t)}</span></li>`).join("")}</ul></div>`}
    <p class="prnote"><b>How the level is set.</b> Watch: at least 5% above the average of the 3 months before. Alert: at least 10% above that average, or at least 15% above the same month last year. Tested on ${monthName(BACKTEST.from)} to ${monthName(BACKTEST.to)} prices: about 1 false alert per province every ${Math.round(BACKTEST.yearsPerFalse)} years.</p>
    <p class="prnote"><b>Sources.</b> SAPAT cost of a healthy diet for a reference family of five (energy, protein, iron, vitamin A and calcium, PDRI 2015), from PSA OpenSTAT retail prices and DOST-FNRI PhilFCT. Key food prices: PSA retail prices.</p>
    <p class="prnote"><b>SAPAT is planning guidance for programs, not medical advice.</b> Diets for people who are ill, pregnant or under 5 should follow a doctor, a nutritionist-dietitian or the health center.</p></div>`);
}
function setupExports() {
  $("dlCsv").addEventListener("click", downloadCsv);
  $("dlXlsx").addEventListener("click", downloadXlsx);
  $("prTable").addEventListener("click", printTable);
}
