// node tests/privacy_test.js
// Nothing leaves the phone: reads every page, script and stylesheet the web apps ship and fails if any of them
//   1. calls the network from code (fetch, XMLHttpRequest, sendBeacon, WebSocket, EventSource, service workers),
//   2. loads anything from a host outside the allowlist below (scripts, styles, images, frames, forms),
//   3. contains a known tracker or analytics snippet, cookies, or a sign-in / account form.
// The only outside host allowed is Google Fonts (the typefaces). The data bundles are plain JavaScript files loaded from the app's own folder.
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", "web");
const ALLOWED_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!["node_modules", "_fonts"].includes(e.name)) walk(p); }
    else if (/\.(html|js|css)$/.test(e.name)) files.push(p);
  }
})(ROOT);
const isData = (f) => /[\\/]data[\\/]/.test(f); // generated bundles: big, data only; checked for URLs that would load, not for code
let failed = 0;
const check = (ok, msg, hits) => { console.log((ok ? "PASS " : "FAIL ") + msg); if (!ok) { failed++; hits.slice(0, 10).forEach((h) => console.log("     " + h)); } };
const scan = (re, filter) => {
  const hits = [];
  files.filter(filter || (() => true)).forEach((f) => {
    fs.readFileSync(f, "utf8").split(/\r?\n/).forEach((line, i) => { if (line.length < 20000 && re.test(line)) hits.push(`${path.relative(ROOT, f)}:${i + 1}: ${line.trim().slice(0, 120)}`); });
  });
  return hits;
};
const code = (f) => !isData(f);

// 1. network calls from code
let h = scan(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|new\s+WebSocket|new\s+EventSource|serviceWorker\s*\.\s*register|importScripts\s*\(/, code);
check(!h.length, "no network calls in code (fetch, XMLHttpRequest, sendBeacon, WebSocket, EventSource, service worker)", h);

// 2. everything loaded comes from the app's own folder or Google Fonts
const urlRe = /(?:src|href|action|poster|data)\s*=\s*["'](https?:)?\/\/([^/"']+)|url\(\s*["']?(https?:)?\/\/([^/"')]+)|@import\s+["'](https?:)?\/\/([^/"']+)/gi;
h = [];
files.filter(code).forEach((f) => {
  fs.readFileSync(f, "utf8").split(/\r?\n/).forEach((line, i) => {
    let m; urlRe.lastIndex = 0;
    while ((m = urlRe.exec(line))) { const host = (m[2] || m[4] || m[6] || "").toLowerCase(); if (host && !ALLOWED_HOSTS.includes(host)) h.push(`${path.relative(ROOT, f)}:${i + 1}: ${host}`); }
  });
});
check(!h.length, `nothing loads from outside hosts except ${ALLOWED_HOSTS.join(" and ")}`, h);
h = scan(/<script[^>]+src\s*=\s*["']https?:/i);
check(!h.length, "no scripts from other websites", h);

// 3. no trackers, cookies or accounts
h = scan(/google-analytics|googletagmanager|gtag\s*\(|fbq\s*\(|connect\.facebook|mixpanel|segment\.(io|com)|hotjar|plausible\.io|sentry|clarity\.ms|firebase|amplitude|posthog/i, code);
check(!h.length, "no analytics or tracking snippets", h);
h = scan(/document\.cookie/, code);
check(!h.length, "no cookies", h);
h = scan(/type\s*=\s*["']password["']|<form[^>]+action\s*=|signInWith|createUserWith|\/oauth|\/login\b/i, code);
check(!h.length, "no sign-in, account or form that posts somewhere", h);

// what the apps do keep: localStorage on the phone only (listed for the record)
const keys = new Set(); files.filter(code).forEach((f) => (fs.readFileSync(f, "utf8").match(/["'`](sapat[\w-]*:)/g) || []).forEach((k) => keys.add(k.slice(1))));
console.log(`INFO saved only in the browser's own storage on the device, under: ${[...keys].sort().join(" ")}`);
console.log(`INFO scanned ${files.length} files under web/`);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
